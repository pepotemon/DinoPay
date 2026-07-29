-- ============================================================
-- DinoPay — Migration 020
-- Fecha: 2026-07-29
-- Descripción: Fix search_path en funciones SECURITY DEFINER
--
-- Supabase aplica un search_path restringido para funciones
-- SECURITY DEFINER. Todas las llamadas internas a unit_today,
-- next_due_date, etc. deben usar el prefijo public. explícito.
-- ============================================================

-- ── unit_today: calificar su propia consulta interna ────────
CREATE OR REPLACE FUNCTION public.unit_today(p_unit_id uuid)
RETURNS date AS $$
  SELECT (now() AT TIME ZONE COALESCE(
    (SELECT zona_horaria FROM public.units WHERE id = p_unit_id),
    'America/Bogota'
  ))::date;
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public, pg_catalog;

-- ── mark_no_pay_visit ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.mark_no_pay_visit(
  p_loan_id uuid,
  p_unit_id uuid,
  p_nota    text DEFAULT NULL
)
RETURNS uuid AS $$
DECLARE
  v_visit_id uuid;
  v_today    date;
BEGIN
  v_today := public.unit_today(p_unit_id);

  IF NOT EXISTS (
    SELECT 1 FROM public.loans
    WHERE id = p_loan_id AND unit_id = p_unit_id AND estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'Prestamo activo no encontrado';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE loan_id = p_loan_id
      AND unit_id = p_unit_id
      AND fecha_pago = v_today
      AND eliminado = FALSE
  ) THEN
    RAISE EXCEPTION 'Este prestamo ya tiene un pago registrado hoy';
  END IF;

  INSERT INTO public.loan_visits (loan_id, unit_id, fecha, tipo, nota)
  VALUES (p_loan_id, p_unit_id, v_today, 'no_pago', NULLIF(p_nota, ''))
  ON CONFLICT (loan_id, fecha, tipo)
  DO UPDATE SET nota = EXCLUDED.nota, created_at = NOW()
  RETURNING id INTO v_visit_id;

  RETURN v_visit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ── register_payment ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.register_payment(
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
  IF p_client_key IS NOT NULL THEN
    SELECT id INTO v_payment_id
      FROM public.payments
      WHERE client_key = p_client_key AND unit_id = p_unit_id;
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

  v_today := public.unit_today(p_unit_id);

  SELECT dias_laborales INTO v_dias_lab
    FROM public.units WHERE id = p_unit_id AND activo = TRUE;

  IF v_dias_lab IS NULL THEN
    RAISE EXCEPTION 'Unidad no encontrada o inactiva';
  END IF;

  IF NOT (v_dias_lab @> to_jsonb(EXTRACT(dow FROM v_today)::integer)) THEN
    RAISE EXCEPTION 'Hoy no es un dia laboral para esta unidad';
  END IF;

  SELECT * INTO v_loan
    FROM public.loans
    WHERE id = p_loan_id AND unit_id = p_unit_id AND estado = 'activo'
    FOR UPDATE;

  IF v_loan.id IS NULL THEN
    RAISE EXCEPTION 'Prestamo activo no encontrado';
  END IF;

  v_full_cuotas := FLOOR(p_monto / v_loan.valor_cuota);
  v_new_saldo   := GREATEST(v_loan.saldo - p_monto, 0);
  v_new_cuotas  := LEAST(v_loan.cuotas_pagadas + v_full_cuotas, v_loan.numero_cuotas);

  IF v_new_saldo > 0 AND v_new_saldo < 0.05 THEN
    v_new_saldo := 0;
  END IF;

  v_new_estado := CASE WHEN v_new_saldo <= 0 THEN 'completado' ELSE 'activo' END;

  IF v_new_estado = 'activo' THEN
    IF v_full_cuotas > 0 THEN
      v_proxima_cuota := public.next_due_date(v_today, v_loan.modalidad, v_full_cuotas, v_dias_lab);
    ELSE
      v_proxima_cuota := v_loan.ultima_cuota_fecha;
    END IF;
  ELSE
    v_proxima_cuota := NULL;
  END IF;

  INSERT INTO public.payments (loan_id, unit_id, monto, numero_cuotas, metodo_pago, fecha_pago, client_key)
    VALUES (p_loan_id, p_unit_id, p_monto, p_numero_cuotas, p_metodo_pago, v_today, p_client_key)
    RETURNING id INTO v_payment_id;

  UPDATE public.loans
    SET saldo              = v_new_saldo,
        cuotas_pagadas     = v_new_cuotas,
        ultima_cuota_fecha = v_proxima_cuota,
        estado             = v_new_estado
    WHERE id = p_loan_id;

  RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ── delete_loan_same_day ─────────────────────────────────────
CREATE OR REPLACE FUNCTION public.delete_loan_same_day(
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
  v_today := public.unit_today(p_unit_id);

  SELECT zona_horaria INTO v_tz FROM public.units WHERE id = p_unit_id;
  v_tz := COALESCE(v_tz, 'America/Bogota');

  SELECT id, created_at INTO v_loan
    FROM public.loans WHERE id = p_loan_id AND unit_id = p_unit_id;

  IF v_loan.id IS NULL THEN
    RAISE EXCEPTION 'Prestamo no encontrado.';
  END IF;

  SELECT puede_eliminar_prestamos INTO v_unit
    FROM public.units WHERE id = p_unit_id AND activo = TRUE;

  IF v_unit.puede_eliminar_prestamos IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Esta unidad no tiene permiso para eliminar prestamos.';
  END IF;

  IF (v_loan.created_at AT TIME ZONE v_tz)::date <> v_today THEN
    RAISE EXCEPTION 'Solo se pueden eliminar prestamos creados hoy.';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.payments
    WHERE loan_id = p_loan_id AND unit_id = p_unit_id
  ) THEN
    RAISE EXCEPTION 'No se puede eliminar un prestamo que ya tiene abonos.';
  END IF;

  DELETE FROM public.loan_visits WHERE loan_id = p_loan_id AND unit_id = p_unit_id;
  DELETE FROM public.loans WHERE id = p_loan_id AND unit_id = p_unit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ── reverse_payment ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.reverse_payment(
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
  v_today := public.unit_today(p_unit_id);

  SELECT
    p.id, p.loan_id, p.monto, p.eliminado, p.fecha_pago, l.valor_cuota
  INTO v_payment
    FROM public.payments p
    JOIN public.loans l ON l.id = p.loan_id
    WHERE p.id = p_payment_id
      AND p.unit_id = p_unit_id
      AND l.unit_id = p_unit_id;

  IF v_payment.id IS NULL THEN
    RAISE EXCEPTION 'Pago no encontrado.';
  END IF;

  IF v_payment.eliminado THEN
    RAISE EXCEPTION 'Este pago ya fue anulado.';
  END IF;

  SELECT puede_eliminar_abonos INTO v_unit
    FROM public.units WHERE id = p_unit_id AND activo = TRUE;

  IF v_unit.puede_eliminar_abonos IS DISTINCT FROM TRUE THEN
    RAISE EXCEPTION 'Esta unidad no tiene permiso para eliminar abonos.';
  END IF;

  IF v_payment.fecha_pago <> v_today THEN
    RAISE EXCEPTION 'Solo se pueden eliminar abonos registrados hoy.';
  END IF;

  v_full_cuotas := FLOOR(v_payment.monto / v_payment.valor_cuota);

  UPDATE public.payments
    SET eliminado    = TRUE,
        eliminado_at = NOW()
    WHERE id = p_payment_id;

  UPDATE public.loans
    SET saldo          = LEAST(saldo + v_payment.monto, total_a_cobrar),
        cuotas_pagadas = GREATEST(cuotas_pagadas - v_full_cuotas, 0),
        estado         = CASE WHEN estado = 'completado' THEN 'activo' ELSE estado END
    WHERE id = v_payment.loan_id;

  DELETE FROM public.caja_snapshots
    WHERE unit_id = p_unit_id AND fecha_cierre > v_payment.fecha_pago;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ── create_client_with_loan ──────────────────────────────────
CREATE OR REPLACE FUNCTION public.create_client_with_loan(
  p_unit_id       uuid,
  p_alias         text,
  p_nit           text,
  p_direccion1    text,
  p_direccion2    text,
  p_barrio        text,
  p_telefono1     text,
  p_telefono2     text,
  p_genero        text,
  p_modalidad     text,
  p_interes       numeric,
  p_valor_neto    numeric,
  p_numero_cuotas integer
)
RETURNS uuid AS $$
DECLARE
  v_client_id      uuid;
  v_loan_id        uuid;
  v_total_a_cobrar numeric;
  v_valor_cuota    numeric;
  v_posicion       integer;
  v_fecha_inicio   date := public.unit_today(p_unit_id);
  v_fecha_fin      date;
  v_dias_laborales jsonb;
  v_cursor         date;
  v_added          integer := 0;
BEGIN
  SELECT dias_laborales INTO v_dias_laborales
    FROM public.units WHERE id = p_unit_id AND activo = TRUE;

  IF v_dias_laborales IS NULL THEN
    RAISE EXCEPTION 'Unidad no encontrada o inactiva';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.units
    WHERE id = p_unit_id AND intereses @> to_jsonb(p_interes)
  ) THEN
    RAISE EXCEPTION 'Interes no habilitado para esta unidad';
  END IF;

  IF p_modalidad NOT IN ('diaria', 'semanal', 'quincenal', 'mensual') THEN
    RAISE EXCEPTION 'Modalidad invalida';
  END IF;

  IF p_valor_neto <= 0 OR p_numero_cuotas < 1 THEN
    RAISE EXCEPTION 'Datos de prestamo invalidos';
  END IF;

  v_total_a_cobrar := ROUND(p_valor_neto * (1 + p_interes / 100), 2);
  v_valor_cuota    := ROUND(v_total_a_cobrar / p_numero_cuotas, 2);

  IF p_modalidad = 'diaria' THEN
    v_cursor := v_fecha_inicio;
    WHILE v_added < p_numero_cuotas LOOP
      v_cursor := v_cursor + INTERVAL '1 day';
      IF v_dias_laborales @> to_jsonb(EXTRACT(dow FROM v_cursor)::integer) THEN
        v_added := v_added + 1;
      END IF;
    END LOOP;
    v_fecha_fin := v_cursor;
  ELSIF p_modalidad = 'semanal' THEN
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * INTERVAL '1 week');
  ELSIF p_modalidad = 'quincenal' THEN
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * INTERVAL '15 days');
  ELSE
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * INTERVAL '1 month');
  END IF;

  SELECT COALESCE(MAX(posicion), 0) + 1 INTO v_posicion
    FROM public.loans WHERE unit_id = p_unit_id AND estado = 'activo';

  INSERT INTO public.clients (
    unit_id, alias, nit, direccion1, direccion2, barrio, telefono1, telefono2, genero
  ) VALUES (
    p_unit_id, p_alias, NULLIF(p_nit, ''), NULLIF(p_direccion1, ''),
    NULLIF(p_direccion2, ''), NULLIF(p_barrio, ''), NULLIF(p_telefono1, ''),
    NULLIF(p_telefono2, ''), NULLIF(p_genero, '')
  )
  RETURNING id INTO v_client_id;

  INSERT INTO public.loans (
    unit_id, client_id, modalidad, interes, valor_neto, numero_cuotas,
    valor_cuota, total_a_cobrar, saldo, estado, posicion, fecha_inicio, fecha_fin
  ) VALUES (
    p_unit_id, v_client_id, p_modalidad, p_interes, p_valor_neto, p_numero_cuotas,
    v_valor_cuota, v_total_a_cobrar, v_total_a_cobrar, 'activo', v_posicion,
    v_fecha_inicio, v_fecha_fin
  )
  RETURNING id INTO v_loan_id;

  RETURN v_loan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;

-- ── create_loan_for_existing_client ─────────────────────────
CREATE OR REPLACE FUNCTION public.create_loan_for_existing_client(
  p_unit_id       uuid,
  p_client_id     uuid,
  p_modalidad     text,
  p_interes       numeric,
  p_valor_neto    numeric,
  p_numero_cuotas integer
)
RETURNS uuid AS $$
DECLARE
  v_loan_id           uuid;
  v_total_a_cobrar    numeric;
  v_valor_cuota       numeric;
  v_posicion          integer;
  v_previous_posicion integer;
  v_fecha_inicio      date := public.unit_today(p_unit_id);
  v_fecha_fin         date;
  v_dias_laborales    jsonb;
  v_cursor            date;
  v_added             integer := 0;
BEGIN
  SELECT dias_laborales INTO v_dias_laborales
    FROM public.units WHERE id = p_unit_id AND activo = TRUE;

  IF v_dias_laborales IS NULL THEN
    RAISE EXCEPTION 'Unidad no encontrada o inactiva';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.clients
    WHERE id = p_client_id AND unit_id = p_unit_id AND activo = TRUE
  ) THEN
    RAISE EXCEPTION 'Cliente no encontrado o inactivo';
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.loans
    WHERE client_id = p_client_id AND estado = 'activo'
  ) THEN
    RAISE EXCEPTION 'Este cliente ya tiene un prestamo activo';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.units
    WHERE id = p_unit_id AND intereses @> to_jsonb(p_interes)
  ) THEN
    RAISE EXCEPTION 'Interes no habilitado para esta unidad';
  END IF;

  IF p_modalidad NOT IN ('diaria', 'semanal', 'quincenal', 'mensual') THEN
    RAISE EXCEPTION 'Modalidad invalida';
  END IF;

  IF p_valor_neto <= 0 OR p_numero_cuotas < 1 THEN
    RAISE EXCEPTION 'Datos de prestamo invalidos';
  END IF;

  v_total_a_cobrar := ROUND(p_valor_neto * (1 + p_interes / 100), 2);
  v_valor_cuota    := ROUND(v_total_a_cobrar / p_numero_cuotas, 2);

  IF p_modalidad = 'diaria' THEN
    v_cursor := v_fecha_inicio;
    WHILE v_added < p_numero_cuotas LOOP
      v_cursor := v_cursor + INTERVAL '1 day';
      IF v_dias_laborales @> to_jsonb(EXTRACT(dow FROM v_cursor)::integer) THEN
        v_added := v_added + 1;
      END IF;
    END LOOP;
    v_fecha_fin := v_cursor;
  ELSIF p_modalidad = 'semanal' THEN
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * INTERVAL '1 week');
  ELSIF p_modalidad = 'quincenal' THEN
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * INTERVAL '15 days');
  ELSE
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * INTERVAL '1 month');
  END IF;

  SELECT posicion INTO v_previous_posicion
    FROM public.loans
    WHERE client_id = p_client_id AND unit_id = p_unit_id AND posicion IS NOT NULL
    ORDER BY created_at DESC
    LIMIT 1;

  IF v_previous_posicion IS NOT NULL THEN
    UPDATE public.loans
      SET posicion = posicion + 1
      WHERE unit_id = p_unit_id AND estado = 'activo' AND posicion >= v_previous_posicion;
    v_posicion := v_previous_posicion;
  ELSE
    SELECT COALESCE(MAX(posicion), 0) + 1 INTO v_posicion
      FROM public.loans WHERE unit_id = p_unit_id AND estado = 'activo';
  END IF;

  INSERT INTO public.loans (
    unit_id, client_id, modalidad, interes, valor_neto, numero_cuotas,
    valor_cuota, total_a_cobrar, saldo, estado, posicion, fecha_inicio, fecha_fin
  ) VALUES (
    p_unit_id, p_client_id, p_modalidad, p_interes, p_valor_neto, p_numero_cuotas,
    v_valor_cuota, v_total_a_cobrar, v_total_a_cobrar, 'activo', v_posicion,
    v_fecha_inicio, v_fecha_fin
  )
  RETURNING id INTO v_loan_id;

  RETURN v_loan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
