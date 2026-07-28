---
tags: [funcionalidad, pantalla, prestamos, cobros, pagos, unidad]
created: 2026-07-24
updated: 2026-07-28 (v0.11.0)
---

# Pantalla: PRÉSTAMOS — Lista de Trabajo Diaria

[[INDEX|← Volver al Index]]

---

## Objetivo
Es la pantalla principal de trabajo de la unidad. Aquí se listan todos los préstamos activos y se registran los pagos del día. Es el corazón de la operación diaria.

Estado de implementación: ✅ Implementada y rediseñada (v0.11.0 — 2026-07-28). Lista conectada a préstamos activos, registro de pago (incluyendo parciales y múltiples por día), no-pago, historial, detalles y edición de cliente operativos. Diseño propio con cabecera sticky + lista compacta + bottom sheet unificado. Badges de atraso (naranja), adelantadas (verde) y estado (verde/rojo). Display de cuotas fraccionado (8.3/20). Historial de pagos y préstamos completamente rediseñados con stats y LoanCard. Cabecera con reloj en vivo / bandera / encargado. Filtro "Todos". Búsqueda cross-filter. Recibo PNG copiable.

## Problema que Resuelve
El cobrador necesita ver rápidamente quién debe pagar hoy, cuánto lleva cobrado, y registrar pagos con el menor número de toques posible.

---

## Estructura de la Pantalla

```
┌─────────────────────────────────────┐
│ DinoPay 🇨🇴              [Enrutar →] │  ← cabecera sticky
│ Cuotas del Día                      │
│ lun 28 jul. · 10:40 am · Juan D.   │  ← reloj en vivo + encargado
│ $124,000 cobrado · $450k meta · 27% │
│ 12/100 visitados · 88 pendientes    │
│ ████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  │  ← barra de progreso fina
│ 🔍 Nombre, barrio o teléfono…       │
│ [Todos(100)][Pendientes(88)][Visit.] │
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

## Fila de Préstamo (lista compacta)

```
● Juan Carlos Lopez    [Xd atraso]   $15,000  >
  El Carmen · 3 / 20 cuotas

● Maria Perez          [X adelantadas] $8,000  >
  Centro · 8.3 / 20 cuotas
```

### Indicador de color (punto izquierdo)
| Color | Significado |
|-------|-------------|
| Verde (primary) | Pago registrado hoy |
| Rojo (destructive) | Sin pago hoy |
| Naranja | Cuotas vencidas (atraso) |
| Verde claro | Cuotas adelantadas |
| Gris | Pendiente sin novedad |

### Badges
| Badge | Condición |
|-------|-----------|
| `Xd atraso` (naranja) | `ultima_cuota_fecha` en el pasado; X = días hábiles vencidos excluyendo domingos y festivos |
| `X adelantada(s)` (verde) | `ultima_cuota_fecha` en el futuro más de un período |

### Cuotas: display fraccionado
El valor se calcula siempre como `(total_a_cobrar - saldo) / valor_cuota`. Muestra decimales cuando hay pagos parciales (ej: `8.3 / 20`).

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

**[Pagar]** — Abre el modal de registro de pago. Si ya hay un pago registrado hoy, el botón cambia a **"Registrar otro pago"** — se pueden registrar múltiples pagos por día.

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

### Pago parcial
Si el monto ingresado es menor al `valor_cuota`:
- `saldo` baja por el monto real pagado
- `cuotas_pagadas` **no** avanza (solo avanzan cuotas completas: `floor(monto / valor_cuota)`)
- `ultima_cuota_fecha` no se mueve — la próxima cuota sigue siendo la misma fecha
- La pantalla de confirmación muestra fondo naranja y el aviso "No cubre una cuota completa"
- El display de cuotas refleja el pago: `8.3 / 20`

### Caso especial: Pago completa el préstamo
Si `saldo - monto <= 0`, el préstamo se marca como `completado` y el cliente se mueve automáticamente a [[PANTALLA-CLIENTES-DISPONIBLES]].

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

### Sección: Historial de Pagos (vista `info-payments`)
Grid de 4 stats: Total Pagado (destacado), Saldo, Cuotas Pagadas, Pagos Realizados. Cada pago lleva un tag de cuota acumulada (`#6,83`) en color primary. Si hay pago parcial muestra "Faltan $X para completar la cuota #N". Funciona tanto para el préstamo activo como para cualquier préstamo anterior.

### Sección: Historial de Préstamos (vista `info-loans`)
Header centrado: "HISTORIAL DE PRÉSTAMOS DE" (uppercase pequeño) + nombre del cliente (2xl, uppercase, negrilla). Muestra una `LoanCard` por cada préstamo (activo y anteriores). Cada tarjeta incluye: rango de fechas, grid 2×2 de stats, sección Resumen con bullets (total prestado, modalidad, cuotas parciales, días de atraso si aplica) y botón "Ver Pagos".

**Cuotas parciales** = cantidad de pagos donde `monto < valor_cuota` (no es una fracción).

**Días de atraso al completar** = si el último pago de un préstamo completado fue después de `fecha_fin`, muestra `"El cliente pagó su préstamo con X días de atraso"`.

### Botón: Editar Cliente
Permite modificar los datos personales del cliente (no los del préstamo activo).

---

## Buscador
- Búsqueda en tiempo real por nombre/alias del cliente
- Filtra la lista sin recargar la página
- **Cross-filter**: cuando hay texto en la barra de búsqueda, se ignora el filtro activo (Todos/Pendientes/Visitados) y se busca en todos los préstamos — permite encontrar cualquier cliente sin cambiar de pestaña

---

## Ordenamiento de la Lista
Los préstamos se muestran en el orden configurado en [[PANTALLA-ENRUTAR]]. El cobrador decide el orden óptimo para su ruta del día.

---

## Archivos Involucrados
- `src/app/unidad/prestamos/page.tsx` — Server Component: carga datos, auto-sync festivos, calcula `overdueByLoan` y `adelantadasByLoan`
- `src/app/unidad/prestamos/loading.tsx` — skeleton de carga
- `src/app/unidad/prestamos/[id]/page.tsx` — detalle de préstamo individual
- `src/app/unidad/prestamos/[id]/editar-cliente/page.tsx` — edición de datos del cliente
- `src/components/unidad/prestamos-client.tsx` — UI completa (cabecera sticky + lista + bottom sheet unificado con 10 vistas: main, pay, pay-confirm, nopay, nopay-confirm, info-details, info-payments, info-loans, receipt)
- `src/components/unidad/payment-inputs.tsx` — formulario de cuotas/monto/método (monto editable para parciales)
- `src/lib/actions/unidad/payments.ts` — Server Actions: `registerPaymentAction`, `markNoPayVisitResult`
- `src/lib/actions/admin/holidays.ts` — `syncHolidaysAction`: fetcha Nager.Date y cachea en tabla `holidays`
- `src/lib/utils/overdue.ts` — `calcularDiasAtraso` y `calcularCuotasAdelantadas`
- `supabase/migrations/012_fix_ultima_cuota_fecha.sql` — `next_due_date()` + corrige `ultima_cuota_fecha` en todas las funciones RPC
- `supabase/migrations/013_partial_payments.sql` — `register_payment` con soporte pagos parciales

---

## Reglas de Negocio
- Solo se pueden registrar pagos en días laborales de la unidad
- Un pago eliminado genera un registro en `box_adjustments`
- Los pagos solo se pueden eliminar dentro de los `dias_bloqueados_eliminacion` configurados en la unidad
- El saldo no puede quedar negativo
- `ultima_cuota_fecha` = PRÓXIMA fecha de cuota (no la última pagada). Se pone `null` al completar el préstamo
- `cuotas_pagadas` avanza solo por cuotas completas. Los pagos parciales reducen el saldo pero no mueven el contador
- Días de atraso: cuenta días hábiles desde `ultima_cuota_fecha` hasta hoy, excluyendo domingos y festivos del país de la unidad (`holidays` table)
- Festivos se sincronizan automáticamente desde Nager.Date al cargar la pantalla si no están cacheados

---

## Ver También
- [[PANTALLA-ENRUTAR]] — Configurar orden de la lista
- [[PANTALLA-CLIENTES-DISPONIBLES]] — Donde van los clientes que terminan
- [[reglas-de-negocio/REGLAS#Pagos]] — Reglas de pagos
