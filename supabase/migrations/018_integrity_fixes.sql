-- ============================================================
-- DinoPay — Migration 018
-- Fecha: 2026-07-29
-- Descripción: Fixes de integridad financiera
--   1. Idempotencia en register_payment via client_key UUID
--   2. Fix timezone en delete_loan_same_day (usaba current_date UTC)
--   3. Fix rounding: préstamo completa cuando saldo < $0.05
--   4. Drop calculate_caja (buggy, nunca usada por el front-end)
-- ============================================================

-- ── 1. Columna de idempotencia en payments ──────────────────
ALTER TABLE payments
  ADD COLUMN IF NOT EXISTS client_key UUID;

CREATE UNIQUE INDEX IF NOT EXISTS idx_payments_client_key
  ON payments(client_key)
  WHERE client_key IS NOT NULL;

-- ── 2 + 3. register_payment con idempotencia y fix rounding ─
CREATE OR REPLACE FUNCTION register_payment(
  p_loan_id       uuid,
  p_unit_id       uuid,
  p_monto         numeric,
  p_numero_cuotas integer,
  p_metodo_pago   text,
  p_client_key    uuid DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_payment_id    uuid;
  v_loan          record;
  v_new_saldo     numeric;
  v_full_cuotas   integer;
  v_new_cuotas    integer;
  v_new_estado    text;
  v_proxima_cuota date;
  v_dias_lab      jsonb;
  v_today         date;
BEGIN
  -- Idempotencia: si ya existe un pago con esta clave, devolver el existente
  IF p_client_key IS NOT NULL THEN
    SELECT id INTO v_payment_id
      FROM payments
      WHERE client_key = p_client_key
        AND unit_id = p_unit_id;
    IF v_payment_id IS NOT NULL THEN
      RETURN v_payment_id;
    END IF;
  END IF;

  IF p_monto <= 0 THEN
    RAISE EXCEPTION 'El monto debe ser mayor a cero';
  END IF;

  IF p_numero_cuotas < 1 THEN
    RAISE EXCEPTION 'Debe registrar al menos una cuota';
  END IF;

  IF p_metodo_pago NOT IN ('efectivo', 'transferencia') THEN
    RAISE EXCEPTION 'Metodo de pago invalido';
  END IF;

  v_today := unit_today(p_unit_id);

  SELECT dias_laborales INTO v_dias_lab
    FROM units WHERE id = p_unit_id AND activo = TRUE;

  IF v_dias_lab IS NULL THEN
    RAISE EXCEPTION 'Unidad no encontrada o inactiva';
  END IF;

  IF NOT (v_dias_lab @> to_jsonb(EXTRACT(dow FROM v_today)::integer)) THEN
    RAISE EXCEPTION 'Hoy no es un dia laboral para esta unidad';
  END IF;

  SELECT * INTO v_loan
    FROM loans
    WHERE id = p_loan_id
      AND unit_id = p_unit_id
      AND estado = 'activo'
    FOR UPDATE;

  IF v_loan.id IS NULL THEN
    RAISE EXCEPTION 'Prestamo activo no encontrado';
  END IF;

  -- Cuotas completas que cubre el monto pagado
  v_full_cuotas := FLOOR(p_monto / v_loan.valor_cuota);
  v_new_saldo   := GREATEST(v_loan.saldo - p_monto, 0);
  v_new_cuotas  := LEAST(v_loan.cuotas_pagadas + v_full_cuotas, v_loan.numero_cuotas);

  -- Fix rounding: absorber artifact de centavos (< $0.05) para que el
  -- préstamo cierre en el último pago estándar sin necesitar cuota extra.
  IF v_new_saldo > 0 AND v_new_saldo < 0.05 THEN
    v_new_saldo := 0;
  END IF;

  v_new_estado := CASE
    WHEN v_new_saldo <= 0 THEN 'completado'
    ELSE 'activo'
  END;

  -- ultima_cuota_fecha solo avanza si se cubrieron cuotas completas
  IF v_new_estado = 'activo' THEN
    IF v_full_cuotas > 0 THEN
      v_proxima_cuota := next_due_date(v_today, v_loan.modalidad, v_full_cuotas, v_dias_lab);
    ELSE
      v_proxima_cuota := v_loan.ultima_cuota_fecha;
    END IF;
  ELSE
    v_proxima_cuota := NULL;
  END IF;

  INSERT INTO payments (loan_id, unit_id, monto, numero_cuotas, metodo_pago, fecha_pago, client_key)
    VALUES (p_loan_id, p_unit_id, p_monto, p_numero_cuotas, p_metodo_pago, v_today, p_client_key)
    RETURNING id INTO v_payment_id;

  UPDATE loans
    SET saldo              = v_new_saldo,
        cuotas_pagadas     = v_new_cuotas,
        ultima_cuota_fecha = v_proxima_cuota,
        estado             = v_new_estado
    WHERE id = p_loan_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 4. Fix delete_loan_same_day: usar zona horaria de la unidad ─
CREATE OR REPLACE FUNCTION delete_loan_same_day(
  p_loan_id uuid,
  p_unit_id uuid
)
RETURNS void AS $$
DECLARE
  v_loan  record;
  v_unit  record;
  v_tz    text;
  v_today date;
BEGIN
  v_today := unit_today(p_unit_id);

  SELECT zona_horaria INTO v_tz
    FROM units WHERE id = p_unit_id;
  v_tz := COALESCE(v_tz, 'America/Bogota');

  SELECT id, created_at INTO v_loan
    FROM loans
    WHERE id = p_loan_id
      AND unit_id = p_unit_id;

  IF v_loan.id IS NULL THEN
    RAISE EXCEPTION 'Prestamo no encontrado.';
  END IF;

  SELECT puede_eliminar_prestamos INTO v_unit
    FROM units
    WHERE id = p_unit_id AND activo = TRUE;

  IF v_unit.puede_eliminar_prestamos IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Esta unidad no tiene permiso para eliminar prestamos.';
  END IF;

  -- Comparar en la zona horaria local de la unidad (no en UTC)
  IF (v_loan.created_at AT TIME ZONE v_tz)::date <> v_today THEN
    RAISE EXCEPTION 'Solo se pueden eliminar prestamos creados hoy.';
  END IF;

  -- Bloquear si existe CUALQUIER pago (incluso eliminados) — conservar historial
  IF EXISTS (
    SELECT 1 FROM payments
    WHERE loan_id = p_loan_id AND unit_id = p_unit_id
  ) THEN
    RAISE EXCEPTION 'No se puede eliminar un prestamo que ya tiene abonos.';
  END IF;

  DELETE FROM loan_visits
    WHERE loan_id = p_loan_id AND unit_id = p_unit_id;

  DELETE FROM loans
    WHERE id = p_loan_id AND unit_id = p_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ── 5. Drop calculate_caja (usaba UTC, nunca llamada por el app) ─
DROP FUNCTION IF EXISTS calculate_caja(uuid, date);
