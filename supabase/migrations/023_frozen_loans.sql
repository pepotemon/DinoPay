-- Extend loans.estado to support 'congelado' for frozen client-loan pairs.
-- A frozen loan keeps the saldo in cartera but marks the client as inactive.
-- The client can be reactivated later, restoring the loan to 'activo'.

do $$
declare
  c record;
begin
  for c in
    select conname from pg_constraint
    where conrelid = 'public.loans'::regclass
      and contype = 'c'
      and pg_get_constraintdef(oid) like '%estado%'
  loop
    execute 'alter table public.loans drop constraint ' || quote_ident(c.conname);
  end loop;
end;
$$;

alter table public.loans
  add constraint loans_estado_check
  check (estado in ('activo', 'completado', 'cancelado', 'congelado'));
