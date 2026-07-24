---
tags: [modulo, unidad, agente, cobrador]
created: 2026-07-24
updated: 2026-07-24
---

# Módulo: UNIDAD

[[INDEX|← Volver al Index]]

---

## Descripción
La Unidad es el usuario operativo de DinoPay. Es creada por el Administrador y tiene acceso a su propia cartera de préstamos. No puede ver ni modificar datos de otras unidades.

---

## Capacidades de la Unidad

### Clientes y Préstamos
- ✅ Crear nuevos clientes con su préstamo inicial
- ✅ Ver todos sus préstamos activos
- ✅ Registrar pagos/abonos
- ✅ Marcar clientes como "No pagó"
- ✅ Ver clientes disponibles (sin préstamo activo)
- ✅ Activar nuevo préstamo para cliente existente
- ✅ Editar datos personales de clientes
- ✅ Ver historial de préstamos por cliente
- ❌ NO puede eliminar clientes permanentemente
- ❌ NO puede crear préstamos con intereses no habilitados

### Ruta
- ✅ Ordenar su ruta de cobro (drag & drop)
- ✅ Ver posición de cada cliente en la ruta

### Pagos
- ✅ Registrar pagos con método (efectivo/transferencia)
- ✅ Registrar pagos de múltiples cuotas a la vez
- ✅ Eliminar pagos (dentro del período permitido por el admin)
- ❌ NO puede eliminar pagos fuera del período bloqueado

### Gastos
- ✅ Crear gastos (quedan pendientes de aprobación)
- ✅ Editar/eliminar gastos en estado pendiente
- ❌ NO puede aprobar sus propios gastos

### Reportes
- ✅ Ver reporte diario de su unidad
- ✅ Ver reporte de préstamos y pagos
- ✅ Ver flujo semanal
- ✅ Crear ajustes en flujo semanal
- ❌ NO puede ver datos de otras unidades

---

## Restricciones Importantes

| Restricción | Razón |
|-------------|-------|
| Solo ve SUS clientes/préstamos | RLS en base de datos |
| Solo puede usar intereses habilitados por el admin | Control del admin sobre la rentabilidad |
| No puede inyectar/retirar capital | Solo el admin mueve el capital base |
| Los gastos necesitan aprobación | Control de gastos por parte del admin |
| Período de eliminación de pagos limitado | Evitar fraudes o errores intencionados |

---

## Navegación de la Unidad

```
/unidad/
├── nuevo/              # Crear cliente + préstamo
├── prestamos/          # Lista de trabajo (cobros del día)
├── disponibles/        # Clientes sin préstamo activo
├── enrutar/            # Ordenar ruta de cobro
├── gastos/             # Gastos de la unidad
├── reportes/           # Préstamos y pagos por fecha
├── reporte-diario/     # Resumen del día
└── flujo-semanal/      # Cuaderno semanal
```

---

## Datos que Ve la Unidad de Sí Misma

Desde su perfil o navegación puede ver:
- Nombre de la unidad
- Capital actual
- Ciudad / País de operación
- Intereses habilitados

---

## Datos que NO Ve la Unidad

- Capital inicial original
- Configuraciones internas (días bloqueados, etc.)
- Datos de otras unidades
- Panel de aprobación de gastos
- Movimientos de capital hechos por el admin

---

## Ver También
- [[modulos/ADMINISTRADOR]] — El rol superior
- [[AUTENTICACION]] — Sistema de login
- [[reglas-de-negocio/REGLAS#Permisos de la Unidad]]
