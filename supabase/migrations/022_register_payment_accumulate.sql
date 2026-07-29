-- ============================================================
-- DinoPay — Migration 022
-- Fecha: 2026-07-29
-- Descripción: register_payment acumula cuotas adelantadas
--   correctamente cuando se registran múltiples abonos el
--   mismo día.
--
-- Antes: next_due_date siempre anclada en v_today
--        → dos abonos el mismo día = misma ultima_cuota_fecha
-- Ahora: next_due_date se ancla en
--        GREATEST(v_today, ultima_cuota_fecha actual)
--        → cada abono acumula sobre el anterior
-- ============================================================

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
  v_base_date     date;
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
      -- Anclar en GREATEST(hoy, ultima_cuota_fecha) para acumular abonos del mismo día
      v_base_date     := GREATEST(v_today, COALESCE(v_loan.ultima_cuota_fecha, v_today));
      v_proxima_cuota := public.next_due_date(v_base_date, v_loan.modalidad, v_full_cuotas, v_dias_lab);
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
