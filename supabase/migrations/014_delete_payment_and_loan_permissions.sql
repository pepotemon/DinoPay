alter table units
  add column if not exists puede_eliminar_abonos boolean not null default false,
  add column if not exists puede_eliminar_prestamos boolean not null default false;

create or replace function reverse_payment(
  p_payment_id uuid,
  p_unit_id uuid
)
returns void as $$
declare
  v_payment record;
  v_unit record;
  v_full_cuotas integer;
begin
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

  if v_payment.fecha_pago <> current_date then
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

create or replace function delete_loan_same_day(
  p_loan_id uuid,
  p_unit_id uuid
)
returns void as $$
declare
  v_loan record;
  v_unit record;
begin
  select id, created_at
  into v_loan
  from loans
  where id = p_loan_id
    and unit_id = p_unit_id;

  if v_loan.id is null then
    raise exception 'Prestamo no encontrado.';
  end if;

  select puede_eliminar_prestamos
  into v_unit
  from units
  where id = p_unit_id
    and activo = true;

  if v_unit.puede_eliminar_prestamos is distinct from true then
    raise exception 'Esta unidad no tiene permiso para eliminar prestamos.';
  end if;

  if v_loan.created_at::date <> current_date then
    raise exception 'Solo se pueden eliminar prestamos creados hoy.';
  end if;

  if exists (
    select 1
    from payments
    where loan_id = p_loan_id
      and unit_id = p_unit_id
  ) then
    raise exception 'No se puede eliminar un prestamo que ya tiene abonos.';
  end if;

  delete from loan_visits
  where loan_id = p_loan_id
    and unit_id = p_unit_id;

  delete from loans
  where id = p_loan_id
    and unit_id = p_unit_id;
end;
$$ language plpgsql security definer;
