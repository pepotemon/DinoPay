---
tags: [changelog, historial, cambios]
created: 2026-07-24
updated: 2026-07-24
---

# Changelog — DinoPay

[[INDEX|← Volver al Index]]

> Solo se registran cambios importantes. No trivialidades.

---

## [0.6.0] — 2026-07-24

### Agregado

**Streaming con Suspense en pantallas lentas**
- `nuevo/page.tsx` y `disponibles/page.tsx` refactorizados: el shell estático (título, botones) renderiza instantáneamente; los datos de Supabase streaman en segundo plano dentro de `<Suspense>`
- Skeleton animado aparece donde irán los datos mientras cargan, en lugar de pantalla en blanco
- `loading.tsx` agregados en `nuevo/`, `disponibles/` y `enrutar/` (faltaban) para navegación dura

**Préstamos nativos (sin recarga)**
- Filtros y búsqueda: `useState` en cliente, sin URL params ni viaje al servidor
- Registro de pago y "Sin pago hoy": `router.refresh()` en lugar de `redirect()`, la página actualiza en segundo plano sin mover la pantalla
- `prefetch={true}` en links del menú del bottom nav para precargar pantallas secundarias

---

## [0.5.0] — 2026-07-24

### Agregado

**Navegación móvil (bottom nav)**
- Nuevo componente cliente `src/components/unidad/bottom-nav.tsx`
- Barra fija en la parte inferior con 4 accesos: Préstamos, Nuevo, Disponibles, Menú
- Botón "Menú" abre overlay con: Enrutar clientes, Gastos, Reportes, Caja, Flujo semanal
- Botón "Cerrar sesión" en rojo al final del menú (lógica de logout inline)
- Estado activo resaltado en color primario en barra y dentro del menú
- Header reducido a logo únicamente; nav horizontal eliminada
- `pb-24` en `<main>` para que el contenido no quede tapado por la barra

---

## [0.4.0] — 2026-07-24

### Agregado

**Anular pago** (eliminar con recálculo)
- Nueva migración `supabase/migrations/010_reverse_payment.sql` con RPC `reverse_payment(p_payment_id, p_unit_id)`
- El RPC verifica propiedad, respeta `dias_bloqueados_eliminacion` de la unidad, hace soft-delete del pago y revierte el préstamo (saldo, cuotas_pagadas, estado activo si estaba completado)
- Server action `deletePaymentAction` en `src/lib/actions/unidad/payments.ts`
- Botón de papelera (Trash2) en cada pago del historial en `/unidad/prestamos/[id]`
- **IMPORTANTE**: ejecutar `010_reverse_payment.sql` en Supabase antes de usar

**Ver detalle de unidad (admin)**
- Nueva página `/admin/unidades/[id]` con: métricas (caja estimada, cartera activa, cobrado hoy, meta del día), historial de movimientos de capital, formulario para inyectar/retirar capital
- Nueva página `/admin/unidades` con lista de todas las unidades (enlace desde nav)
- Nav admin actualizado: nuevo link "Unidades" → `/admin/unidades`

**Inyectar/retirar capital (admin)**
- Server action `createCapitalMovementAction` en `src/lib/actions/admin/capital.ts`
- Inserta en tabla `capital_movements` con admin_id, unit_id, tipo (ingreso/retiro), monto, nota, fecha
- Formulario en la página de detalle de la unidad

**Caja estimada corregida**
- `reporte-diario` y `admin/unidades/[id]` ahora incluyen `capital_movements` en el cálculo de caja
- Fórmula completa: `capital_inicial + total_cobrado - total_prestado - gastos_aprobados + capital_inyectado - capital_retirado`

**Editar ajuste semanal**
- `updateAjusteAction` en `src/lib/actions/unidad/ajustes.ts`
- Nueva página `/unidad/flujo-semanal/[id]/editar` con componente `EditAjusteForm`
- Botón lápiz (Pencil) en cada ajuste de la lista del flujo semanal

**Toasts (Sonner)**
- `sonner` instalado como dependencia
- `<Toaster position="top-center" richColors />` en root layout
- Componente `AutoToast` en `src/components/auto-toast.tsx`: lee `?ok=` y `?error=` de la URL, dispara toast y limpia la URL. Envuelto en `<Suspense>` en el layout
- Todos los redirects con `?ok=...` y `?error=...` existentes funcionan automáticamente con toasts sin cambiar los server actions

**Paginación en reportes**
- `/unidad/reportes` ahora pagina a 20 items por página via `?pagina=N`
- Los totalizadores (total prestado, total abonado) siguen calculándose para el día entero
- Botones Anterior/Siguiente al final de la lista

**Loading states adicionales**
- `src/app/unidad/flujo-semanal/loading.tsx` — skeleton con header de navegación
- `src/app/unidad/reportes/loading.tsx` — skeleton con filtro, stats y tarjetas

### Pendiente (requiere acción manual)
- Ejecutar `supabase/migrations/010_reverse_payment.sql` en el proyecto Supabase
- Generar tipos TypeScript: `npx supabase gen types typescript --project-id <ID> > src/types/database.ts`
- Crear íconos PWA: `public/icons/icon-192.png` e `icon-512.png`

---

## [0.3.0] — 2026-07-24

### Agregado

**Editar datos del cliente**
- Nueva página `/unidad/prestamos/[id]/editar-cliente`
- Server action `updateClientAction` en `src/lib/actions/unidad/clients.ts`
- Componente `EditClientForm` con campos prellenados (alias, NIT, teléfonos, dirección, barrio)
- Botón "Editar" en la tarjeta de Contacto del detalle del préstamo

**Editar y eliminar gastos pendientes**
- `deleteExpenseAction` y `updateExpenseAction` agregados a `src/lib/actions/unidad/gastos.ts`
- Botones "Editar" y "Eliminar" visibles solo en gastos con estado `pendiente`
- Nueva página `/unidad/gastos/[id]/editar` con componente `EditExpenseForm`
- La eliminación falla silenciosamente si el gasto ya fue aprobado (protección server-side)

**Reporte diario** (`/unidad/reporte-diario`)
- Cobrado hoy, prestado hoy, visitados, pendientes de cobro
- Gastos aprobados y pendientes del día
- Caja estimada calculada en tiempo real: `capital_inicial + total_cobrado - total_prestado - gastos_aprobados`
- Nota: no incluye movimientos de capital del admin

**Mejora pantalla de préstamos** (`/unidad/prestamos`)
- Tarjetas compactas con borde izquierdo de color: verde = cobrado, naranja = sin pago, sin color = pendiente
- Cuota mostrada prominentemente en grande (`text-2xl`)
- Saldo como dato secundario
- Botones de llamar/WhatsApp solo con ícono (sin texto) para ahorrar espacio
- Badge de estado inline ("Cobrado" / "Sin pago")
- "Sin pago hoy" como botón secundario, "Registrar pago" como acción dominante
- Totalizador rediseñado más compacto con `Stat` component reutilizable

**Historial de préstamos por cliente** (en `/unidad/prestamos/[id]`)
- Card "Préstamos anteriores" al final del detalle, mostrando préstamos completados/cancelados
- Datos: modalidad, fecha inicio, cuotas pagadas/total, monto, estado con badge de color

**Calidad del cliente** (en `/unidad/prestamos/[id]`)
- Badge inline junto a la posición: Bueno / Regular / Riesgoso
- Cálculo: `cuotas_pagadas / (cuotas_pagadas + visitas_sin_pago)` sobre TODOS los préstamos del cliente
- Bueno: ≥ 80% · Regular: 50-79% · Riesgoso: < 50%
- No se muestra si no hay historial suficiente

**PWA básica**
- `public/manifest.json` con nombre, colores, orientación y rutas
- Meta tags en `src/app/layout.tsx`: `theme-color`, `apple-mobile-web-app-capable`, `manifest`
- **Pendiente**: crear iconos reales en `public/icons/icon-192.png` e `icon-512.png`

**Loading y error states**
- `src/app/unidad/prestamos/loading.tsx` — skeleton de tarjetas
- `src/app/unidad/gastos/loading.tsx` — skeleton de resumen + cards
- `src/app/unidad/reporte-diario/loading.tsx` — skeleton de stats
- `src/app/unidad/error.tsx` — error boundary auto-contenido (sin imports de UI para evitar ChunkLoadError de Next.js)

**Flujo semanal** (`/unidad/flujo-semanal`)
- Navegación por semanas con flechas ◀ ▶ (no permite avanzar a semanas futuras)
- Semana calculada siempre desde el lunes; param `?semana=YYYY-MM-DD` en la URL
- Totalizadores: cobrado efectivo + transferencia, prestado, gastos aprobados, ajustes neto, recaudado
- Fórmula: `Recaudado = Cobrado - Prestado - Gastos ± Ajustes`
- Desglose por día (solo muestra días con actividad)
- Lista de ajustes de la semana con botón eliminar
- Formulario "Nuevo ajuste" inline con selector visual ingreso/egreso
- Server actions: `createAjusteAction`, `deleteAjusteAction` en `src/lib/actions/unidad/ajustes.ts`
- Componente cliente: `NuevoAjusteForm` con `useActionState`
- **REGLA**: Ajustes son invisibles para el resto del sistema (caja, reportes, admin)

**Reportes** (`/unidad/reportes`)
- Filtro por fecha (input date, default hoy, no permite futuro)
- Totalizadores: total prestado + total abonado del día
- Tabs Préstamos / Abonos con contador
- Préstamos: alias cliente, modalidad, interés, hora de creación, capital → total
- Abonos: alias cliente, cuota N/Total, método de pago, monto, hora de registro

**Navegación**
- Nav del layout de unidad actualizado: Préstamos · Nuevo · Disponibles · Enrutar · Gastos · Reportes · Semanal · Caja

### Modificado
- `src/app/unidad/prestamos/[id]/page.tsx` — agrega `client_id` al select, historial, calidad, botón Editar
- `src/app/unidad/gastos/page.tsx` — agrega botones editar/eliminar en pendientes
- `src/lib/actions/unidad/gastos.ts` — refactor con `getActiveUnit()` helper, nuevas acciones
- `src/app/layout.tsx` — PWA meta tags via `<head>` directo (no via `Viewport` export para evitar bug de webpack en Next.js 15)
- `src/app/unidad/layout.tsx` — 3 nuevos links en nav

### Bugs resueltos
- `error.tsx` no puede importar componentes UI externos en Next.js 15 (ChunkLoadError). Solución: auto-contenido con HTML/SVG puro.
- `Viewport` como export nombrado en layout causa ChunkLoadError en webpack. Solución: meta tags directos en `<head>`.

---

## [0.2.0] — 2026-07-24

### Agregado
- Proyecto Next.js inicial creado con TypeScript, Tailwind CSS, App Router y scripts de build/lint.
- Dependencias base instaladas: Supabase SSR/JS, TanStack Query, Zustand, dnd kit, React Hook Form, Zod, Lucide y componentes estilo shadcn/ui.
- Rutas iniciales creadas: `/login`, `/admin/dashboard`, `/admin/unidades/nueva`, `/unidad/prestamos`, `/unidad/nuevo` y `/unidad/disponibles`.
- Cliente Supabase browser/server y middleware base por rol (`admin` / `unidad`) creados.
- Migraciones locales de Supabase creadas en `supabase/migrations/` usando el schema del cerebro.
- Proyecto Supabase `DinoPay Project` conectado con variables reales en `.env.local`.
- Migraciones ejecutadas en Supabase y primer usuario admin creado/verificado.
- Formulario `/admin/unidades/nueva` conectado a Server Action para crear usuarios de unidad en Supabase Auth e insertar su configuracion inicial en `units`.
- Login actualizado para aceptar username de unidad o email de admin.
- Boton de logout agregado en layouts de admin y unidad.
- Pantalla `/unidad/nuevo` implementada con formulario de cliente + prestamo, preview de cuota/total y validacion de intereses.
- Pantalla `/unidad/prestamos` conectada a prestamos activos reales, ordenados por `posicion`.
- Migracion local `005_create_client_with_loan.sql` agregada para crear cliente + prestamo en una funcion transaccional.
- Registro de pago base implementado en `/unidad/prestamos` con RPC `register_payment`.
- Migracion local `006_register_payment.sql` agregada para registrar pagos, actualizar saldo/cuotas y completar prestamos automaticamente.
- Formulario de pago ajustado para recalcular monto al cambiar cuotas, aceptar decimales y refrescar la lista tras registrar.
- Totalizador diario de `/unidad/prestamos` conectado a pagos reales del dia: recaudado, meta, faltante, progreso y visitados.
- Filtros `Todos / Pendientes / Visitados` y buscador por cliente/barrio/telefono agregados en `/unidad/prestamos`.
- Boton `No pago` agregado con tabla `loan_visits` y RPC `mark_no_pay_visit` para marcar visitados sin afectar caja.
- Pantalla `/unidad/disponibles` conectada a clientes activos sin prestamo activo, con resumen y ultimo prestamo completado.
- Flujo `/unidad/disponibles/[id]/nuevo` agregado para crear nuevo prestamo a cliente existente con datos prellenados del ultimo prestamo.
- Migracion local `008_create_loan_for_existing_client.sql` agregada para crear prestamos recurrentes y restaurar posicion de ruta.
- Pantalla `/unidad/enrutar` agregada con drag & drop mobile-first usando dnd kit.
- Migracion local `009_update_route_positions.sql` agregada para guardar posiciones de ruta.
- Pantalla `/unidad/gastos` agregada con resumen, formulario de nuevo gasto y listado de gastos recientes.
- Registro de gastos conectado a Supabase usando la tabla `expenses`; los gastos nacen en estado `pendiente`.
- Pantalla `/admin/gastos` agregada para aprobar o rechazar gastos pendientes por unidad.
- Dashboard admin conectado a metricas reales de unidades activas y gastos.
- Página `/unidad/prestamos/[id]` agregada con detalle del préstamo, contacto, dirección, historial de pagos y visitas sin pago.
- Tarjetas de `/unidad/prestamos` actualizadas con acciones rápidas: Ver, Llamar y WhatsApp.
- Pantalla `/unidad/prestamos` rediseñada con experiencia móvil tipo app: totalizador destacado, búsqueda grande, tabs, tarjetas compactas y pago en modal.
- Menú `...` de préstamo agregado con WhatsApp, llamada, detalles, historial de pagos, historial de préstamos y editar cliente; los accesos informativos abren modales.

### Verificado
- `npm run build` pasa correctamente.
- `npm run lint` pasa correctamente.
- Login admin exitoso en la app local.
- Creacion de cliente + prestamo probada tras ejecutar la migracion `005_create_client_with_loan.sql`.

---

## [0.1.0] — 2026-07-24

### Agregado
- Segundo Cerebro (documentación completa en Obsidian) creado desde cero
- Arquitectura definida: Next.js 15 + Supabase + Tailwind + shadcn/ui + TanStack Query
- Schema de base de datos diseñado (8 tablas con RLS)
- Documentación de todas las pantallas del sistema
- Reglas de negocio documentadas
- Decisión de stack tecnológico registrada con alternativas evaluadas
- Glosario de términos
- Guía para IAs
- Roadmap por fases definido

---

*El changelog se actualiza al finalizar cada sesión de trabajo significativa.*
