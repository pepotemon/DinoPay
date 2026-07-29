create or replace function public.unit_today(p_unit_id uuid)
returns date
language sql
stable
security definer
set search_path = public
as $$
  select (now() at time zone coalesce(
    (select zona_horaria from units where id = p_unit_id),
    'America/Bogota'
  ))::date;
$$;

alter table expenses
  alter column fecha drop default;

create or replace function public.set_expense_business_date()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.fecha is null then
    new.fecha := public.unit_today(new.unit_id);
  end if;

  return new;
end;
$$;

drop trigger if exists trg_set_expense_business_date on expenses;

create trigger trg_set_expense_business_date
before insert on expenses
for each row
execute function public.set_expense_business_date();
