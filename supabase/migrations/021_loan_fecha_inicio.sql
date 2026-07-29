-- ============================================================
-- DinoPay — Migration 021
-- Fecha: 2026-07-29
-- Descripción: fecha_inicio = primer día de pago (día laboral
--   siguiente a la creación), y ultima_cuota_fecha se inicializa
--   en ese mismo valor al crear el préstamo.
--
-- Antes: fecha_inicio = hoy, ultima_cuota_fecha = NULL
-- Ahora: fecha_inicio = mañana (siguiente día laboral)
--        ultima_cuota_fecha = fecha_inicio  ← activa la píldora
--          de adelantadas/atraso desde el día 1
-- ============================================================

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
  v_hoy            date := public.unit_today(p_unit_id);
  v_fecha_inicio   date;   -- primer día de pago del cliente
  v_fecha_fin      date;   -- último día de pago (Nth cuota)
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
    v_cursor := v_hoy;
    WHILE v_added < p_numero_cuotas LOOP
      v_cursor := v_cursor + INTERVAL '1 day';
      IF v_dias_laborales @> to_jsonb(EXTRACT(dow FROM v_cursor)::integer) THEN
        v_added := v_added + 1;
        IF v_added = 1 THEN v_fecha_inicio := v_cursor; END IF;
      END IF;
    END LOOP;
    v_fecha_fin := v_cursor;
  ELSIF p_modalidad = 'semanal' THEN
    v_fecha_inicio := v_hoy + INTERVAL '1 week';
    v_fecha_fin    := v_hoy + (p_numero_cuotas * INTERVAL '1 week');
  ELSIF p_modalidad = 'quincenal' THEN
    v_fecha_inicio := v_hoy + INTERVAL '15 days';
    v_fecha_fin    := v_hoy + (p_numero_cuotas * INTERVAL '15 days');
  ELSE
    v_fecha_inicio := v_hoy + INTERVAL '1 month';
    v_fecha_fin    := v_hoy + (p_numero_cuotas * INTERVAL '1 month');
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
    valor_cuota, total_a_cobrar, saldo, estado, posicion,
    fecha_inicio, fecha_fin, ultima_cuota_fecha
  ) VALUES (
    p_unit_id, v_client_id, p_modalidad, p_interes, p_valor_neto, p_numero_cuotas,
    v_valor_cuota, v_total_a_cobrar, v_total_a_cobrar, 'activo', v_posicion,
    v_fecha_inicio, v_fecha_fin, v_fecha_inicio
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
  v_hoy               date := public.unit_today(p_unit_id);
  v_fecha_inicio      date;
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
    v_cursor := v_hoy;
    WHILE v_added < p_numero_cuotas LOOP
      v_cursor := v_cursor + INTERVAL '1 day';
      IF v_dias_laborales @> to_jsonb(EXTRACT(dow FROM v_cursor)::integer) THEN
        v_added := v_added + 1;
        IF v_added = 1 THEN v_fecha_inicio := v_cursor; END IF;
      END IF;
    END LOOP;
    v_fecha_fin := v_cursor;
  ELSIF p_modalidad = 'semanal' THEN
    v_fecha_inicio := v_hoy + INTERVAL '1 week';
    v_fecha_fin    := v_hoy + (p_numero_cuotas * INTERVAL '1 week');
  ELSIF p_modalidad = 'quincenal' THEN
    v_fecha_inicio := v_hoy + INTERVAL '15 days';
    v_fecha_fin    := v_hoy + (p_numero_cuotas * INTERVAL '15 days');
  ELSE
    v_fecha_inicio := v_hoy + INTERVAL '1 month';
    v_fecha_fin    := v_hoy + (p_numero_cuotas * INTERVAL '1 month');
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
    valor_cuota, total_a_cobrar, saldo, estado, posicion,
    fecha_inicio, fecha_fin, ultima_cuota_fecha
  ) VALUES (
    p_unit_id, p_client_id, p_modalidad, p_interes, p_valor_neto, p_numero_cuotas,
    v_valor_cuota, v_total_a_cobrar, v_total_a_cobrar, 'activo', v_posicion,
    v_fecha_inicio, v_fecha_fin, v_fecha_inicio
  )
  RETURNING id INTO v_loan_id;

  RETURN v_loan_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public, pg_catalog;
