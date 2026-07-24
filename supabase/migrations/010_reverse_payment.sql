create or replace function reverse_payment(
  p_payment_id uuid,
  p_unit_id uuid
)
returns void as $$
declare
  v_payment record;
  v_unit record;
begin
  -- Fetch payment and verify ownership
  select p.id, p.loan_id, p.monto, p.numero_cuotas, p.eliminado, p.fecha_pago
  into v_payment
  from payments p
  where p.id = p_payment_id
    and p.unit_id = p_unit_id;

  if v_payment.id is null then
    raise exception 'Pago no encontrado.';
  end if;

  if v_payment.eliminado then
    raise exception 'Este pago ya fue anulado.';
  end if;

  -- Check deletion window
  select dias_bloqueados_eliminacion
  into v_unit
  from units
  where id = p_unit_id;

  if v_unit.dias_bloqueados_eliminacion > 0 then
    if v_payment.fecha_pago < current_date - v_unit.dias_bloqueados_eliminacion then
      raise exception 'No se puede anular un pago de mas de % dias.', v_unit.dias_bloqueados_eliminacion;
    end if;
  end if;

  -- Soft-delete the payment
  update payments
  set eliminado     = true,
      eliminado_at  = now()
  where id = p_payment_id;

  -- Reverse the loan: restore saldo and cuotas
  update loans
  set saldo          = saldo + v_payment.monto,
      cuotas_pagadas = greatest(cuotas_pagadas - v_payment.numero_cuotas, 0),
      estado         = case when estado = 'completado' then 'activo' else estado end
  where id = v_payment.loan_id;
end;
$$ language plpgsql security definer;
