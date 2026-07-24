---
tags: [backlog, pendiente, tareas, prioridades]
created: 2026-07-24
updated: 2026-07-24
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
- [x] Ver detalle completo de una unidad
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
- [ ] Editar configuración de unidad (intereses, capital, etc.)
- [ ] Ver reportes de cualquier unidad
- [ ] Cancelar préstamos activos

### Loading / Error States
- [x] `loading.tsx` en préstamos, gastos y reporte diario
- [x] `error.tsx` en layout de unidad (auto-contenido sin imports UI)
- [ ] `loading.tsx` en disponibles, enrutar, flujo semanal, reportes
- [x] `loading.tsx` en flujo semanal y reportes

---

## Baja Prioridad 🟢

### UX / Polish
- [ ] Animaciones de transición entre pantallas
- [ ] Empty states con ilustraciones
- [x] Toasts con Sonner (AutoToast, funciona con ?ok= y ?error= existentes)
- [ ] Editar ajuste semanal (actualmente solo crear/eliminar)
- [ ] Copiar resumen del día como texto para WhatsApp
- [x] Paginación en reportes (20 por página, Anterior/Siguiente)

### PWA
- [x] Configurar manifest.json
- [x] Meta tags PWA en layout (theme-color, apple-mobile-web-app-capable)
- [ ] Íconos reales: `public/icons/icon-192.png` e `icon-512.png`
- [ ] Service Worker para funcionamiento offline básico

### Performance
- [ ] Paginación en lista de préstamos (si hay 100+)
- [ ] Paginación en reportes para fechas con muchos registros

---

## Refactor
- [ ] Separar componentes grandes cuando superen 200 líneas
- [ ] Extraer tipos de Supabase a un archivo centralizado (`src/types/database.ts`)

---

## Testing
- [ ] Tests unitarios para cálculos de préstamo (cuota, total, saldo)
- [ ] Tests unitarios para cálculo de caja y recaudado semanal
- [ ] Tests E2E para flujo: crear cliente → crear préstamo → registrar pago → completar

---

## Seguridad
- [ ] Audit de todas las RLS policies
- [ ] Verificar que service role key nunca llegue al cliente
- [ ] Rate limiting en Server Actions críticos (registro de pagos)
- [ ] Rotar la secret key de Supabase (fue compartida en sesión de setup)

---

## Bugs Conocidos / Notas Técnicas
- `error.tsx` no puede importar componentes de `@/components/ui` en Next.js 15 (ChunkLoadError del bundler). Siempre hacerlo auto-contenido.
- `Viewport` export nombrado en `layout.tsx` causa ChunkLoadError en Next.js 15.5.x con Webpack. Usar `<meta>` directo en `<head>` en su lugar.
- `reverse_payment` RPC en `010_reverse_payment.sql` debe ejecutarse en Supabase antes de usar la función de anular pago.
- Tipos TypeScript pendientes de generar: `npx supabase gen types typescript --project-id <ID> > src/types/database.ts`

---

## Ver También
- [[roadmap/ROADMAP]] — Vista por fases
- [[changelog/CHANGELOG]] — Historial de versiones
- [[ideas/IDEAS]] — Ideas para el futuro
