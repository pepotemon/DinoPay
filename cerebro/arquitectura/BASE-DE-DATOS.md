---
tags: [base-de-datos, schema, supabase, postgresql]
created: 2026-07-24
updated: 2026-07-24
---

# Base de Datos — DinoPay

[[INDEX|← Volver al Index]]

**Motor:** PostgreSQL vía Supabase
**Seguridad:** Row Level Security (RLS) activado en todas las tablas

---

## Diagrama de Relaciones

```
admins
  └──< units (admin_id)
          └──< clients (unit_id)
          │       └──< loans (client_id)
          │               └──< payments (loan_id)
          │               └──  loan_routes (loan_id)
          └──< expenses (unit_id)
          └──< box_adjustments (unit_id)
          └──< capital_movements (unit_id)
          └──< weekly_adjustments (unit_id)
```

---

## Tablas

### `admins`
Usuarios administradores del sistema.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del admin (mismo que auth.users) |
| `email` | text (unique) | Email de acceso |
| `nombre` | text | Nombre completo |
| `created_at` | timestamptz | Fecha de creación |

```sql
CREATE TABLE admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  email TEXT UNIQUE NOT NULL,
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `units`
Unidades creadas por el administrador. Cada unidad es un agente de cobro con su propia cartera.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID de la unidad (mismo que auth.users) |
| `admin_id` | uuid (FK → admins) | Admin propietario |
| `username` | text (unique) | Nombre de usuario para login |
| `nombre_unidad` | text | Nombre comercial de la unidad |
| `encargado` | text | Nombre del encargado |
| `telefono` | text | Teléfono de contacto |
| `capital_inicial` | numeric(12,2) | Capital con que inicia la unidad |
| `capital_actual` | numeric(12,2) | Capital actual (calculado, se actualiza) |
| `pais` | text | País |
| `estado` | text | Estado/Departamento |
| `ciudad` | text | Ciudad |
| `zona_horaria` | text | Ej: 'America/Bogota' |
| `dias_laborales` | jsonb | Array: [1,2,3,4,5] (lunes a viernes) |
| `dias_bloqueados_eliminacion` | integer | Días después de pago en que no se puede eliminar |
| `intereses` | jsonb | Array de % permitidos: [5, 10, 15, 20] |
| `activo` | boolean | Si la unidad está activa |
| `created_at` | timestamptz | Fecha de creación |

```sql
CREATE TABLE units (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  admin_id UUID NOT NULL REFERENCES admins(id),
  username TEXT UNIQUE NOT NULL,
  nombre_unidad TEXT NOT NULL,
  encargado TEXT NOT NULL,
  telefono TEXT,
  capital_inicial NUMERIC(12,2) NOT NULL DEFAULT 0,
  capital_actual NUMERIC(12,2) NOT NULL DEFAULT 0,
  pais TEXT NOT NULL,
  estado TEXT NOT NULL,
  ciudad TEXT NOT NULL,
  zona_horaria TEXT NOT NULL DEFAULT 'America/Bogota',
  dias_laborales JSONB DEFAULT '[1,2,3,4,5]',
  dias_bloqueados_eliminacion INTEGER DEFAULT 0,
  intereses JSONB DEFAULT '[10,15,20]',
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `clients`
Clientes de la unidad. Un cliente puede tener múltiples préstamos a lo largo del tiempo.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del cliente |
| `unit_id` | uuid (FK → units) | Unidad propietaria |
| `alias` | text | Nombre/alias del cliente |
| `nit` | text | Documento de identidad |
| `direccion1` | text | Dirección principal |
| `direccion2` | text | Dirección secundaria |
| `barrio` | text | Barrio |
| `telefono1` | text | Teléfono principal |
| `telefono2` | text | Teléfono secundario |
| `genero` | text | 'masculino' / 'femenino' / 'otro' |
| `lat` | numeric | Latitud GPS |
| `lng` | numeric | Longitud GPS |
| `activo` | boolean | Si el cliente está activo en el sistema |
| `created_at` | timestamptz | Fecha de creación |

```sql
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
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `loans`
Préstamos. Un cliente puede tener UN solo préstamo activo a la vez, pero múltiples en el historial.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del préstamo |
| `unit_id` | uuid (FK → units) | Unidad propietaria |
| `client_id` | uuid (FK → clients) | Cliente |
| `modalidad` | text | 'diaria' / 'semanal' / 'quincenal' / 'mensual' |
| `interes` | numeric(5,2) | % de interés aplicado |
| `valor_neto` | numeric(12,2) | Capital prestado |
| `numero_cuotas` | integer | Total de cuotas a pagar |
| `valor_cuota` | numeric(12,2) | Valor de cada cuota |
| `total_a_cobrar` | numeric(12,2) | Total con intereses |
| `cuotas_pagadas` | integer | Cuotas registradas hasta ahora |
| `saldo` | numeric(12,2) | Saldo pendiente |
| `estado` | text | 'activo' / 'completado' / 'cancelado' |
| `posicion` | integer | Posición en la ruta de cobro |
| `fecha_inicio` | date | Fecha de inicio del préstamo |
| `fecha_fin` | date | Fecha estimada de fin |
| `ultima_cuota_fecha` | date | Fecha del último pago |
| `created_at` | timestamptz | Fecha de creación |

```sql
CREATE TABLE loans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  modalidad TEXT NOT NULL CHECK (modalidad IN ('diaria', 'semanal', 'quincenal', 'mensual')),
  interes NUMERIC(5,2) NOT NULL,
  valor_neto NUMERIC(12,2) NOT NULL,
  numero_cuotas INTEGER NOT NULL,
  valor_cuota NUMERIC(12,2) NOT NULL,
  total_a_cobrar NUMERIC(12,2) NOT NULL,
  cuotas_pagadas INTEGER DEFAULT 0,
  saldo NUMERIC(12,2) NOT NULL,
  estado TEXT DEFAULT 'activo' CHECK (estado IN ('activo', 'completado', 'cancelado')),
  posicion INTEGER,
  fecha_inicio DATE,
  fecha_fin DATE,
  ultima_cuota_fecha DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Un cliente solo puede tener UN préstamo activo a la vez
CREATE UNIQUE INDEX unique_active_loan_per_client
  ON loans (client_id)
  WHERE estado = 'activo';
```

---

### `payments`
Registros de pagos/abonos/cuotas. Cada pago puede corresponder a 1 o más cuotas.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del pago |
| `loan_id` | uuid (FK → loans) | Préstamo al que pertenece |
| `unit_id` | uuid (FK → units) | Unidad que registró |
| `monto` | numeric(12,2) | Monto pagado |
| `numero_cuotas` | integer | Cuotas que cubre este pago |
| `metodo_pago` | text | 'efectivo' / 'transferencia' |
| `fecha_pago` | date | Fecha del pago |
| `hora_registro` | timestamptz | Momento exacto del registro |
| `eliminado` | boolean | Si fue eliminado (cuadre de caja) |
| `eliminado_at` | timestamptz | Cuándo fue eliminado |
| `eliminado_motivo` | text | Razón de eliminación |
| `created_at` | timestamptz | Fecha de creación |

```sql
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id UUID NOT NULL REFERENCES loans(id),
  unit_id UUID NOT NULL REFERENCES units(id),
  monto NUMERIC(12,2) NOT NULL,
  numero_cuotas INTEGER NOT NULL DEFAULT 1,
  metodo_pago TEXT NOT NULL CHECK (metodo_pago IN ('efectivo', 'transferencia')),
  fecha_pago DATE NOT NULL DEFAULT CURRENT_DATE,
  hora_registro TIMESTAMPTZ DEFAULT NOW(),
  eliminado BOOLEAN DEFAULT FALSE,
  eliminado_at TIMESTAMPTZ,
  eliminado_motivo TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `expenses`
Gastos de la unidad que deben ser aprobados por el administrador.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del gasto |
| `unit_id` | uuid (FK → units) | Unidad |
| `categoria` | text | Categoría del gasto |
| `monto` | numeric(12,2) | Monto del gasto |
| `nota` | text | Nota opcional |
| `estado` | text | 'pendiente' / 'aprobado' / 'rechazado' |
| `aprobado_por` | uuid (FK → admins) | Admin que aprobó |
| `aprobado_at` | timestamptz | Cuándo fue aprobado |
| `creado_por` | text | Username de la unidad |
| `fecha` | date | Fecha del gasto |
| `created_at` | timestamptz | Fecha de registro |

```sql
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  categoria TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  nota TEXT,
  estado TEXT DEFAULT 'pendiente' CHECK (estado IN ('pendiente', 'aprobado', 'rechazado')),
  aprobado_por UUID REFERENCES admins(id),
  aprobado_at TIMESTAMPTZ,
  creado_por TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `capital_movements`
Ingresos y retiros que el administrador hace a la unidad.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del movimiento |
| `unit_id` | uuid (FK → units) | Unidad afectada |
| `admin_id` | uuid (FK → admins) | Admin que realizó el movimiento |
| `tipo` | text | 'ingreso' / 'retiro' |
| `monto` | numeric(12,2) | Monto |
| `nota` | text | Descripción del movimiento |
| `fecha` | date | Fecha del movimiento |
| `created_at` | timestamptz | Fecha de registro |

```sql
CREATE TABLE capital_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  admin_id UUID NOT NULL REFERENCES admins(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'retiro')),
  monto NUMERIC(12,2) NOT NULL,
  nota TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `box_adjustments`
Cuadres de caja: registros automáticos cuando se elimina un pago o préstamo, o se realizan movimientos que afectan la caja.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del cuadre |
| `unit_id` | uuid (FK → units) | Unidad |
| `tipo` | text | 'entrada' / 'salida' |
| `concepto` | text | 'eliminacion_pago', 'eliminacion_prestamo', 'error_operativo', etc. |
| `monto` | numeric(12,2) | Monto del ajuste |
| `referencia_id` | uuid | ID del pago/préstamo relacionado |
| `referencia_tipo` | text | 'payment' / 'loan' |
| `descripcion` | text | Descripción detallada |
| `fecha` | date | Fecha del ajuste |
| `created_at` | timestamptz | Fecha de registro |

```sql
CREATE TABLE box_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('entrada', 'salida')),
  concepto TEXT NOT NULL,
  monto NUMERIC(12,2) NOT NULL,
  referencia_id UUID,
  referencia_tipo TEXT,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

### `weekly_adjustments`
Ajustes de referencia del flujo semanal. NUNCA afectan la caja real, solo son para el reporte de flujo semanal.

| Columna | Tipo | Descripción |
|---------|------|-------------|
| `id` | uuid (PK) | ID del ajuste |
| `unit_id` | uuid (FK → units) | Unidad |
| `tipo` | text | 'ingreso' / 'egreso' |
| `monto` | numeric(12,2) | Monto de referencia |
| `descripcion` | text | Descripción del ajuste |
| `fecha` | date | Fecha de referencia |
| `semana_inicio` | date | Inicio de la semana a la que pertenece |
| `created_at` | timestamptz | Fecha de registro |

```sql
CREATE TABLE weekly_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES units(id),
  tipo TEXT NOT NULL CHECK (tipo IN ('ingreso', 'egreso')),
  monto NUMERIC(12,2) NOT NULL,
  descripcion TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  semana_inicio DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Índices para Performance

```sql
-- Préstamos activos por unidad (query más frecuente)
CREATE INDEX idx_loans_unit_estado ON loans(unit_id, estado);

-- Pagos por fecha (reporte diario)
CREATE INDEX idx_payments_unit_fecha ON payments(unit_id, fecha_pago) WHERE eliminado = FALSE;

-- Clientes por unidad
CREATE INDEX idx_clients_unit ON clients(unit_id);

-- Gastos pendientes por unidad
CREATE INDEX idx_expenses_unit_estado ON expenses(unit_id, estado);

-- Préstamos por cliente (historial)
CREATE INDEX idx_loans_client ON loans(client_id);

-- Ajustes de caja por fecha
CREATE INDEX idx_box_adjustments_unit_fecha ON box_adjustments(unit_id, fecha);
```

---

## Row Level Security (RLS)

```sql
-- Activar RLS en todas las tablas
ALTER TABLE units ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE loans ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE capital_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE box_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE weekly_adjustments ENABLE ROW LEVEL SECURITY;

-- Las unidades solo ven SUS datos
CREATE POLICY "unit_own_data" ON clients
  FOR ALL USING (unit_id = auth.uid());

CREATE POLICY "unit_own_loans" ON loans
  FOR ALL USING (unit_id = auth.uid());

CREATE POLICY "unit_own_payments" ON payments
  FOR ALL USING (unit_id = auth.uid());

-- Los admins ven TODO (usando metadata de rol)
CREATE POLICY "admin_all_data" ON clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );
```

---

## Funciones SQL Útiles

```sql
-- Calcular caja actual de una unidad para una fecha
CREATE OR REPLACE FUNCTION calculate_caja(p_unit_id UUID, p_fecha DATE)
RETURNS NUMERIC AS $$
DECLARE
  v_capital_inicial NUMERIC;
  v_cobrado NUMERIC;
  v_prestado NUMERIC;
  v_gastos NUMERIC;
  v_ingresos NUMERIC;
  v_retiros NUMERIC;
BEGIN
  SELECT capital_inicial INTO v_capital_inicial FROM units WHERE id = p_unit_id;
  
  SELECT COALESCE(SUM(monto), 0) INTO v_cobrado
    FROM payments WHERE unit_id = p_unit_id AND fecha_pago <= p_fecha AND eliminado = FALSE;
  
  SELECT COALESCE(SUM(valor_neto), 0) INTO v_prestado
    FROM loans WHERE unit_id = p_unit_id AND fecha_inicio <= p_fecha;
  
  SELECT COALESCE(SUM(monto), 0) INTO v_gastos
    FROM expenses WHERE unit_id = p_unit_id AND fecha <= p_fecha AND estado = 'aprobado';
  
  SELECT COALESCE(SUM(CASE WHEN tipo = 'ingreso' THEN monto ELSE -monto END), 0) INTO v_ingresos
    FROM capital_movements WHERE unit_id = p_unit_id AND fecha <= p_fecha;
  
  RETURN v_capital_inicial + v_cobrado - v_prestado - v_gastos + v_ingresos;
END;
$$ LANGUAGE plpgsql;
```

---

## Ver También
- [[ARQUITECTURA]] — Stack y patrones generales
- [[reglas-de-negocio/REGLAS]] — Reglas de negocio que afectan la DB
- [[seguridad/SEGURIDAD]] — RLS policies detalladas
