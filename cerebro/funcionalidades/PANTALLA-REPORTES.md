---
tags: [funcionalidad, pantalla, reportes, prestamos, pagos]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: REPORTES DE PRÉSTAMOS Y PAGOS

[[INDEX|← Volver al Index]]

---

## Objetivo
Consultar el historial de préstamos creados y pagos registrados en un día específico, con totalizadores globales.

## Problema que Resuelve
El cobrador necesita revisar qué movimientos hizo en un día determinado para verificar su trabajo o resolver dudas de clientes.

---

## Estructura de la Pantalla

```
┌────────────────────────────────────────────┐
│  💰 Total Préstamos: $2,500,000            │
│  💵 Total Pagos:     $850,000              │
├────────────────────────────────────────────┤
│  📅 Fecha: [2026-07-24 ▼]                  │
├────────────────────────────────────────────┤
│  [Préstamos]  [Pagos]                      │
├────────────────────────────────────────────┤
│                                            │
│  (Lista según pestaña activa)              │
│                                            │
└────────────────────────────────────────────┘
```

---

## Totalizadores

| Totalizador | Cálculo | Período |
|-------------|---------|---------|
| **Total Préstamos** | Suma de `valor_neto` de todos los loans creados | Fecha seleccionada |
| **Total Pagos** | Suma de `monto` de todos los payments registrados | Fecha seleccionada |

---

## Filtro de Fecha
- Una **sola fecha** (no rango de fechas)
- Predeterminada: hoy
- El usuario puede cambiar para consultar días anteriores
- Los totalizadores se actualizan según la fecha seleccionada

---

## Vista: Préstamos (del día)

Lista de todos los préstamos **creados** en la fecha seleccionada.

### Tarjeta de Préstamo en Reporte
```
┌──────────────────────────────────────┐
│ Juan García                          │
│ Modalidad: Diaria | Interés: 10%     │
│ Capital: $500,000 → Total: $550,000  │
│ Cuotas: 20 | Cuota: $27,500          │
│ Creado: 10:30 AM                     │
└──────────────────────────────────────┘
```

| Dato | Fuente |
|------|--------|
| Nombre cliente | `clients.alias` |
| Modalidad | `loans.modalidad` |
| Interés | `loans.interes` |
| Capital prestado | `loans.valor_neto` |
| Total a cobrar | `loans.total_a_cobrar` |
| Número de cuotas | `loans.numero_cuotas` |
| Valor de cuota | `loans.valor_cuota` |
| Hora de creación | `loans.created_at` |

---

## Vista: Pagos (del día)

Lista de todos los pagos **registrados** en la fecha seleccionada (no eliminados).

### Tarjeta de Pago en Reporte
```
┌──────────────────────────────────────┐
│ María López                          │
│ Cuota 3/20 | Efectivo                │
│ Monto: $27,500                       │
│ Hora: 09:15 AM                       │
└──────────────────────────────────────┘
```

| Dato | Fuente |
|------|--------|
| Nombre cliente | `clients.alias` (via loan → client) |
| Cuota N/Total | `payments.numero_cuotas` aplicadas / `loans.numero_cuotas` |
| Método de pago | `payments.metodo_pago` |
| Monto | `payments.monto` |
| Hora | `payments.hora_registro` |

---

## Archivos Involucrados
- `src/app/unidad/reportes/page.tsx`
- `src/components/unidad/TarjetaReportePrestamo.tsx`
- `src/components/unidad/TarjetaReportePago.tsx`
- `src/lib/queries/reportes.ts`

---

## Consideraciones de Performance
- Para fechas muy antiguas con muchos registros, considerar paginación
- Los totalizadores se calculan en el servidor (SQL agregation) para evitar traer todos los registros al cliente

---

## Ver También
- [[PANTALLA-REPORTE-DIARIO]] — Reporte más completo del día
- [[PANTALLA-FLUJO-SEMANAL]] — Vista semanal
