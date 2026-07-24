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
- [x] Base de pantalla de préstamos (lista principal de trabajo)
- [x] Base de totalizador del día
- [ ] Tarjeta de préstamo con botones de acción
- [x] Formulario base de registro de pago
- [x] Lógica de completar préstamo automáticamente
- [x] Pantalla nueva (crear cliente + préstamo)
- [x] Formulario de nuevo cliente
- [x] Formulario de nuevo préstamo con preview

### Módulo Admin — Core
- [ ] Dashboard global
- [x] Formulario crear nueva unidad
- [x] Crear usuario de unidad en Supabase Auth desde admin

---

## Media Prioridad 🟡

### Módulo Unidad — Completo
- [x] Filtros (Todos / Pendientes / Visitados)
- [x] Buscador de clientes en pantalla préstamos
- [x] Botón No pagó en pantalla préstamos
- [ ] Modal "Ver Detalles" del préstamo
- [ ] Editar datos del cliente
- [ ] Historial de pagos (préstamo actual)
- [ ] Historial de préstamos (cliente)
- [x] Base de pantalla Clientes Disponibles
- [ ] Formulario nuevo préstamo para cliente existente
- [ ] Indicador de calidad del cliente
- [ ] Pantalla Enrutar (drag & drop con dnd kit)
- [ ] Guardar orden de ruta
- [ ] Pantalla Gastos
- [ ] Crear/editar/eliminar gasto
- [ ] Pantalla Reportes (préstamos y pagos)
- [ ] Pantalla Reporte Diario
- [ ] Cuadres de caja automáticos al eliminar pago
- [ ] Pantalla Flujo Semanal
- [ ] Ajustes del flujo semanal

### Módulo Admin — Completo
- [ ] Ver detalle de una unidad
- [ ] Editar configuración de unidad
- [ ] Aprobar/rechazar gastos
- [ ] Inyectar/retirar capital
- [ ] Ver reportes de cualquier unidad

### Integraciones
- [ ] Google Maps en formulario de cliente
- [ ] Abrir Maps desde tarjeta de préstamo
- [ ] Botón WhatsApp desde tarjeta
- [ ] Botón llamar desde tarjeta

---

## Baja Prioridad 🟢

### UX / Polish
- [ ] Animaciones de transición entre pantallas
- [ ] Skeletons de carga para todas las listas
- [ ] Empty states con ilustraciones
- [ ] Toasts/notificaciones de éxito y error

### Performance
- [ ] Paginación en lista de préstamos (si hay 100+)
- [ ] Virtualización de listas largas
- [ ] Prefetch de datos frecuentes

### PWA
- [ ] Configurar manifest.json
- [ ] Service Worker para offline básico
- [ ] Ícono de la app (dinosaurio verde)

---

## Refactor
- [ ] Separar componentes grandes cuando superen 200 líneas
- [ ] Centralizar formateo de moneda en una sola función

---

## Testing
- [ ] Tests unitarios para cálculos de préstamo (cuota, total, saldo)
- [ ] Tests unitarios para cálculo de caja
- [ ] Tests E2E para flujo: crear cliente → crear préstamo → registrar pago → completar

---

## Seguridad
- [ ] Audit de todas las RLS policies
- [ ] Verificar que service role key nunca llegue al cliente
- [ ] Rate limiting en Server Actions críticos (registro de pagos)

---

## Escalabilidad
- [ ] Índices DB para queries frecuentes (ya diseñados en [[base-de-datos/SCHEMA]])
- [ ] Análisis de queries con EXPLAIN ANALYZE tras primeros 1000 registros

---

## Ver También
- [[roadmap/ROADMAP]] — Vista por fases
- [[ideas/IDEAS]] — Ideas para el futuro
