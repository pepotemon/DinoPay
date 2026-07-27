---
tags: [funcionalidad, pantalla, prestamos, cobros, pagos, unidad]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: PRÉSTAMOS — Lista de Trabajo Diaria

[[INDEX|← Volver al Index]]

---

## Objetivo
Es la pantalla principal de trabajo de la unidad. Aquí se listan todos los préstamos activos y se registran los pagos del día. Es el corazón de la operación diaria.

Estado de implementación: ✅ Implementada y rediseñada (2026-07-27). Lista conectada a préstamos activos, registro de pago, no-pago, historial, detalles y edición de cliente operativos. Diseño propio con cabecera sticky + lista compacta + bottom sheet unificado.

## Problema que Resuelve
El cobrador necesita ver rápidamente quién debe pagar hoy, cuánto lleva cobrado, y registrar pagos con el menor número de toques posible.

---

## Estructura de la Pantalla

```
┌─────────────────────────────────────┐
│ DinoPay                 [Enrutar →] │  ← cabecera sticky
│ Cuotas del Día                      │
│ $124,000 cobrado · $450k meta · 27% │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← barra de progreso fina
│ 🔍 Nombre, barrio o teléfono…       │
│ [Pendientes (12)]  [Visitados (4)]  │
├─────────────────────────────────────┤
│ ● Juan Carlos Lopez    $15,000  >   │  ← fila por cliente
│   El Carmen · 3/20 cuotas           │
│ ● Maria Perez          $8,000   >   │
│   Centro · 10/20 cuotas             │
│ ● Carlos Ruiz          $20,000  >   │  ← punto gris = pendiente
│   ...                               │
└─────────────────────────────────────┘

Al tocar una fila → bottom sheet:
┌─────────────────────────────────────┐
│ ─────── (handle)                    │
│ Juan Carlos Lopez          [←] [×]  │
│ Calle 45 · El Carmen                │
│ ┌─────────┬──────────┬──────────┐  │
│ │ Cuota   │  Saldo   │  Cuotas  │  │
│ │$15,000  │ $285,000 │   3/20   │  │
│ └─────────┴──────────┴──────────┘  │
│ [Llamar]           [WhatsApp]       │
│ [── No Pago ──]  [──── Pagar ────] │
│ ─────────────────────────────────   │
│  Ver Detalles                       │
│  Historial de Pagos                 │
│  Historial de Préstamos             │
│  Editar Cliente                     │
└─────────────────────────────────────┘
```

El bottom sheet evoluciona internamente entre vistas (main → pagar → confirmar, main → no-pago → confirmar, main → historial, etc.) usando una máquina de estados con botón Volver.

---

## Totalizador del Día

| Dato | Cálculo |
|------|---------|
| **Recaudado hoy** | Suma de todos los pagos del día (no eliminados) |
| **Meta del día** | Suma de las cuotas de todos los préstamos activos para hoy |
| **Total que falta** | Meta del día - Recaudado hoy |
| **Progreso** | Recaudado hoy / Meta del día × 100 |
| **Visitados** | Cantidad de préstamos con al menos un pago hoy / Total activos |

> **Meta del día**: se considera la cuota de TODOS los préstamos activos, independientemente de si son diarios, semanales, etc. El sistema debe calcular cuáles tienen cuota hoy según su modalidad y días laborales de la unidad.

---

## Filtros

| Filtro | Muestra |
|--------|---------|
| **Todos** | Todos los préstamos activos |
| **Pendientes** | Préstamos sin pago registrado hoy |
| **Visitados** | Préstamos con al menos un pago hoy |

> Los préstamos marcados como "No pago" (sin registrar pago pero marcados como visitados) también aparecen en "Visitados".

---

## Tarjeta de Préstamo

### Información Principal
```
┌─────────────────────────────────────────┐
│ [ALIAS CLIENTE]          [CUOTA DE HOY] │
│ Cuota: 2/20              $25,000        │
│ Saldo: $480,000                         │
│ Préstamo: $500,000  Pagado: $20,000     │
├─────────────────────────────────────────┤
│ [📋 Copiar] [📍 Mapa] [⋮ Más opciones] │
│                                         │
│           [No Pagó] [Pagar]             │
└─────────────────────────────────────────┘
```

### Campos de la Tarjeta
| Campo | Descripción |
|-------|-------------|
| Alias cliente | Nombre del cliente |
| Cuota de hoy | Valor de UNA cuota |
| Cuota N/Total | Número de cuota actual sobre total (ej: 2/20) |
| Saldo | Dinero que aún debe el cliente |
| Préstamo | Capital original prestado |
| Pagado | Total pagado hasta ahora |

### Botones de Acción

**[📋 Copiar]** — Genera una imagen/texto con el estado actual del préstamo para compartir por WhatsApp u otro medio.

**[📍 Mapa]** — Abre Google Maps con la ubicación del cliente.

**[⋮ Más opciones]** — Menú desplegable con:
- 💬 **WhatsApp** — Abre WhatsApp con el número del cliente
- 📞 **Llamar** — Abre marcador con el número del cliente
- 👁️ **Ver detalles** — Modal con toda la información
- (Si el cliente tiene pagos del día también aparece "Eliminar pago")

**[No Pagó]** — Marca al cliente como "visitado sin pago". No registra movimiento de caja. El cliente pasa al filtro "Visitados".

Implementación: se registra en `loan_visits` con `tipo = 'no_pago'`, no en `payments`, para no afectar la caja.

**[Pagar]** — Abre el modal de registro de pago.

---

## Modal de Registro de Pago

```
┌─────────────────────────────────────┐
│         REGISTRAR PAGO              │
│                                     │
│  [◀] Cuotas: 1 [▶]                  │
│                                     │
│  Monto a pagar:  [$25,000]          │
│  (se calcula automático según cuotas)│
│                                     │
│  Método de pago:                    │
│  [○ Efectivo] [○ Transferencia]     │
│                                     │
│       [Cancelar] [Registrar]        │
└─────────────────────────────────────┘
```

### Comportamiento del Modal
- **Cuotas**: por defecto en 1. Flechas ◀▶ para cambiar entre 1 y el número de cuotas restantes.
- **Monto**: se calcula automáticamente: `cuotas_seleccionadas × valor_cuota`
- El monto es **editable** para permitir pagos parciales o pagos con propina
- **Método de pago**: efectivo o transferencia (afecta reportes pero no la caja total)
- Al registrar: se crea un registro en `payments`, se actualiza `cuotas_pagadas` y `saldo` en `loans`

### Caso especial: Pago completa el préstamo
Si `cuotas_pagadas + cuotas_este_pago >= numero_cuotas`, el préstamo se marca como `completado` y el cliente se mueve automáticamente a [[PANTALLA-CLIENTES-DISPONIBLES]].

---

## Modal "Ver Detalles"

### Sección: Detalles del Cliente
- Alias, NIT, Dirección, Barrio, Teléfonos, Género, Ubicación en mapa

### Sección: Detalles del Préstamo
| Campo | Valor |
|-------|-------|
| Modalidad | diaria / semanal / quincenal / mensual |
| Interés | 10% |
| Cuotas Parciales | 2/20 |
| Valor Cuota | $25,000 |
| Último Pago | 2026-07-23 |
| Fecha de Inicio | 2026-07-01 |
| Fecha de Fin | 2026-07-31 |
| Fecha de Creación | 2026-07-01 |

### Sección: Historial de Pagos (préstamo actual)
Lista de todos los pagos registrados para este préstamo activo.

### Sección: Historial de Préstamos
Todos los préstamos anteriores de este cliente (incluye los completados).

### Botón: Editar Cliente
Permite modificar los datos personales del cliente (no los del préstamo activo).

---

## Buscador
- Búsqueda en tiempo real por nombre/alias del cliente
- Filtra la lista sin recargar la página
- Mantiene el filtro de Todos/Pendientes/Visitados activo

---

## Ordenamiento de la Lista
Los préstamos se muestran en el orden configurado en [[PANTALLA-ENRUTAR]]. El cobrador decide el orden óptimo para su ruta del día.

---

## Archivos Involucrados
- `src/app/unidad/prestamos/page.tsx` — Server Component, carga datos de Supabase
- `src/app/unidad/prestamos/loading.tsx` — skeleton de carga
- `src/app/unidad/prestamos/[id]/page.tsx` — detalle de préstamo individual
- `src/app/unidad/prestamos/[id]/editar-cliente/page.tsx` — edición de datos del cliente
- `src/components/unidad/prestamos-client.tsx` — UI completa (cabecera + lista + bottom sheet)
- `src/components/unidad/payment-inputs.tsx` — formulario de cuotas/monto/método
- `src/lib/actions/unidad/payments.ts` — Server Actions: `registerPaymentAction`, `markNoPayVisitResult`

---

## Reglas de Negocio
- Solo se pueden registrar pagos en días laborales de la unidad
- Un pago eliminado genera un registro en `box_adjustments`
- Los pagos solo se pueden eliminar dentro de los `dias_bloqueados_eliminacion` configurados en la unidad
- El saldo no puede quedar negativo

---

## Ver También
- [[PANTALLA-ENRUTAR]] — Configurar orden de la lista
- [[PANTALLA-CLIENTES-DISPONIBLES]] — Donde van los clientes que terminan
- [[reglas-de-negocio/REGLAS#Pagos]] — Reglas de pagos
