---
tags: [funcionalidad, pantalla, gastos, unidad, admin]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: GASTOS

[[INDEX|← Volver al Index]]

---

## Estado de Implementacion
- Ruta `/unidad/gastos` creada con resumen, formulario de registro y listado de gastos recientes.
- Los gastos se insertan en `expenses` con estado inicial `pendiente`.
- Queda pendiente editar/eliminar gastos desde unidad y aprobacion/rechazo desde admin.

---

## Objetivo
Registrar los gastos operativos de la unidad. Cada gasto queda pendiente de aprobación por el administrador antes de afectar la caja real.

## Problema que Resuelve
Las unidades tienen gastos diarios (gasolina, comidas, papelería, etc.) que necesitan ser transparentes y aprobados por el administrador antes de descontarse del capital.

---

## Estructura de la Pantalla

```
┌────────────────────────────────────────┐
│ GASTOS                  [+ Nuevo Gasto] │
├────────────────────────────────────────┤
│ Desde: [2026-07-21]  Hasta: [2026-07-27] │
│ (predeterminado: semana actual)         │
├────────────────────────────────────────┤
│ ┌────────────────────────────────────┐ │
│ │ Gasolina            $45,000        │ │
│ │ Creado por: unidad_norte           │ │
│ │ 2026-07-24                         │ │
│ │ [● Pendiente]       [✏️] [🗑️]      │ │
│ └────────────────────────────────────┘ │
│ ┌────────────────────────────────────┐ │
│ │ Almuerzo            $15,000        │ │
│ │ Creado por: unidad_norte           │ │
│ │ Nota: Reunión con cliente          │ │
│ │ 2026-07-23                         │ │
│ │ [✅ Aprobado]       [Ver]          │ │
│ └────────────────────────────────────┘ │
└────────────────────────────────────────┘
```

---

## Modal: Nuevo Gasto

```
┌──────────────────────────────┐
│ NUEVO GASTO                  │
│                              │
│ Categoría: [Seleccionar ▼]   │
│                              │
│ Monto: [$         ]          │
│                              │
│ Nota (opcional):             │
│ [                        ]   │
│                              │
│     [Cancelar] [Guardar]     │
└──────────────────────────────┘
```

### Categorías de Gastos (configurables por admin)
Categorías predeterminadas sugeridas:
- Gasolina / Combustible
- Alimentación
- Transporte
- Papelería
- Comunicaciones
- Otros

> Las categorías disponibles serán configurables desde el panel admin. Ver [[modulos/ADMINISTRADOR#Categorías de Gastos]].

---

## Tarjeta de Gasto

| Elemento | Descripción |
|----------|-------------|
| Categoría | Nombre de la categoría |
| Monto | Valor del gasto |
| Creado por | `username` de la unidad que lo creó |
| Fecha | Fecha del gasto |
| Nota | Si tiene nota, se muestra |
| Estado | Píldora de color según estado |
| Botones | Según estado (ver tabla abajo) |

### Estados y Botones

| Estado | Color | Botones disponibles |
|--------|-------|---------------------|
| **Pendiente** | Amarillo 🟡 | ✏️ Editar, 🗑️ Eliminar |
| **Aprobado** | Verde ✅ | Solo ver detalles (no editable) |
| **Rechazado** | Rojo 🔴 | Solo ver detalles |

> Los gastos aprobados o rechazados NO se pueden editar ni eliminar desde la unidad. Solo el admin puede modificar el estado.

---

## Filtro de Fechas

- Muestra la semana actual por defecto (lunes a domingo)
- El usuario puede cambiar las fechas para ver gastos de otras semanas/períodos
- Este patrón de "semana actual por defecto" se repite en varios reportes de la app

---

## Impacto en la Caja

| Estado del Gasto | ¿Afecta la caja? |
|-----------------|-----------------|
| Pendiente | ❌ NO |
| Aprobado | ✅ SÍ — se resta de la caja real |
| Rechazado | ❌ NO |

Los gastos aprobados por el admin se suman en la columna "Gastos" del [[PANTALLA-REPORTE-DIARIO]] y del [[PANTALLA-FLUJO-SEMANAL]].

---

## Archivos Involucrados
- `src/app/unidad/gastos/page.tsx`
- `src/components/unidad/TarjetaGasto.tsx`
- `src/components/unidad/ModalNuevoGasto.tsx`
- `src/lib/actions/gastos.ts`
- `src/lib/queries/gastos.ts`

---

## Reglas de Negocio
- La unidad solo puede editar/eliminar gastos en estado `pendiente`
- El monto mínimo de un gasto es $0.01
- Al crear un gasto, el estado inicial siempre es `pendiente`
- La aprobación/rechazo es función exclusiva del administrador
- Un gasto aprobado genera un cuadre de caja negativo (`salida`) en `box_adjustments`

---

## TODOs
- [ ] Definir si el admin puede crear gastos directamente en la unidad (sin que la unidad los cree)
- [ ] Notificación push al admin cuando hay gastos pendientes de aprobar

---

## Ver También
- [[modulos/ADMINISTRADOR#Aprobación de Gastos]] — Vista del admin
- [[PANTALLA-REPORTE-DIARIO]] — Dónde aparecen los gastos aprobados
- [[reglas-de-negocio/REGLAS#Gastos]]
