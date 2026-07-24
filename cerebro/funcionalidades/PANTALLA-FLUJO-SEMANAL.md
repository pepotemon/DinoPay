---
tags: [funcionalidad, pantalla, flujo-semanal, ajustes, cuaderno]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: FLUJO SEMANAL

[[INDEX|← Volver al Index]]

---

## Objetivo
Es el "cuaderno personal" de la unidad. Permite ver el resumen de la semana y crear ajustes de referencia (ingresos/egresos personales) que NO afectan la caja real pero sí el cálculo del flujo semanal personal.

## Concepto Clave
> El Flujo Semanal es un **reporte operativo personal**, NO un registro contable. Los ajustes aquí no mueven dinero real — son referencias para que el cobrador sepa cuánto tiene "a mano" después de gastos personales.

---

## Estructura de la Pantalla

```
┌────────────────────────────────────────────┐
│  FLUJO SEMANAL                             │
│  Semana: [◀ 21-27 Jul 2026 ▶]   [Ajuste]  │
├────────────────────────────────────────────┤
│  💵 Cobrado:       $1,850,000              │
│     Efectivo:    $1,600,000                │
│     Transferencia: $250,000                │
│  📤 Prestado:       $500,000               │
│  💸 Gastos:          $95,000               │
│                                            │
│  ══════════════════════════════            │
│  🏦 Recaudado:     $1,255,000              │
│  (ajustes incluidos: -$50,000)             │
├────────────────────────────────────────────┤
│  RESUMEN POR DÍA                           │
│  ┌──────────────────────────────────────┐  │
│  │ Lunes 21 Jul                         │  │
│  │ Cobrado: $280,000 | Prestado: $0     │  │
│  │ Gastos: $15,000 | Recaudado: $265,000│  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ Martes 22 Jul                        │  │
│  │ Cobrado: $320,000 | Prestado: $100K  │  │
│  │ Gastos: $0 | Recaudado: $220,000     │  │
│  └──────────────────────────────────────┘  │
│  ...                                       │
├────────────────────────────────────────────┤
│  AJUSTES DE LA SEMANA                      │
│  ┌──────────────────────────────────────┐  │
│  │ ⬆️ Ingreso personal   +$30,000       │  │
│  │ Nota: Abono a deuda                  │  │
│  │ 2026-07-22                           │  │
│  └──────────────────────────────────────┘  │
│  ┌──────────────────────────────────────┐  │
│  │ ⬇️ Egreso personal    -$80,000       │  │
│  │ Nota: Pago arriendo                  │  │
│  │ 2026-07-24                           │  │
│  └──────────────────────────────────────┘  │
└────────────────────────────────────────────┘
```

---

## Totalizadores Semanales

### Cobrado
Suma total de todos los pagos registrados en la semana (no eliminados).
- Desglosado en: Efectivo + Transferencia

### Prestado
Suma total de `valor_neto` de todos los préstamos creados durante la semana.

### Gastos
Suma de gastos **aprobados** por el admin durante la semana.

### Recaudado (la cifra más importante)
```
Recaudado = Cobrado - Prestado - Gastos ± Ajustes_de_la_semana
```
Es lo que "queda en mano" después de todas las operaciones y ajustes personales.

> **Nota importante**: Los ajustes solo afectan el cálculo del Recaudado dentro de ESTA pantalla. No afectan la caja real en ningún otro lugar del sistema.

---

## Resumen por Día

Para cada día de la semana, se muestra:
| Dato | Cálculo |
|------|---------|
| Cobrado | Suma de pagos de ese día |
| Prestado | Suma de préstamos creados ese día |
| Gastos | Gastos aprobados de ese día |
| Recaudado del día | Cobrado - Prestado - Gastos (sin ajustes — los ajustes solo van al total) |

---

## Botón: AJUSTE

Al presionar el botón "Ajuste" aparece un modal:

```
┌──────────────────────────────┐
│ NUEVO AJUSTE                 │
│                              │
│ Tipo:                        │
│ [○ Ingreso] [○ Egreso]       │
│                              │
│ Monto: [$         ]          │
│                              │
│ Descripción:                 │
│ [                        ]   │
│                              │
│ Fecha: [2026-07-24]          │
│                              │
│     [Cancelar] [Guardar]     │
└──────────────────────────────┘
```

Los ajustes se guardan en la tabla `weekly_adjustments` con el campo `semana_inicio` para saber a qué semana pertenecen.

---

## Navegación de Semanas
- La semana por defecto es la **semana actual** (lunes a domingo)
- Flechas ◀ ▶ para navegar semanas anteriores
- Se puede editar/eliminar ajustes de cualquier semana anterior

---

## REGLA CRÍTICA: Aislamiento de Ajustes

> Los ajustes de flujo semanal son **INVISIBLES** para:
> - [[PANTALLA-REPORTE-DIARIO]] — No aparecen en la caja
> - [[PANTALLA-REPORTES]] — No aparecen en reportes de pagos/préstamos
> - Panel del admin — No afectan los datos que ve el admin
>
> Solo existen dentro de esta pantalla de flujo semanal.

---

## Archivos Involucrados
- `src/app/unidad/flujo-semanal/page.tsx`
- `src/components/unidad/TotalizadoresSemanales.tsx`
- `src/components/unidad/ResumenDiaSemanal.tsx`
- `src/components/unidad/ListaAjustes.tsx`
- `src/components/unidad/ModalAjuste.tsx`
- `src/lib/actions/ajustes.ts`
- `src/lib/queries/flujo-semanal.ts`

---

## Ver También
- [[PANTALLA-REPORTE-DIARIO]] — Reporte más detallado (caja real)
- [[base-de-datos/SCHEMA#weekly_adjustments]]
- [[reglas-de-negocio/REGLAS#Flujo Semanal]]
