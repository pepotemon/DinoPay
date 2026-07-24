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
  v_fecha_inicio date := current_date;
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
