create or replace function update_route_positions(
  p_unit_id uuid,
  p_loan_ids uuid[]
)
returns void as $$
declare
  v_loan_id uuid;
  v_position integer := 1;
begin
  if p_loan_ids is null or array_length(p_loan_ids, 1) is null then
    raise exception 'La ruta no puede estar vacia';
  end if;

  if exists (
    select 1
    from unnest(p_loan_ids) as ordered_loan(id)
    left join loans on loans.id = ordered_loan.id
      and loans.unit_id = p_unit_id
      and loans.estado = 'activo'
    where loans.id is null
  ) then
    raise exception 'La ruta contiene prestamos invalidos';
  end if;

  foreach v_loan_id in array p_loan_ids loop
    update loans
    set posicion = v_position
    where id = v_loan_id
      and unit_id = p_unit_id
      and estado = 'activo';

    v_position := v_position + 1;
  end loop;
end;
$$ language plpgsql security definer;
