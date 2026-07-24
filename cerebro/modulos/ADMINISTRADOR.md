---
tags: [modulo, administrador, admin, gestion]
created: 2026-07-24
updated: 2026-07-24
---

# Módulo: ADMINISTRADOR

[[INDEX|← Volver al Index]]

---

## Descripción
El Administrador es el usuario de mayor jerarquía en DinoPay. Puede crear y gestionar múltiples unidades, monitorear todas las operaciones en tiempo real, aprobar gastos, inyectar o retirar capital, y ver reportes consolidados.

---

## Capacidades del Administrador

### Gestión de Unidades
- ✅ Crear nuevas unidades (con todos sus parámetros)
- ✅ Editar datos de una unidad existente
- ✅ Activar / desactivar una unidad
- ✅ Ver el estado en tiempo real de cada unidad
- ✅ Ver el historial completo de cualquier unidad

### Monitoreo
- ✅ Dashboard global con resumen de todas las unidades
- ✅ Ver préstamos activos de cualquier unidad
- ✅ Ver pagos del día de cualquier unidad
- ✅ Ver reportes diarios y semanales de cualquier unidad

### Gestión de Capital
- ✅ Inyectar capital (ingreso) a una unidad
- ✅ Retirar capital (retiro) de una unidad
- ✅ Ver el historial de movimientos de capital

### Aprobación de Gastos
- ✅ Ver todos los gastos pendientes de todas las unidades
- ✅ Aprobar o rechazar gastos individuales
- ✅ Crear gastos directamente en una unidad

### Configuración
- ✅ Definir categorías de gastos disponibles (global o por unidad)
- ✅ Configurar parámetros de cada unidad (intereses, días laborales, etc.)

---

## Formulario: Crear Nueva Unidad

| Campo | Tipo | Descripción |
|-------|------|-------------|
| **Nombre de usuario** | text | Username único para login |
| **Contraseña** | password | Contraseña de acceso |
| **Repetir contraseña** | password | Confirmación |
| **Nombre de la unidad** | text | Nombre comercial |
| **Encargado** | text | Persona responsable |
| **Teléfono** | tel | Teléfono de contacto |
| **Capital inicial** | number | Monto de dinero habilitado para empezar |
| **País** | select | País de operación |
| **Estado/Dpto.** | text | Estado o Departamento |
| **Ciudad** | text | Ciudad |
| **Zona horaria** | select | Ej: America/Bogota |
| **Días laborales** | multi-select | Lun, Mar, Mié, Jue, Vie, Sáb, Dom |
| **Días bloqueados para eliminación** | number | Días después del pago en que no se puede eliminar |
| **Intereses habilitados** | tags/chips | Porcentajes disponibles: ej. [5%, 10%, 15%, 20%] |

Al guardar, el sistema:
1. Crea el usuario en Supabase Auth
2. Registra la unidad en la tabla `units`
3. Muestra las credenciales al admin para compartir con el encargado

Estado de implementación: ✅ formulario conectado en `/admin/unidades/nueva`.

---

## Panel Admin: Estructura de Navegación

```
/admin/
├── dashboard/          # Resumen global de todas las unidades
├── unidades/           # Lista de unidades
│   ├── nueva/          # Crear nueva unidad
│   └── [id]/           # Detalle/edición de una unidad
│       ├── prestamos/  # Préstamos activos de la unidad
│       ├── gastos/     # Gastos de la unidad (aprobar/rechazar)
│       ├── capital/    # Movimientos de capital
│       └── reportes/   # Reportes de la unidad
├── gastos/             # Todos los gastos pendientes (de todas las unidades)
└── configuracion/      # Ajustes globales del sistema
```

---

## Dashboard Global del Admin

Muestra para cada unidad (tarjetas):
- Nombre de la unidad
- Capital actual
- Cobrado hoy
- Préstamos activos (cantidad)
- Gastos pendientes de aprobar (cantidad)
- Último acceso de la unidad

---

## Aprobación de Gastos

Desde `/admin/gastos` el admin ve todos los gastos `pendiente` de todas las unidades.

```
┌─────────────────────────────────────┐
│ Unidad: Norte | Gasolina | $45,000  │
│ Creado: 2026-07-24 por: unidad_norte│
│ Nota: Recorrido zona industrial     │
│                                     │
│       [Rechazar]    [Aprobar]       │
└─────────────────────────────────────┘
```

Al aprobar: el gasto afecta la caja de la unidad a partir de ese momento.

---

## Movimientos de Capital

Desde el panel de una unidad, el admin puede:
- **Inyectar capital**: `+monto` → entra a la caja de la unidad
- **Retirar capital**: `-monto` → sale de la caja de la unidad

Estos movimientos se registran en `capital_movements` y generan `box_adjustments`.

---

## Archivos Involucrados
- `src/app/admin/` — Todo el panel admin
- `src/components/admin/FormNuevaUnidad.tsx`
- `src/components/admin/DashboardGlobal.tsx`
- `src/components/admin/TarjetaGastoPendiente.tsx`
- `src/lib/actions/admin/unidades.ts`
- `src/lib/actions/admin/gastos.ts`
- `src/lib/actions/admin/capital.ts`

---

## Ver También
- [[modulos/UNIDAD]] — Qué puede hacer la unidad
- [[AUTENTICACION]] — Cómo se diferencia el admin de la unidad
- [[reglas-de-negocio/REGLAS#Permisos del Administrador]]
