create table if not exists loan_visits (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id),
  unit_id uuid not null references units(id),
  fecha date not null default current_date,
  tipo text not null check (tipo in ('no_pago')),
  nota text,
  created_at timestamptz default now() not null
);

create unique index if not exists unique_loan_visit_per_day
  on loan_visits(loan_id, fecha, tipo);

create index if not exists idx_loan_visits_unit_fecha
  on loan_visits(unit_id, fecha);

alter table loan_visits enable row level security;

drop policy if exists "unit_own_loan_visits" on loan_visits;
drop policy if exists "admin_all_loan_visits" on loan_visits;

create policy "unit_own_loan_visits" on loan_visits
  for all using (unit_id = auth.uid())
  with check (unit_id = auth.uid());

create policy "admin_all_loan_visits" on loan_visits
  for all using (is_admin())
  with check (is_admin());

create or replace function mark_no_pay_visit(
  p_loan_id uuid,
  p_unit_id uuid,
  p_nota text default null
)
returns uuid as $$
declare
  v_visit_id uuid;
begin
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
      and fecha_pago = current_date
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
    current_date,
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
