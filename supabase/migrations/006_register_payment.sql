create or replace function register_payment(
  p_loan_id uuid,
  p_unit_id uuid,
  p_monto numeric,
  p_numero_cuotas integer,
  p_metodo_pago text
)
returns uuid as $$
declare
  v_payment_id uuid;
  v_loan record;
  v_new_saldo numeric;
  v_new_cuotas integer;
  v_today_dow integer;
  v_dias_laborales jsonb;
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

  select dias_laborales into v_dias_laborales
    from units
    where id = p_unit_id
      and activo = true;

  if v_dias_laborales is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  v_today_dow := extract(dow from current_date)::integer;

  if not (v_dias_laborales @> to_jsonb(v_today_dow)) then
    raise exception 'Hoy no es un dia laboral para esta unidad';
  end if;

  select *
  into v_loan
  from loans
  where id = p_loan_id
    and unit_id = p_unit_id
    and estado = 'activo'
  for update;

  if v_loan.id is null then
    raise exception 'Prestamo activo no encontrado';
  end if;

  v_new_saldo := greatest(v_loan.saldo - p_monto, 0);
  v_new_cuotas := least(v_loan.cuotas_pagadas + p_numero_cuotas, v_loan.numero_cuotas);

  insert into payments (
    loan_id,
    unit_id,
    monto,
    numero_cuotas,
    metodo_pago,
    fecha_pago
  )
  values (
    p_loan_id,
    p_unit_id,
    p_monto,
    p_numero_cuotas,
    p_metodo_pago,
    current_date
  )
  returning id into v_payment_id;

  update loans
  set saldo = v_new_saldo,
      cuotas_pagadas = v_new_cuotas,
      ultima_cuota_fecha = current_date,
      estado = case
        when v_new_saldo <= 0 or v_new_cuotas >= numero_cuotas then 'completado'
        else 'activo'
      end
  where id = p_loan_id;

  return v_payment_id;
end;
$$ language plpgsql security definer;
