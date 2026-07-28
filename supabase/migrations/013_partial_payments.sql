-- ============================================================
-- DinoPay — Migration 013
-- Fecha: 2026-07-27
-- Descripción: Soporte para pagos parciales en register_payment
--   - ultima_cuota_fecha solo avanza cuando el monto cubre
--     al menos una cuota completa
--   - cuotas_pagadas avanza por cuotas COMPLETAS (floor)
--   - saldo siempre se reduce por el monto real pagado
-- ============================================================

create or replace function register_payment(
  p_loan_id      uuid,
  p_unit_id      uuid,
  p_monto        numeric,
  p_numero_cuotas integer,
  p_metodo_pago  text
)
returns uuid as $$
declare
  v_payment_id    uuid;
  v_loan          record;
  v_new_saldo     numeric;
  v_full_cuotas   integer;
  v_new_cuotas    integer;
  v_new_estado    text;
  v_proxima_cuota date;
  v_dias_lab      jsonb;
begin
  if p_monto <= 0 then
    raise exception 'El monto debe ser mayor a cero';
  end if;

  if p_numero_cuotas < 1 then
    raise exception 'Debe registrar al menos una cuota';
  end if;

  if p_metodo_pago not in ('efectivo', 'transferencia') then
    raise exception 'Metodo de pago invalido';
  end if;

  select dias_laborales into v_dias_lab
    from units where id = p_unit_id and activo = true;

  if v_dias_lab is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  if not (v_dias_lab @> to_jsonb(extract(dow from current_date)::integer)) then
    raise exception 'Hoy no es un dia laboral para esta unidad';
  end if;

  select * into v_loan
    from loans
    where id = p_loan_id and unit_id = p_unit_id and estado = 'activo'
    for update;

  if v_loan.id is null then
    raise exception 'Prestamo activo no encontrado';
  end if;

  -- Cuotas completas que cubre el monto pagado
  v_full_cuotas := floor(p_monto / v_loan.valor_cuota);

  v_new_saldo  := greatest(v_loan.saldo - p_monto, 0);
  v_new_cuotas := least(v_loan.cuotas_pagadas + v_full_cuotas, v_loan.numero_cuotas);
  v_new_estado := case
    when v_new_saldo <= 0 then 'completado'
    else 'activo'
  end;

  -- ultima_cuota_fecha solo avanza si se pagaron cuotas completas
  if v_new_estado = 'activo' then
    if v_full_cuotas > 0 then
      v_proxima_cuota := next_due_date(current_date, v_loan.modalidad, v_full_cuotas, v_dias_lab);
    else
      v_proxima_cuota := v_loan.ultima_cuota_fecha;
    end if;
  else
    v_proxima_cuota := null;
  end if;

  insert into payments (loan_id, unit_id, monto, numero_cuotas, metodo_pago, fecha_pago)
    values (p_loan_id, p_unit_id, p_monto, p_numero_cuotas, p_metodo_pago, current_date)
    returning id into v_payment_id;

  update loans
    set saldo              = v_new_saldo,
        cuotas_pagadas     = v_new_cuotas,
        ultima_cuota_fecha = v_proxima_cuota,
        estado             = v_new_estado
    where id = p_loan_id;

  return v_payment_id;
end;
$$ language plpgsql security definer;
