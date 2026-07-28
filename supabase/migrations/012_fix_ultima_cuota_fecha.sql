-- ============================================================
-- DinoPay — Migration 012
-- Fecha: 2026-07-27
-- Descripción: Calcula correctamente la próxima fecha de cuota
-- ============================================================

-- ── Helper: calcula la próxima fecha de cuota a partir de una fecha base ──
create or replace function next_due_date(
  p_from     date,
  p_modalidad text,
  p_cuotas   integer,        -- cuántas cuotas se avanzan (normalmente 1)
  p_dias_lab jsonb            -- días laborales de la unidad [0-6]
)
returns date as $$
declare
  v_cursor date := p_from;
  v_added  integer := 0;
begin
  if p_modalidad = 'diaria' then
    -- avanza N días laborales
    while v_added < p_cuotas loop
      v_cursor := v_cursor + interval '1 day';
      if p_dias_lab @> to_jsonb(extract(dow from v_cursor)::integer) then
        v_added := v_added + 1;
      end if;
    end loop;
    return v_cursor;
  elsif p_modalidad = 'semanal' then
    return p_from + (p_cuotas * interval '1 week');
  elsif p_modalidad = 'quincenal' then
    return p_from + (p_cuotas * interval '15 days');
  else
    return p_from + (p_cuotas * interval '1 month');
  end if;
end;
$$ language plpgsql immutable;

-- ── Recrea create_client_with_loan con ultima_cuota_fecha ──
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
  v_loan_id   uuid;
  v_total     numeric;
  v_cuota     numeric;
  v_posicion  integer;
  v_fecha_inicio date := current_date;
  v_fecha_fin    date;
  v_proxima_cuota date;
  v_dias_lab  jsonb;
  v_cursor    date;
  v_added     integer := 0;
begin
  select dias_laborales into v_dias_lab
    from units where id = p_unit_id and activo = true;

  if v_dias_lab is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  if not exists (
    select 1 from units
    where id = p_unit_id and intereses @> to_jsonb(p_interes)
  ) then
    raise exception 'Interes no habilitado para esta unidad';
  end if;

  if p_modalidad not in ('diaria', 'semanal', 'quincenal', 'mensual') then
    raise exception 'Modalidad invalida';
  end if;

  if p_valor_neto <= 0 or p_numero_cuotas < 1 then
    raise exception 'Datos de prestamo invalidos';
  end if;

  v_total  := round(p_valor_neto * (1 + p_interes / 100), 2);
  v_cuota  := round(v_total / p_numero_cuotas, 2);

  -- Fecha fin
  if p_modalidad = 'diaria' then
    v_cursor := v_fecha_inicio;
    while v_added < p_numero_cuotas loop
      v_cursor := v_cursor + interval '1 day';
      if v_dias_lab @> to_jsonb(extract(dow from v_cursor)::integer) then
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

  -- Próxima cuota: primer día laboral siguiente a hoy
  v_proxima_cuota := next_due_date(v_fecha_inicio, p_modalidad, 1, v_dias_lab);

  select coalesce(max(posicion), 0) + 1 into v_posicion
    from loans where unit_id = p_unit_id and estado = 'activo';

  insert into clients (
    unit_id, alias, nit, direccion1, direccion2,
    barrio, telefono1, telefono2, genero
  ) values (
    p_unit_id, p_alias,
    nullif(p_nit, ''), nullif(p_direccion1, ''), nullif(p_direccion2, ''),
    nullif(p_barrio, ''), nullif(p_telefono1, ''), nullif(p_telefono2, ''),
    nullif(p_genero, '')
  ) returning id into v_client_id;

  insert into loans (
    unit_id, client_id, modalidad, interes, valor_neto, numero_cuotas,
    valor_cuota, total_a_cobrar, saldo, estado, posicion,
    fecha_inicio, fecha_fin, ultima_cuota_fecha
  ) values (
    p_unit_id, v_client_id, p_modalidad, p_interes, p_valor_neto, p_numero_cuotas,
    v_cuota, v_total, v_total, 'activo', v_posicion,
    v_fecha_inicio, v_fecha_fin, v_proxima_cuota
  ) returning id into v_loan_id;

  return v_loan_id;
end;
$$ language plpgsql security definer;

-- ── Recrea create_loan_for_existing_client con ultima_cuota_fecha ──
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
  v_loan_id   uuid;
  v_total     numeric;
  v_cuota     numeric;
  v_posicion  integer;
  v_prev_pos  integer;
  v_fecha_inicio date := current_date;
  v_fecha_fin    date;
  v_proxima_cuota date;
  v_dias_lab  jsonb;
  v_cursor    date;
  v_added     integer := 0;
begin
  select dias_laborales into v_dias_lab
    from units where id = p_unit_id and activo = true;

  if v_dias_lab is null then
    raise exception 'Unidad no encontrada o inactiva';
  end if;

  if not exists (
    select 1 from clients
    where id = p_client_id and unit_id = p_unit_id and activo = true
  ) then
    raise exception 'Cliente no encontrado o inactivo';
  end if;

  if exists (
    select 1 from loans where client_id = p_client_id and estado = 'activo'
  ) then
    raise exception 'Este cliente ya tiene un prestamo activo';
  end if;

  if not exists (
    select 1 from units where id = p_unit_id and intereses @> to_jsonb(p_interes)
  ) then
    raise exception 'Interes no habilitado para esta unidad';
  end if;

  if p_modalidad not in ('diaria', 'semanal', 'quincenal', 'mensual') then
    raise exception 'Modalidad invalida';
  end if;

  if p_valor_neto <= 0 or p_numero_cuotas < 1 then
    raise exception 'Datos de prestamo invalidos';
  end if;

  v_total := round(p_valor_neto * (1 + p_interes / 100), 2);
  v_cuota := round(v_total / p_numero_cuotas, 2);

  if p_modalidad = 'diaria' then
    v_cursor := v_fecha_inicio;
    while v_added < p_numero_cuotas loop
      v_cursor := v_cursor + interval '1 day';
      if v_dias_lab @> to_jsonb(extract(dow from v_cursor)::integer) then
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

  v_proxima_cuota := next_due_date(v_fecha_inicio, p_modalidad, 1, v_dias_lab);

  select posicion into v_prev_pos
    from loans where client_id = p_client_id and unit_id = p_unit_id
      and posicion is not null
    order by created_at desc limit 1;

  if v_prev_pos is not null then
    update loans set posicion = posicion + 1
      where unit_id = p_unit_id and estado = 'activo' and posicion >= v_prev_pos;
    v_posicion := v_prev_pos;
  else
    select coalesce(max(posicion), 0) + 1 into v_posicion
      from loans where unit_id = p_unit_id and estado = 'activo';
  end if;

  insert into loans (
    unit_id, client_id, modalidad, interes, valor_neto, numero_cuotas,
    valor_cuota, total_a_cobrar, saldo, estado, posicion,
    fecha_inicio, fecha_fin, ultima_cuota_fecha
  ) values (
    p_unit_id, p_client_id, p_modalidad, p_interes, p_valor_neto, p_numero_cuotas,
    v_cuota, v_total, v_total, 'activo', v_posicion,
    v_fecha_inicio, v_fecha_fin, v_proxima_cuota
  ) returning id into v_loan_id;

  return v_loan_id;
end;
$$ language plpgsql security definer;

-- ── Recrea register_payment: ultima_cuota_fecha = PRÓXIMA cuota ──
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

  v_new_saldo   := greatest(v_loan.saldo - p_monto, 0);
  v_new_cuotas  := least(v_loan.cuotas_pagadas + p_numero_cuotas, v_loan.numero_cuotas);
  v_new_estado  := case
    when v_new_saldo <= 0 or v_new_cuotas >= v_loan.numero_cuotas then 'completado'
    else 'activo'
  end;

  -- Próxima cuota: avanza p_numero_cuotas períodos desde hoy
  if v_new_estado = 'activo' then
    v_proxima_cuota := next_due_date(current_date, v_loan.modalidad, p_numero_cuotas, v_dias_lab);
  else
    v_proxima_cuota := null;  -- préstamo completado, no hay próxima
  end if;

  insert into payments (loan_id, unit_id, monto, numero_cuotas, metodo_pago, fecha_pago)
    values (p_loan_id, p_unit_id, p_monto, p_numero_cuotas, p_metodo_pago, current_date)
    returning id into v_payment_id;

  update loans
    set saldo             = v_new_saldo,
        cuotas_pagadas    = v_new_cuotas,
        ultima_cuota_fecha = v_proxima_cuota,
        estado            = v_new_estado
    where id = p_loan_id;

  return v_payment_id;
end;
$$ language plpgsql security definer;

-- ── Backfill para préstamos activos sin ultima_cuota_fecha ──
-- Usa fecha_inicio como base si existe, si no usa created_at
update loans l
set ultima_cuota_fecha = next_due_date(
  coalesce(l.fecha_inicio, l.created_at::date),
  l.modalidad,
  1,
  (select dias_laborales from units where id = l.unit_id)
)
where l.estado = 'activo'
  and l.ultima_cuota_fecha is null;
