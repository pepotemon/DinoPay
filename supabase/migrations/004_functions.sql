create or replace function calculate_caja(p_unit_id uuid, p_fecha date default current_date)
returns numeric as $$
declare
  v_capital_inicial numeric;
  v_cobrado numeric;
  v_prestado numeric;
  v_gastos numeric;
  v_capital_neto numeric;
  v_cuadres numeric;
begin
  select capital_inicial into v_capital_inicial
    from units where id = p_unit_id;

  select coalesce(sum(monto), 0) into v_cobrado
    from payments
    where unit_id = p_unit_id
      and fecha_pago <= p_fecha
      and eliminado = false;

  select coalesce(sum(valor_neto), 0) into v_prestado
    from loans
    where unit_id = p_unit_id
      and date(created_at) <= p_fecha;

  select coalesce(sum(monto), 0) into v_gastos
    from expenses
    where unit_id = p_unit_id
      and fecha <= p_fecha
      and estado = 'aprobado';

  select coalesce(sum(
    case when tipo = 'ingreso' then monto else -monto end
  ), 0) into v_capital_neto
    from capital_movements
    where unit_id = p_unit_id
      and fecha <= p_fecha;

  select coalesce(sum(
    case when tipo = 'entrada' then monto else -monto end
  ), 0) into v_cuadres
    from box_adjustments
    where unit_id = p_unit_id
      and fecha <= p_fecha;

  return v_capital_inicial
       + v_cobrado
       - v_prestado
       - v_gastos
       + v_capital_neto
       + v_cuadres;
end;
$$ language plpgsql security definer;
