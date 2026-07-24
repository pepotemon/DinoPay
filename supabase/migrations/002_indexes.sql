create index idx_loans_unit_estado on loans(unit_id, estado);

create index idx_payments_unit_fecha on payments(unit_id, fecha_pago)
  where eliminado = false;

create index idx_clients_unit on clients(unit_id);

create index idx_expenses_unit_estado on expenses(unit_id, estado);

create index idx_loans_client on loans(client_id);

create index idx_box_adjustments_unit_fecha on box_adjustments(unit_id, fecha);

create index idx_loans_unit_posicion on loans(unit_id, posicion)
  where estado = 'activo';
