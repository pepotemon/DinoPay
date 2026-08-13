---
tags: [backlog, pendiente, tareas, prioridades]
created: 2026-07-24
updated: 2026-08-13 (v0.30.0)
---

# Backlog — DinoPay

[[INDEX|← Volver al Index]]

---

## Alta Prioridad 🔴

### Setup y Configuración
- [x] Inicializar proyecto Next.js con TypeScript y Tailwind
- [x] Configurar base de componentes estilo shadcn/ui
- [x] Crear proyecto en Supabase y ejecutar migrations
- [x] Configurar variables de entorno
- [x] Configurar `@supabase/ssr` con Next.js App Router
- [x] Crear base de middleware de autenticación con separación admin/unidad
- [ ] Generar tipos TypeScript desde el schema de Supabase

### Autenticación
- [x] Base de página de login unificada (detecta si es admin o unidad)
- [x] Crear primer usuario admin y verificar login
- [x] Logout
- [x] Base de protección de rutas con middleware

### Módulo Unidad — Core
- [x] Pantalla PRÉSTAMOS rediseñada (tarjetas compactas, colores de estado, UX móvil)
- [x] Totalizador del día conectado a datos reales
- [x] Formulario de registro de pago con recálculo automático
- [x] Lógica de completar préstamo automáticamente (RPC)
- [x] Pantalla NUEVO (crear cliente + préstamo con preview)
- [x] Pantalla CLIENTES DISPONIBLES
- [x] Nuevo préstamo para cliente existente
- [x] Pantalla ENRUTAR (drag & drop, guarda posiciones)
- [x] Pantalla GASTOS (crear, editar, eliminar pendientes)
- [x] Pantalla REPORTE DIARIO (caja estimada en tiempo real)
- [x] Pantalla FLUJO SEMANAL (cuaderno personal, ajustes, nav por semanas)
- [x] Pantalla REPORTES (préstamos y abonos, filtro por fecha, tabs)
- [x] Eliminar pago con recálculo de saldo y cuotas

### Módulo Admin — Core
- [x] Dashboard global con métricas reales
- [x] Formulario crear nueva unidad
- [x] Crear usuario de unidad en Supabase Auth desde admin
- [x] Aprobar/rechazar gastos de cualquier unidad
- [x] Ver detalle completo de una unidad (hub con 3 tabs: clientes, transacciones, configuración)
- [x] Inyectar/retirar capital de una unidad

---

## Media Prioridad 🟡

### Módulo Unidad — Detalle y Calidad
- [x] Página de detalle del préstamo
- [x] Botón "Editar datos del cliente" desde detalle
- [x] Formulario editar cliente (alias, NIT, teléfonos, dirección, barrio)
- [x] Historial de pagos en detalle del préstamo
- [x] Historial de préstamos anteriores del cliente en detalle
- [x] Badge de calidad del cliente (Bueno/Regular/Riesgoso)
- [x] Visitas sin pago en detalle del préstamo
- [x] Llamar / WhatsApp desde tarjeta y detalle
- [x] Abrir Google Maps desde detalle del préstamo
- [ ] Integración Google Maps al crear cliente (ubicar en mapa)

### Módulo Admin — Completo
- [x] Editar configuración de unidad (intereses, capital, etc.) — inline, sin páginas extra, acordeón por sección
- [x] Editar información del cliente desde admin — modal inline en lista de clientes
- [x] Ver reportes de cualquier unidad
- [x] Cancelar préstamos activos
- [x] Patrón SlideOver en todos los modales admin — desktop right panel + mobile bottom sheet con portal, animación, scroll lock y back handler
- [x] Acciones de cliente en SlideOver (reemplaza dropdown 3 puntos) — historial pagos/préstamos, eliminar préstamo, desactivar, editar
- [x] Tarjetas de unidad rediseñadas — avatar con iniciales, hover con micro-lift, stats en chips
- [x] Hover route selector mejorado con tinte primario
- [x] Progreso circular SVG en tarjetas de cliente (reemplaza barra horizontal)

### Loading / Error States
- [x] `loading.tsx` en préstamos, gastos y reporte diario
- [x] `error.tsx` en layout de unidad (auto-contenido sin imports UI)
- [ ] `loading.tsx` en disponibles, enrutar, flujo semanal, reportes
- [x] `loading.tsx` en flujo semanal y reportes
- [x] `loading.tsx` en admin: clientes, transacciones, configuracion, gastos

---

## Baja Prioridad 🟢

### UX / Polish
- [x] Navegación móvil: bottom nav con 4 accesos + menú overlay
- [ ] Animaciones de transición entre pantallas
- [ ] Empty states con ilustraciones
- [x] Toasts con Sonner (AutoToast, funciona con ?ok= y ?error= existentes)
- [x] Editar ajuste semanal (ahora con edit/delete individuales en DayCard)
- [x] Copiar resumen del día como texto para WhatsApp (en Reporte Diario)
- [x] Paginación en reportes (20 por página, Anterior/Siguiente)

### PWA
- [x] Configurar manifest.json
- [x] Meta tags PWA en layout (theme-color, apple-mobile-web-app-capable)
- [ ] Íconos reales: `public/icons/icon-192.png` e `icon-512.png`
- [x] Service Worker básico (`public/sw.js`) — cachea `_next/static`, manifest e íconos

### Performance
- [x] Paralizar queries en transacciones admin (2 round trips → 1)
- [ ] Paginación en lista de préstamos (si hay 100+)
- [ ] Paginación en reportes para fechas con muchos registros

---

## Refactor
- [ ] Separar componentes grandes cuando superen 200 líneas
- [ ] Extraer tipos de Supabase a un archivo centralizado (`src/types/database.ts`)

---

## Testing
- [x] Tests unitarios para cálculos de préstamo (cuota, total, saldo) — 23 tests con vitest
- [ ] Tests unitarios para cálculo de caja y recaudado semanal
- [ ] Tests E2E para flujo: crear cliente → crear préstamo → registrar pago → completar

---

## Seguridad
- [x] Audit de todas las RLS policies — todas OK, todas las funciones SECURITY DEFINER con search_path fijo
- [x] Verificar que service role key nunca llegue al cliente — solo en Server Actions con `createAdminClient`
- [ ] Rate limiting en Server Actions críticos (registro de pagos)
- [ ] **CRÍTICO**: Rotar la `SUPABASE_SERVICE_ROLE_KEY` (fue expuesta en sesión de setup)

---

## Bugs Conocidos / Notas Técnicas
- `error.tsx` no puede importar componentes de `@/components/ui` en Next.js 15 (ChunkLoadError del bundler). Siempre hacerlo auto-contenido.
- `Viewport` export nombrado en `layout.tsx` causa ChunkLoadError en Next.js 15.5.x con Webpack. Usar `<meta>` directo en `<head>` en su lugar.
- `reverse_payment` RPC en `010_reverse_payment.sql` debe ejecutarse en Supabase antes de usar la función de anular pago.
- Tipos TypeScript pendientes de generar: `npx supabase gen types typescript --project-id <ID> > src/types/database.ts`

## Migraciones Pendientes de Ejecutar en Supabase
- [x] **`012_fix_ultima_cuota_fecha.sql`** — corrige `ultima_cuota_fecha` para que almacene la PRÓXIMA cuota; backfill de préstamos activos sin fecha ✅ ejecutada
- [x] **`013_partial_payments.sql`** — soporte para pagos parciales en `register_payment`: `cuotas_pagadas` y `ultima_cuota_fecha` solo avanzan por cuotas completas ✅ ejecutada

---

## Ver También
- [[roadmap/ROADMAP]] — Vista por fases
- [[changelog/CHANGELOG]] — Historial de versiones
- [[ideas/IDEAS]] — Ideas para el futuro
