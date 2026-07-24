create extension if not exists "uuid-ossp";

create table admins (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  nombre text not null,
  created_at timestamptz default now() not null
);

create table units (
  id uuid primary key references auth.users(id) on delete cascade,
  admin_id uuid not null references admins(id),
  username text unique not null,
  nombre_unidad text not null,
  encargado text not null,
  telefono text,
  capital_inicial numeric(12,2) not null default 0,
  pais text not null,
  estado text not null,
  ciudad text not null,
  zona_horaria text not null default 'America/Bogota',
  dias_laborales jsonb not null default '[1,2,3,4,5]'::jsonb,
  dias_bloqueados_eliminacion integer not null default 0,
  intereses jsonb not null default '[10,15,20]'::jsonb,
  activo boolean not null default true,
  created_at timestamptz default now() not null
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  alias text not null,
  nit text,
  direccion1 text,
  direccion2 text,
  barrio text,
  telefono1 text,
  telefono2 text,
  genero text check (genero in ('masculino', 'femenino', 'otro')),
  lat numeric(10,8),
  lng numeric(11,8),
  activo boolean not null default true,
  created_at timestamptz default now() not null
);

create table loans (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  client_id uuid not null references clients(id),
  modalidad text not null check (modalidad in ('diaria', 'semanal', 'quincenal', 'mensual')),
  interes numeric(5,2) not null check (interes >= 0 and interes <= 100),
  valor_neto numeric(12,2) not null check (valor_neto > 0),
  numero_cuotas integer not null check (numero_cuotas >= 1),
  valor_cuota numeric(12,2) not null,
  total_a_cobrar numeric(12,2) not null,
  cuotas_pagadas integer not null default 0,
  saldo numeric(12,2) not null,
  estado text not null default 'activo' check (estado in ('activo', 'completado', 'cancelado')),
  posicion integer,
  fecha_inicio date,
  fecha_fin date,
  ultima_cuota_fecha date,
  created_at timestamptz default now() not null
);

create unique index unique_active_loan_per_client
  on loans (client_id)
  where estado = 'activo';

create table payments (
  id uuid primary key default gen_random_uuid(),
  loan_id uuid not null references loans(id),
  unit_id uuid not null references units(id),
  monto numeric(12,2) not null check (monto > 0),
  numero_cuotas integer not null default 1 check (numero_cuotas >= 1),
  metodo_pago text not null check (metodo_pago in ('efectivo', 'transferencia')),
  fecha_pago date not null default current_date,
  hora_registro timestamptz not null default now(),
  eliminado boolean not null default false,
  eliminado_at timestamptz,
  eliminado_motivo text,
  created_at timestamptz default now() not null
);

create table expenses (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  categoria text not null,
  monto numeric(12,2) not null check (monto > 0),
  nota text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por uuid references admins(id),
  aprobado_at timestamptz,
  creado_por text not null,
  fecha date not null default current_date,
  created_at timestamptz default now() not null
);

create table capital_movements (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  admin_id uuid not null references admins(id),
  tipo text not null check (tipo in ('ingreso', 'retiro')),
  monto numeric(12,2) not null check (monto > 0),
  nota text,
  fecha date not null default current_date,
  created_at timestamptz default now() not null
);

create table box_adjustments (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  tipo text not null check (tipo in ('entrada', 'salida')),
  concepto text not null,
  monto numeric(12,2) not null check (monto > 0),
  referencia_id uuid,
  referencia_tipo text,
  descripcion text,
  fecha date not null default current_date,
  created_at timestamptz default now() not null
);

create table weekly_adjustments (
  id uuid primary key default gen_random_uuid(),
  unit_id uuid not null references units(id),
  tipo text not null check (tipo in ('ingreso', 'egreso')),
  monto numeric(12,2) not null check (monto > 0),
  descripcion text,
  fecha date not null default current_date,
  semana_inicio date not null,
  created_at timestamptz default now() not null
);
