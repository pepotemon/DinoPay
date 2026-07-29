create or replace function unit_today(p_unit_id uuid)
returns date as $$
  select (now() at time zone coalesce(
    (select zona_horaria from units where id = p_unit_id),
    'America/Bogota'
  ))::date;
$$ language sql stable security definer;

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
  v_today         date;
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

  v_today := unit_today(p_unit_id);

  select dias_laborales into v_dias_lab
    from units where id = p_unit_id and activo = true;

  if v_dias_lab is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  if not (v_dias_lab @> to_jsonb(extract(dow from v_today)::integer)) then
    raise exception 'Hoy no es un dia laboral para esta unidad';
  end if;

  select * into v_loan
    from loans
    where id = p_loan_id and unit_id = p_unit_id and estado = 'activo'
    for update;

  if v_loan.id is null then
    raise exception 'Prestamo activo no encontrado';
  end if;

  v_full_cuotas := floor(p_monto / v_loan.valor_cuota);
  v_new_saldo  := greatest(v_loan.saldo - p_monto, 0);
  v_new_cuotas := least(v_loan.cuotas_pagadas + v_full_cuotas, v_loan.numero_cuotas);
  v_new_estado := case
    when v_new_saldo <= 0 then 'completado'
    else 'activo'
  end;

  if v_new_estado = 'activo' then
    if v_full_cuotas > 0 then
      v_proxima_cuota := next_due_date(v_today, v_loan.modalidad, v_full_cuotas, v_dias_lab);
    else
      v_proxima_cuota := v_loan.ultima_cuota_fecha;
    end if;
  else
    v_proxima_cuota := null;
  end if;

  insert into payments (loan_id, unit_id, monto, numero_cuotas, metodo_pago, fecha_pago)
    values (p_loan_id, p_unit_id, p_monto, p_numero_cuotas, p_metodo_pago, v_today)
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

create or replace function mark_no_pay_visit(
  p_loan_id uuid,
  p_unit_id uuid,
  p_nota text default null
)
returns uuid as $$
declare
  v_visit_id uuid;
  v_today date;
begin
  v_today := unit_today(p_unit_id);

  if not exists (
    select 1
    from loans
    where id = p_loan_id
      and unit_id = p_unit_id
      and estado = 'activo'
  ) then
    raise exception 'Prestamo activo no encontrado';
  end if;

  if exists (
    select 1
    from payments
    where loan_id = p_loan_id
      and unit_id = p_unit_id
      and fecha_pago = v_today
      and eliminado = false
  ) then
    raise exception 'Este prestamo ya tiene un pago registrado hoy';
  end if;

  insert into loan_visits (
    loan_id,
    unit_id,
    fecha,
    tipo,
    nota
  )
  values (
    p_loan_id,
    p_unit_id,
    v_today,
    'no_pago',
    nullif(p_nota, '')
  )
  on conflict (loan_id, fecha, tipo)
  do update set
    nota = excluded.nota,
    created_at = now()
  returning id into v_visit_id;

  return v_visit_id;
end;
$$ language plpgsql security definer;

create or replace function reverse_payment(
  p_payment_id uuid,
  p_unit_id uuid
)
returns void as $$
declare
  v_payment record;
  v_unit record;
  v_full_cuotas integer;
  v_today date;
begin
  v_today := unit_today(p_unit_id);

  select
    p.id,
    p.loan_id,
    p.monto,
    p.eliminado,
    p.fecha_pago,
    l.valor_cuota
  into v_payment
  from payments p
  join loans l on l.id = p.loan_id
  where p.id = p_payment_id
    and p.unit_id = p_unit_id
    and l.unit_id = p_unit_id;

  if v_payment.id is null then
    raise exception 'Pago no encontrado.';
  end if;

  if v_payment.eliminado then
    raise exception 'Este pago ya fue anulado.';
  end if;

  select puede_eliminar_abonos
  into v_unit
  from units
  where id = p_unit_id
    and activo = true;

  if v_unit.puede_eliminar_abonos is distinct from true then
    raise exception 'Esta unidad no tiene permiso para eliminar abonos.';
  end if;

  if v_payment.fecha_pago <> v_today then
    raise exception 'Solo se pueden eliminar abonos registrados hoy.';
  end if;

  v_full_cuotas := floor(v_payment.monto / v_payment.valor_cuota);

  update payments
  set eliminado     = true,
      eliminado_at  = now()
  where id = p_payment_id;

  update loans
  set saldo          = least(saldo + v_payment.monto, total_a_cobrar),
      cuotas_pagadas = greatest(cuotas_pagadas - v_full_cuotas, 0),
      estado         = case when estado = 'completado' then 'activo' else estado end
  where id = v_payment.loan_id;
end;
$$ language plpgsql security definer;

create or replace function create_client_with_loan(
  p_unit_id uuid,
  p_alias text,
  p_nit text,
  p_direccion1 text,
  p_direccion2 text,
  p_barrio text,
  p_telefono1 text,
  p_telefono2 text,
  p_genero text,
  p_modalidad text,
  p_interes numeric,
  p_valor_neto numeric,
  p_numero_cuotas integer
)
returns uuid as $$
declare
  v_client_id uuid;
  v_loan_id uuid;
  v_total_a_cobrar numeric;
  v_valor_cuota numeric;
  v_posicion integer;
  v_fecha_inicio date := unit_today(p_unit_id);
  v_fecha_fin date;
  v_dias_laborales jsonb;
  v_cursor date;
  v_added integer := 0;
begin
  select dias_laborales into v_dias_laborales
    from units
    where id = p_unit_id
      and activo = true;

  if v_dias_laborales is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  if not exists (
    select 1
    from units
    where id = p_unit_id
      and intereses @> to_jsonb(p_interes)
  ) then
    raise exception 'Interes no habilitado para esta unidad';
  end if;

  if p_modalidad not in ('diaria', 'semanal', 'quincenal', 'mensual') then
    raise exception 'Modalidad invalida';
  end if;

  if p_valor_neto <= 0 or p_numero_cuotas < 1 then
    raise exception 'Datos de prestamo invalidos';
  end if;

  v_total_a_cobrar := round(p_valor_neto * (1 + p_interes / 100), 2);
  v_valor_cuota := round(v_total_a_cobrar / p_numero_cuotas, 2);

  if p_modalidad = 'diaria' then
    v_cursor := v_fecha_inicio;
    while v_added < p_numero_cuotas loop
      v_cursor := v_cursor + interval '1 day';
      if v_dias_laborales @> to_jsonb(extract(dow from v_cursor)::integer) then
        v_added := v_added + 1;
      end if;
    end loop;
    v_fecha_fin := v_cursor;
  elsif p_modalidad = 'semanal' then
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * interval '1 week');
  elsif p_modalidad = 'quincenal' then
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * interval '15 days');
  else
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * interval '1 month');
  end if;

  select coalesce(max(posicion), 0) + 1 into v_posicion
    from loans
    where unit_id = p_unit_id
      and estado = 'activo';

  insert into clients (
    unit_id,
    alias,
    nit,
    direccion1,
    direccion2,
    barrio,
    telefono1,
    telefono2,
    genero
  )
  values (
    p_unit_id,
    p_alias,
    nullif(p_nit, ''),
    nullif(p_direccion1, ''),
    nullif(p_direccion2, ''),
    nullif(p_barrio, ''),
    nullif(p_telefono1, ''),
    nullif(p_telefono2, ''),
    nullif(p_genero, '')
  )
  returning id into v_client_id;

  insert into loans (
    unit_id,
    client_id,
    modalidad,
    interes,
    valor_neto,
    numero_cuotas,
    valor_cuota,
    total_a_cobrar,
    saldo,
    estado,
    posicion,
    fecha_inicio,
    fecha_fin
  )
  values (
    p_unit_id,
    v_client_id,
    p_modalidad,
    p_interes,
    p_valor_neto,
    p_numero_cuotas,
    v_valor_cuota,
    v_total_a_cobrar,
    v_total_a_cobrar,
    'activo',
    v_posicion,
    v_fecha_inicio,
    v_fecha_fin
  )
  returning id into v_loan_id;

  return v_loan_id;
end;
$$ language plpgsql security definer;

create or replace function create_loan_for_existing_client(
  p_unit_id uuid,
  p_client_id uuid,
  p_modalidad text,
  p_interes numeric,
  p_valor_neto numeric,
  p_numero_cuotas integer
)
returns uuid as $$
declare
  v_loan_id uuid;
  v_total_a_cobrar numeric;
  v_valor_cuota numeric;
  v_posicion integer;
  v_previous_posicion integer;
  v_fecha_inicio date := unit_today(p_unit_id);
  v_fecha_fin date;
  v_dias_laborales jsonb;
  v_cursor date;
  v_added integer := 0;
begin
  select dias_laborales into v_dias_laborales
    from units
    where id = p_unit_id
      and activo = true;

  if v_dias_laborales is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  if not exists (
    select 1
    from clients
    where id = p_client_id
      and unit_id = p_unit_id
      and activo = true
  ) then
    raise exception 'Cliente no encontrado o inactivo';
  end if;

  if exists (
    select 1
    from loans
    where client_id = p_client_id
      and estado = 'activo'
  ) then
    raise exception 'Este cliente ya tiene un prestamo activo';
  end if;

  if not exists (
    select 1
    from units
    where id = p_unit_id
      and intereses @> to_jsonb(p_interes)
  ) then
    raise exception 'Interes no habilitado para esta unidad';
  end if;

  if p_modalidad not in ('diaria', 'semanal', 'quincenal', 'mensual') then
    raise exception 'Modalidad invalida';
  end if;

  if p_valor_neto <= 0 or p_numero_cuotas < 1 then
    raise exception 'Datos de prestamo invalidos';
  end if;

  v_total_a_cobrar := round(p_valor_neto * (1 + p_interes / 100), 2);
  v_valor_cuota := round(v_total_a_cobrar / p_numero_cuotas, 2);

  if p_modalidad = 'diaria' then
    v_cursor := v_fecha_inicio;
    while v_added < p_numero_cuotas loop
      v_cursor := v_cursor + interval '1 day';
      if v_dias_laborales @> to_jsonb(extract(dow from v_cursor)::integer) then
        v_added := v_added + 1;
      end if;
    end loop;
    v_fecha_fin := v_cursor;
  elsif p_modalidad = 'semanal' then
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * interval '1 week');
  elsif p_modalidad = 'quincenal' then
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * interval '15 days');
  else
    v_fecha_fin := v_fecha_inicio + (p_numero_cuotas * interval '1 month');
  end if;

  select posicion into v_previous_posicion
    from loans
    where client_id = p_client_id
      and unit_id = p_unit_id
      and posicion is not null
    order by created_at desc
    limit 1;

  if v_previous_posicion is not null then
    update loans
    set posicion = posicion + 1
    where unit_id = p_unit_id
      and estado = 'activo'
      and posicion >= v_previous_posicion;

    v_posicion := v_previous_posicion;
  else
    select coalesce(max(posicion), 0) + 1 into v_posicion
      from loans
      where unit_id = p_unit_id
        and estado = 'activo';
  end if;

  insert into loans (
    unit_id,
    client_id,
    modalidad,
    interes,
    valor_neto,
    numero_cuotas,
    valor_cuota,
    total_a_cobrar,
    saldo,
    estado,
    posicion,
    fecha_inicio,
    fecha_fin
  )
  values (
    p_unit_id,
    p_client_id,
    p_modalidad,
    p_interes,
    p_valor_neto,
    p_numero_cuotas,
    v_valor_cuota,
    v_total_a_cobrar,
    v_total_a_cobrar,
    'activo',
    v_posicion,
    v_fecha_inicio,
    v_fecha_fin
  )
  returning id into v_loan_id;

  return v_loan_id;
end;
$$ language plpgsql security definer;
