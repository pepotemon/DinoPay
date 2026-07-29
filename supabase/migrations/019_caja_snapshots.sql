-- ============================================================
-- DinoPay — Migration 019
-- Fecha: 2026-07-29
-- Descripción: Sistema de snapshots de caja para performance
--
-- Sin snapshots, la pantalla "Caja del Día" recalcula desde el
-- primer día cargando todos los pagos históricos. Con snapshots,
-- solo se cargan las transacciones desde el inicio del mes
-- anterior (~60 días) y el resto queda fijo en el snapshot.
--
-- Flujo:
--   1. La página llama ensure_caja_snapshot(unit_id, primer_dia_mes_anterior)
--   2. La función calcula (o devuelve el valor ya guardado) el total
--      acumulado de caja para todo lo anterior a esa fecha.
--   3. La página solo carga datos desde esa fecha en adelante.
--   4. Si se revierte un pago, el snapshot correspondiente se invalida.
-- ============================================================

-- ── Tabla de snapshots ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS caja_snapshots (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id      UUID NOT NULL REFERENCES units(id),
  -- Fecha exclusiva: acumula TODO lo anterior a esta fecha
  fecha_cierre DATE NOT NULL,
  valor_caja   NUMERIC(12,2) NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  UNIQUE (unit_id, fecha_cierre)
);

CREATE INDEX IF NOT EXISTS idx_caja_snapshots_unit
  ON caja_snapshots(unit_id, fecha_cierre);

ALTER TABLE caja_snapshots ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "unit_read_own_caja_snapshots" ON caja_snapshots;
CREATE POLICY "unit_read_own_caja_snapshots" ON caja_snapshots
  FOR SELECT USING (unit_id = auth.uid());

DROP POLICY IF EXISTS "admin_all_caja_snapshots" ON caja_snapshots;
CREATE POLICY "admin_all_caja_snapshots" ON caja_snapshots
  FOR ALL USING (is_admin());

-- ── Función: suma de caja hasta una fecha (exclusiva) ───────
-- Usa la zona horaria de la unidad para todas las comparaciones.
-- payments.fecha_pago ya está en fecha local (puesto por unit_today).
-- loans.created_at y capital_movements.created_at se convierten.
-- expenses.fecha ya está en fecha local.
CREATE OR REPLACE FUNCTION compute_caja_until(p_unit_id UUID, p_fecha DATE)
RETURNS NUMERIC AS $$
DECLARE
  v_tz              TEXT;
  v_capital_inicial NUMERIC;
  v_cobrado         NUMERIC;
  v_prestado        NUMERIC;
  v_gastos          NUMERIC;
  v_ingresos        NUMERIC;
  v_retiros         NUMERIC;
BEGIN
  SELECT zona_horaria, capital_inicial
    INTO v_tz, v_capital_inicial
    FROM units WHERE id = p_unit_id;

  v_tz := COALESCE(v_tz, 'America/Bogota');

  -- Pagos no eliminados antes de p_fecha (fecha_pago ya es fecha local)
  SELECT COALESCE(SUM(monto), 0) INTO v_cobrado
    FROM payments
    WHERE unit_id = p_unit_id
      AND fecha_pago < p_fecha
      AND eliminado = FALSE;

  -- Préstamos creados antes de p_fecha (convertir created_at a fecha local)
  SELECT COALESCE(SUM(valor_neto), 0) INTO v_prestado
    FROM loans
    WHERE unit_id = p_unit_id
      AND (created_at AT TIME ZONE v_tz)::date < p_fecha;

  -- Gastos aprobados antes de p_fecha (fecha ya es fecha local)
  SELECT COALESCE(SUM(monto), 0) INTO v_gastos
    FROM expenses
    WHERE unit_id = p_unit_id
      AND fecha < p_fecha
      AND estado = 'aprobado';

  -- Movimientos de capital (convertir created_at a fecha local)
  SELECT
    COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE 0 END), 0),
    COALESCE(SUM(CASE WHEN tipo = 'retiro'  THEN monto ELSE 0 END), 0)
  INTO v_ingresos, v_retiros
    FROM capital_movements
    WHERE unit_id = p_unit_id
      AND (created_at AT TIME ZONE v_tz)::date < p_fecha;

  RETURN v_capital_inicial + v_cobrado - v_prestado - v_gastos + v_ingresos - v_retiros;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── Función: obtener o crear snapshot para una fecha ────────
-- Idempotente: si ya existe, devuelve el valor guardado.
-- Solo crear snapshots para fechas en el pasado (no hoy).
CREATE OR REPLACE FUNCTION ensure_caja_snapshot(p_unit_id UUID, p_fecha_cierre DATE)
RETURNS NUMERIC AS $$
DECLARE
  v_valor NUMERIC;
BEGIN
  -- Devolver valor existente si ya está computado
  SELECT valor_caja INTO v_valor
    FROM caja_snapshots
    WHERE unit_id = p_unit_id AND fecha_cierre = p_fecha_cierre;

  IF v_valor IS NOT NULL THEN
    RETURN v_valor;
  END IF;

  -- Calcular y guardar
  v_valor := compute_caja_until(p_unit_id, p_fecha_cierre);

  INSERT INTO caja_snapshots (unit_id, fecha_cierre, valor_caja)
    VALUES (p_unit_id, p_fecha_cierre, v_valor)
    ON CONFLICT (unit_id, fecha_cierre) DO NOTHING;

  RETURN v_valor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── reverse_payment: invalidar snapshots afectados ──────────
-- Cuando se revierte un pago, todos los snapshots posteriores
-- a esa fecha ya no son válidos (incluyeron ese pago).
CREATE OR REPLACE FUNCTION reverse_payment(
  p_payment_id uuid,
  p_unit_id    uuid
)
RETURNS void AS $$
DECLARE
  v_payment     record;
  v_unit        record;
  v_full_cuotas integer;
  v_today       date;
BEGIN
  v_today := unit_today(p_unit_id);

  SELECT
    p.id,
    p.loan_id,
    p.monto,
    p.eliminado,
    p.fecha_pago,
    l.valor_cuota
  INTO v_payment
    FROM payments p
    JOIN loans l ON l.id = p.loan_id
    WHERE p.id  = p_payment_id
      AND p.unit_id = p_unit_id
      AND l.unit_id = p_unit_id;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Pago no encontrado.';
  END IF;

  IF v_payment.eliminado THEN
    RAISE EXCEPTION 'Este pago ya fue anulado.';
  END IF;

  SELECT puede_eliminar_abonos INTO v_unit
    FROM units WHERE id = p_unit_id AND activo = TRUE;

  IF v_unit.puede_eliminar_abonos IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Esta unidad no tiene permiso para eliminar abonos.';
  END IF;

  IF v_payment.fecha_pago <> v_today THEN
    RAISE EXCEPTION 'Solo se pueden eliminar abonos registrados hoy.';
  END IF;

  v_full_cuotas := FLOOR(v_payment.monto / v_payment.valor_cuota);

  -- Soft-delete del pago
  UPDATE payments
    SET eliminado    = TRUE,
        eliminado_at = NOW()
    WHERE id = p_payment_id;

  -- Revertir saldo y cuotas del préstamo
  UPDATE loans
    SET saldo          = LEAST(saldo + v_payment.monto, total_a_cobrar),
        cuotas_pagadas = GREATEST(cuotas_pagadas - v_full_cuotas, 0),
        estado         = CASE WHEN estado = 'completado' THEN 'activo' ELSE estado END
    WHERE id = v_payment.loan_id;

  -- Invalidar snapshots posteriores a este pago.
  -- El snapshot con fecha_cierre = fecha_del_pago cubre transacciones ANTES
  -- de esa fecha, por lo que NO incluye el pago de ese día → no se invalida.
  -- Los snapshots con fecha_cierre > fecha_del_pago SÍ lo incluyeron.
  DELETE FROM caja_snapshots
    WHERE unit_id    = p_unit_id
      AND fecha_cierre > v_payment.fecha_pago;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
