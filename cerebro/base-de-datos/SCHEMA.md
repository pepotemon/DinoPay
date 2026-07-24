---
tags: [base-de-datos, schema, sql, migraciones]
created: 2026-07-24
updated: 2026-07-24
---

# Schema Completo — Base de Datos DinoPay

[[INDEX|← Volver al Index]]

> Este archivo contiene el SQL completo para crear la base de datos desde cero.
> El schema detallado con explicaciones está en [[arquitectura/BASE-DE-DATOS]].

---

## Migration 001 — Schema Inicial

```sql
-- ============================================================
-- DinoPay — Migration 001
-- Fecha: 2026-07-24
-- Descripción: Schema inicial completo
-- ============================================================

-- EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: admins
-- ============================================================
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: units
-- ============================================================
CREATE TABLE units (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id UUID NOT NULL REFERENCES admins(id),
  username TEXT UNIQUE NOT NULL,
  nombre_unidad TEXT NOT NULL,
  encargado TEXT NOT NULL,
  telefono TEXT,
  capital_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  pais TEXT NOT NULL,
  estado TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  zona_horaria TEXT NOT NULL DEFAULT 'America/Bogota',
  dias_laborales JSONB NOT NULL DEFAULT '[1,2,3,4,5]'::jsonb,
  dias_bloqueados_eliminacion INTEGER NOT NULL DEFAULT 0,
  intereses JSONB NOT NULL DEFAULT '[10,15,20]'::jsonb,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: clients
-- ============================================================
CREATE TABLE clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  alias TEXT NOT NULL,
  nit TEXT,
  direccion1 TEXT,
  direccion2 TEXT,
  barrio TEXT,
  telefono1 TEXT,
  telefono2 TEXT,
  genero TEXT CHECK (genero IN ('masculino', 'femenino', 'otro')),
  lat NUMERIC(10,8),
  lng NUMERIC(11,8),
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: loans
-- ============================================================
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  modalidad TEXT NOT NULL CHECK (modalidad IN ('diaria', 'semanal', 'quincenal', 'mensual')),
  interes NUMERIC(5,2) NOT NULL CHECK (interes >= 0 AND interes <= 100),
  valor_neto NUMERIC(12,2) NOT NULL CHECK (valor_neto > 0),
  numero_cuotas INTEGER NOT NULL CHECK (numero_cuotas >= 1),
  valor_cuota NUMERIC(12,2) NOT NULL,
  total_a_cobrar NUMERIC(12,2) NOT NULL,
  cuotas_pagadas INTEGER NOT NULL DEFAULT 0,
  saldo NUMERIC(12,2) NOT NULL,
  estado TEXT NOT NULL DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'cancelado')),
  posicion INTEGER,
  fecha_inicio DATE,
  fecha_fin DATE,
  ultima_cuota_fecha DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Un cliente solo puede tener UN préstamo activo a la vez
CREATE UNIQUE INDEX unique_active_loan_per_client
  ON loans (client_id)
  WHERE estado = 'activo';

-- ============================================================
-- TABLA: payments
-- ============================================================
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  numero_cuotas INTEGER NOT NULL DEFAULT 1 CHECK (numero_cuotas >= 1),
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia')),
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_registro TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  eliminado BOOLEAN NOT NULL DEFAULT FALSE,
  eliminado_at TIMESTAMPTZ,
  eliminado_motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: expenses
-- ============================================================
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  categoria TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  nota TEXT,
  estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por UUID REFERENCES admins(id),
  aprobado_at TIMESTAMPTZ,
  creado_por TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: capital_movements
-- ============================================================
CREATE TABLE capital_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  admin_id UUID NOT NULL REFERENCES admins(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'retiro')),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  nota TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: box_adjustments
-- ============================================================
CREATE TABLE box_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  referencia_id UUID,
  referencia_tipo TEXT,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- ============================================================
-- TABLA: weekly_adjustments
-- ============================================================
CREATE TABLE weekly_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto NUMERIC(12,2) NOT NULL CHECK (monto > 0),
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  semana_inicio DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## Migration 002 — Índices

```sql
-- ============================================================
-- DinoPay — Migration 002
-- Fecha: 2026-07-24
-- Descripción: Índices para performance
-- ============================================================

-- Préstamos activos por unidad (query más frecuente del sistema)
CREATE INDEX idx_loans_unit_estado ON loans(unit_id, estado);

-- Pagos por unidad y fecha (reporte diario)
CREATE INDEX idx_payments_unit_fecha ON payments(unit_id, fecha_pago)
  WHERE eliminado = FALSE;

-- Clientes por unidad
CREATE INDEX idx_clients_unit ON clients(unit_id);

-- Gastos pendientes por unidad
CREATE INDEX idx_expenses_unit_estado ON expenses(unit_id, estado);

-- Historial de préstamos por cliente
CREATE INDEX idx_loans_client ON loans(client_id);

-- Cuadres de caja por unidad y fecha
CREATE INDEX idx_box_adjustments_unit_fecha ON box_adjustments(unit_id, fecha);

-- Préstamos ordenados por posición (para la pantalla de Préstamos)
CREATE INDEX idx_loans_unit_posicion ON loans(unit_id, posicion)
  WHERE estado = 'activo';
```

---

## Migration 003 — Row Level Security

```sql
-- ============================================================
-- DinoPay — Migration 003
-- Fecha: 2026-07-24
-- Descripción: Políticas RLS
-- ============================================================

-- Activar RLS en todas las tablas
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_adjustments ENABLE ROW LEVEL SECURITY;

-- Helper function para verificar si el usuario es admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
$$ LANGUAGE SQL SECURITY DEFINER;

-- ---- ADMINS TABLE ----
CREATE POLICY "admins_own_row" ON admins
  FOR ALL USING (id = auth.uid());

-- ---- UNITS TABLE ----
CREATE POLICY "unit_own_row" ON units
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "admin_all_units" ON units
  FOR ALL USING (is_admin());

-- ---- CLIENTS TABLE ----
CREATE POLICY "unit_own_clients" ON clients
  FOR ALL USING (unit_id = auth.uid());

CREATE POLICY "admin_all_clients" ON clients
  FOR ALL USING (is_admin());

-- ---- LOANS TABLE ----
CREATE POLICY "unit_own_loans" ON loans
  FOR ALL USING (unit_id = auth.uid());

CREATE POLICY "admin_all_loans" ON loans
  FOR ALL USING (is_admin());

-- ---- PAYMENTS TABLE ----
CREATE POLICY "unit_own_payments" ON payments
  FOR ALL USING (unit_id = auth.uid());

CREATE POLICY "admin_all_payments" ON payments
  FOR ALL USING (is_admin());

-- ---- EXPENSES TABLE ----
CREATE POLICY "unit_own_expenses" ON expenses
  FOR SELECT USING (unit_id = auth.uid());

CREATE POLICY "unit_create_expenses" ON expenses
  FOR INSERT WITH CHECK (unit_id = auth.uid());

CREATE POLICY "unit_update_pending_expenses" ON expenses
  FOR UPDATE USING (unit_id = auth.uid() AND estado = 'pendiente');

CREATE POLICY "unit_delete_pending_expenses" ON expenses
  FOR DELETE USING (unit_id = auth.uid() AND estado = 'pendiente');

CREATE POLICY "admin_all_expenses" ON expenses
  FOR ALL USING (is_admin());

-- ---- CAPITAL_MOVEMENTS TABLE ----
CREATE POLICY "unit_read_own_movements" ON capital_movements
  FOR SELECT USING (unit_id = auth.uid());

CREATE POLICY "admin_all_capital_movements" ON capital_movements
  FOR ALL USING (is_admin());

-- ---- BOX_ADJUSTMENTS TABLE ----
CREATE POLICY "unit_read_own_adjustments" ON box_adjustments
  FOR SELECT USING (unit_id = auth.uid());

CREATE POLICY "admin_all_adjustments" ON box_adjustments
  FOR ALL USING (is_admin());

-- ---- WEEKLY_ADJUSTMENTS TABLE ----
CREATE POLICY "unit_own_weekly_adjustments" ON weekly_adjustments
  FOR ALL USING (unit_id = auth.uid());

CREATE POLICY "admin_all_weekly_adjustments" ON weekly_adjustments
  FOR ALL USING (is_admin());
```

---

## Migration 004 — Funciones y Triggers

```sql
-- ============================================================
-- DinoPay — Migration 004
-- Fecha: 2026-07-24
-- Descripción: Funciones útiles y triggers
-- ============================================================

-- Calcular caja de una unidad para una fecha específica
CREATE OR REPLACE FUNCTION calculate_caja(p_unit_id UUID, p_fecha DATE DEFAULT CURRENT_DATE)
RETURNS NUMERIC AS $$
DECLARE
  v_capital_inicial NUMERIC;
  v_cobrado NUMERIC;
  v_prestado NUMERIC;
  v_gastos NUMERIC;
  v_capital_neto NUMERIC;
  v_cuadres NUMERIC;
BEGIN
  -- Capital inicial
  SELECT capital_inicial INTO v_capital_inicial
    FROM units WHERE id = p_unit_id;
  
  -- Total cobrado hasta la fecha (incluyendo el día)
  SELECT COALESCE(SUM(monto), 0) INTO v_cobrado
    FROM payments
    WHERE unit_id = p_unit_id
      AND fecha_pago <= p_fecha
      AND eliminado = FALSE;
  
  -- Total prestado hasta la fecha
  SELECT COALESCE(SUM(valor_neto), 0) INTO v_prestado
    FROM loans
    WHERE unit_id = p_unit_id
      AND DATE(created_at) <= p_fecha;
  
  -- Gastos aprobados hasta la fecha
  SELECT COALESCE(SUM(monto), 0) INTO v_gastos
    FROM expenses
    WHERE unit_id = p_unit_id
      AND fecha <= p_fecha
      AND estado = 'aprobado';
  
  -- Movimientos de capital (ingresos - retiros)
  SELECT COALESCE(SUM(
    CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END
  ), 0) INTO v_capital_neto
    FROM capital_movements
    WHERE unit_id = p_unit_id
      AND fecha <= p_fecha;
  
  -- Cuadres de caja (entradas - salidas)
  SELECT COALESCE(SUM(
    CASE WHEN tipo = 'entrada' THEN monto ELSE -monto END
  ), 0) INTO v_cuadres
    FROM box_adjustments
    WHERE unit_id = p_unit_id
      AND fecha <= p_fecha;
  
  RETURN v_capital_inicial 
       + v_cobrado 
       - v_prestado 
       - v_gastos 
       + v_capital_neto
       + v_cuadres;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## Ver También
- [[arquitectura/BASE-DE-DATOS]] — Explicación detallada de cada tabla
- [[seguridad/SEGURIDAD]] — Contexto de las políticas RLS
- [[flujos/FLUJOS]] — Cómo estas tablas se usan en los flujos
