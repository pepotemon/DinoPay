---
tags: [funcionalidad, pantalla, clientes-disponibles, nuevo-prestamo]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: CLIENTES DISPONIBLES

[[INDEX|← Volver al Index]]

---

## Objetivo
Listar clientes que terminaron su préstamo y están disponibles para recibir uno nuevo. Desde aquí se puede activar un nuevo préstamo con datos pre-llenados del préstamo anterior.

Estado de implementación: 🔄 listado conectado a clientes sin préstamo activo y nuevo préstamo para cliente existente implementado. Indicador de calidad avanzado pendiente.

## Problema que Resuelve
Los clientes recurrentes (que ya pagaron completamente) necesitan poder recibir un nuevo préstamo rápidamente sin re-ingresar todos sus datos. Esta pantalla hace ese proceso fluido y en 1-2 toques.

---

## Regla Fundamental
> **Un cliente JAMÁS puede estar en Préstamos Activos y Clientes Disponibles al mismo tiempo.**
> - Cuando un préstamo se completa → el cliente pasa a Disponibles
> - Cuando un cliente disponible recibe un nuevo préstamo → sale de Disponibles y vuelve a Préstamos Activos

---

## Tarjeta del Cliente Disponible

```
┌─────────────────────────────────────────┐
│ [ALIAS CLIENTE]                     [⋮] │
│ Dirección: Cra 5 #12-34, Barrio Norte   │
│ Tel: 300-123-4567                       │
│ Género: Masculino                       │
│                                         │
│ Último préstamo: hace 3 días            │
│ (Completado el 2026-07-21)              │
└─────────────────────────────────────────┘
```

| Campo | Descripción |
|-------|-------------|
| Alias | Nombre del cliente |
| Dirección + Barrio | Dirección principal |
| Teléfono | Teléfono 1 |
| Tiempo del último préstamo | Cuándo finalizó su último préstamo |
| ⋮ | Menú: Editar cliente / Ver historial de préstamos |

---

## Flujo al Presionar la Tarjeta

Al presionar la tarjeta del cliente disponible, se abre el formulario de **Nuevo Préstamo** (NO el de nuevo cliente, ya que el cliente existe).

### Formulario de Nuevo Préstamo (cliente existente)

```
┌──────────────────────────────────────┐
│ ← [NOMBRE DEL CLIENTE]               │
│ ⭐ Cliente Bueno / ⚠️ Con atrasos     │
│                                      │
│ Calidad del cliente:                 │
│ "Pagó a tiempo | 0 cuotas en atraso" │
├──────────────────────────────────────┤
│ DATOS DEL PRÉSTAMO                   │
│                                      │
│ Modalidad: [Diaria ▼]   (prellenado) │
│ Interés:   [10%   ▼]   (prellenado) │
│ Valor Neto: [$500,000]  (prellenado) │
│ N° Cuotas:  [20]        (prellenado) │
│                                      │
│ ─── Resumen ───                      │
│ Total a cobrar: $550,000             │
│ Valor por cuota: $27,500             │
│                                      │
│        [Guardar Préstamo]            │
└──────────────────────────────────────┘
```

### Indicador de Calidad del Cliente
Se muestra arriba del formulario basado en el historial:

| Indicador | Condición |
|-----------|-----------|
| ⭐ **Cliente Bueno** | Pagó a tiempo, 0 cuotas en atraso en su último préstamo |
| ⚠️ **Cuotas pendientes** | Terminó pero tuvo días de atraso (pagó cuotas acumuladas) |
| 🔴 **Con historial difícil** | Múltiples atrasos en historial |

> El indicador es informativo — el cobrador decide si hace el préstamo igual.

### Pre-llenado del Formulario
Los campos se llenan con los datos del **último préstamo** del cliente:
- Modalidad → la del último préstamo
- Interés → el del último préstamo (siempre que siga habilitado en la unidad)
- Valor Neto → el del último préstamo
- Número de Cuotas → el del último préstamo

El cobrador puede **modificar** cualquier campo antes de guardar.

---

## Al Guardar el Nuevo Préstamo

1. Se crea un nuevo registro en `loans` con estado `activo`
2. El cliente desaparece de Clientes Disponibles
3. El cliente aparece en [[PANTALLA-PRESTAMOS]] como préstamo activo
4. La posición en la ruta: se intenta restaurar la posición del préstamo anterior. Ver [[reglas-de-negocio/REGLAS#Posicionamiento en Ruta]].

---

## Menú ⋮ (Opciones Rápidas)

| Opción | Acción |
|--------|--------|
| ✏️ Editar cliente | Edita datos personales del cliente |
| 📋 Ver historial | Lista todos los préstamos anteriores con detalle |

---

## Archivos Involucrados
- `src/app/unidad/disponibles/page.tsx`
- `src/components/unidad/TarjetaClienteDisponible.tsx`
- `src/components/unidad/FormNuevoPrestamo.tsx` — Reutilizable desde aquí y desde Nuevo
- `src/components/unidad/IndicadorCalidad.tsx`
- `src/lib/actions/prestamos.ts`
- `src/lib/queries/disponibles.ts`

---

## Reglas de Negocio
- Un cliente pasa a Disponibles SOLO cuando `cuotas_pagadas >= numero_cuotas` (saldo = 0)
- Si el interés del último préstamo ya no está habilitado en la unidad, el campo de interés quedará vacío para que el cobrador elija uno válido
- Al crear el nuevo préstamo, la `fecha_inicio = hoy`

---

## Ver También
- [[PANTALLA-PRESTAMOS]] — Lista de préstamos activos
- [[PANTALLA-ENRUTAR]] — Cómo se asigna la posición
- [[reglas-de-negocio/REGLAS#Ciclo de Vida del Préstamo]]
