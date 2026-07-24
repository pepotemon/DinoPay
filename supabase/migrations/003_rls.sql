alter table admins enable row level security;
alter table units enable row level security;
alter table clients enable row level security;
alter table loans enable row level security;
alter table payments enable row level security;
alter table expenses enable row level security;
alter table capital_movements enable row level security;
alter table box_adjustments enable row level security;
alter table weekly_adjustments enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (select 1 from admins where id = auth.uid())
$$ language sql security definer;

create policy "admins_own_row" on admins
  for all using (id = auth.uid());

create policy "unit_own_row" on units
  for select using (id = auth.uid());

create policy "admin_all_units" on units
  for all using (is_admin());

create policy "unit_own_clients" on clients
  for all using (unit_id = auth.uid());

create policy "admin_all_clients" on clients
  for all using (is_admin());

create policy "unit_own_loans" on loans
  for all using (unit_id = auth.uid());

create policy "admin_all_loans" on loans
  for all using (is_admin());

create policy "unit_own_payments" on payments
  for all using (unit_id = auth.uid());

create policy "admin_all_payments" on payments
  for all using (is_admin());

create policy "unit_own_expenses" on expenses
  for select using (unit_id = auth.uid());

create policy "unit_create_expenses" on expenses
  for insert with check (unit_id = auth.uid());

create policy "unit_update_pending_expenses" on expenses
  for update using (unit_id = auth.uid() and estado = 'pendiente');

create policy "unit_delete_pending_expenses" on expenses
  for delete using (unit_id = auth.uid() and estado = 'pendiente');

create policy "admin_all_expenses" on expenses
  for all using (is_admin());

create policy "unit_read_own_movements" on capital_movements
  for select using (unit_id = auth.uid());

create policy "admin_all_capital_movements" on capital_movements
  for all using (is_admin());

create policy "unit_read_own_adjustments" on box_adjustments
  for select using (unit_id = auth.uid());

create policy "admin_all_adjustments" on box_adjustments
  for all using (is_admin());

create policy "unit_own_weekly_adjustments" on weekly_adjustments
  for all using (unit_id = auth.uid());

create policy "admin_all_weekly_adjustments" on weekly_adjustments
  for all using (is_admin());
