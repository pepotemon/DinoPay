---
tags: [AI, guia, onboarding, instrucciones]
created: 2026-07-24
updated: 2026-07-24
---

# Guía para IAs — Cómo Entender DinoPay

[[INDEX|← Volver al Index]]

> Este documento permite que cualquier IA nueva pueda entender el proyecto en minutos sin leer el código fuente.

---

## ¿Qué es DinoPay?

DinoPay es una **aplicación web de microcréditos y pagos** con dos tipos de usuarios:

1. **Administrador**: Crea y controla "unidades" (agentes de cobro)
2. **Unidad**: Gestiona su propia cartera de clientes y préstamos

**Colores**: Verde dinosaurio `#16a34a` y Blanco  
**Plataforma**: Web (móvil-first, ya que los cobradores trabajan en campo)

---

## Stack Tecnológico (Resumen)

```
Frontend:  Next.js 15 (App Router) + TypeScript
Estilos:   Tailwind CSS + shadcn/ui
Estado:    TanStack Query (servidor) + Zustand (cliente)
Backend:   Supabase (PostgreSQL + Auth + Realtime)
Formu:     React Hook Form + Zod
Maps:      Google Maps API
D&D:       dnd kit
```

---

## Estructura de Rutas

```
/login              → Página de login (admin o unidad)
/admin/             → Panel del administrador
  dashboard/        → Resumen global de todas las unidades
  unidades/         → CRUD de unidades
  gastos/           → Aprobar/rechazar gastos
/unidad/            → Panel de la unidad
  nuevo/            → Crear cliente + préstamo
  prestamos/        → Lista de trabajo (cobros del día)
  disponibles/      → Clientes con préstamo completado
  enrutar/          → Ordenar ruta de cobro
  gastos/           → Crear gastos
  reportes/         → Préstamos y pagos por fecha
  reporte-diario/   → Resumen del día
  flujo-semanal/    → Cuaderno personal semanal
```

---

## Entidades Principales (Base de Datos)

```
admins → units → clients → loans → payments
                               ↓
                          box_adjustments
                          
units → expenses
units → capital_movements
units → weekly_adjustments
```

**Tablas críticas**:
- `units`: Las unidades creadas por el admin
- `clients`: Clientes de cada unidad
- `loans`: Préstamos (activo/completado/cancelado)
- `payments`: Pagos registrados por la unidad

---

## Conceptos que Confunden a las IAs

### 1. "Caja" no está almacenada
La caja nunca se guarda en la DB. Siempre se calcula sumando todos los movimientos. Ver [[reglas-de-negocio/REGLAS#R-CAJ-03]].

### 2. Ajustes del Flujo Semanal ≠ Caja Real
Los `weekly_adjustments` son SOLO para la pantalla de flujo semanal. No afectan nada más. Ver [[funcionalidades/PANTALLA-FLUJO-SEMANAL#REGLA CRÍTICA]].

### 3. RLS hace el aislamiento
No hay lógica en el frontend para filtrar datos por unidad. Supabase RLS se encarga de que cada unidad solo vea SUS datos.

### 4. Un cliente puede estar en solo un lugar
O tiene préstamo activo (aparece en Préstamos) o no lo tiene (aparece en Disponibles). Nunca en ambos.

### 5. Gastos son asíncronos
Los gastos de la unidad NO afectan la caja hasta que el admin los aprueba.

---

## Flujo de Trabajo de una Unidad (Día Típico)

```
1. Unidad hace login → va a /unidad/prestamos
2. Ve la lista ordenada según su ruta configurada
3. Para cada cliente:
   a. Registra pago si pagó (botón "Pagar")
   b. Marca "No pagó" si no pagó
   c. Puede ver detalles, llamar, abrir WhatsApp
4. Al final del día revisa /unidad/reporte-diario
5. Si necesita registrar gastos → /unidad/gastos
6. Semanalmente revisa /unidad/flujo-semanal
```

---

## Reglas que Nunca Romper

1. **Un cliente activo no puede estar en dos listas a la vez**
2. **Los ajustes semanales no tocan la caja real**
3. **Los gastos sin aprobación no afectan la caja**
4. **El interés debe ser uno de los habilitados por el admin**
5. **La caja siempre se calcula, nunca se almacena directamente**
6. **Pagos eliminados generan cuadres de caja automáticamente**

---

## Dónde Encontrar Qué

| Pregunta | Dónde buscar |
|----------|-------------|
| ¿Qué hace X pantalla? | `cerebro/funcionalidades/PANTALLA-X.md` |
| ¿Cómo está la DB? | `cerebro/arquitectura/BASE-DE-DATOS.md` |
| ¿Por qué X tecnología? | `cerebro/decisiones/STACK-TECNOLOGICO.md` |
| ¿Qué significa X término? | `cerebro/glosario/GLOSARIO.md` |
| ¿Cuál es la regla para X? | `cerebro/reglas-de-negocio/REGLAS.md` |
| ¿Qué puede hacer el admin? | `cerebro/modulos/ADMINISTRADOR.md` |
| ¿Qué puede hacer la unidad? | `cerebro/modulos/UNIDAD.md` |
| ¿Cómo funciona el login? | `cerebro/arquitectura/AUTENTICACION.md` |

---

## Cómo Agregar una Nueva Funcionalidad

1. Crear `cerebro/funcionalidades/PANTALLA-NUEVA.md` con el template:
   - Objetivo
   - Flujo
   - Campos del formulario
   - Reglas de negocio
   - Archivos involucrados

2. Actualizar `INDEX.md` con el link a la nueva pantalla

3. Actualizar `reglas-de-negocio/REGLAS.md` si la funcionalidad tiene reglas nuevas

4. Actualizar `base-de-datos/SCHEMA.md` si hay tablas o columnas nuevas

5. Actualizar `roadmap/ROADMAP.md` y `changelog/CHANGELOG.md`

---

## Convenciones de Código

- **Componentes**: PascalCase (`TarjetaPrestamo.tsx`)
- **Funciones/hooks**: camelCase (`usePrestamoActivo`)
- **Archivos de queries**: `src/lib/queries/[entidad].ts`
- **Server Actions**: `src/lib/actions/[entidad].ts`
- **Variables en español**: nombres de negocio en español, código en inglés
- **Tipos Zod**: `[Entidad]Schema`, `[Entidad]Input`

---

## Ver También
- [[AI/COMO-TRABAJAR]] — Reglas de trabajo y documentación
- [[AI/REGLAS-CRITICAS]] — Qué nunca romper
- [[convenciones/CONVENCIONES]] — Convenciones de código detalladas
