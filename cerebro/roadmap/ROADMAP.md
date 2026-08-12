---
tags: [roadmap, planificacion, estado, prioridades]
created: 2026-07-24
updated: 2026-07-24
---

# Roadmap — DinoPay

[[INDEX|← Volver al Index]]

---

## Estado General: 🔄 Módulo Unidad casi completo — Fase 3 completada, Fase 4 en progreso

---

## Fase 1: Fundamentos (MVP)
**Objetivo**: Tener una unidad funcional que pueda registrar préstamos y cobros.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Configurar proyecto Next.js | ✅ Completado | 🔴 Alta |
| Configurar Supabase (proyecto + schema inicial) | ✅ Completado | 🔴 Alta |
| Sistema de autenticación (login admin/unidad) | ✅ Completado | 🔴 Alta |
| Middleware de rutas por rol | ✅ Completado | 🔴 Alta |
| Panel Admin: crear unidad | ✅ Implementado | 🔴 Alta |
| Unidad: pantalla NUEVO (cliente + préstamo) | ✅ Implementado | 🔴 Alta |
| Unidad: pantalla PRÉSTAMOS (lista + cobros) | ✅ Implementado y mejorado (diseño propio, bottom sheet, badges) | 🔴 Alta |
| Unidad: registro de pago | ✅ Implementado (incluye pagos parciales) | 🔴 Alta |
| Completar préstamo automáticamente | ✅ Implementado en RPC | 🔴 Alta |
| Cálculo de caja en tiempo real | ✅ Implementado en Reporte Diario | 🔴 Alta |

---

## Fase 2: Operaciones Completas
**Objetivo**: La unidad puede gestionar toda su cartera.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Pantalla CLIENTES DISPONIBLES | ✅ Implementado | 🔴 Alta |
| Nuevo préstamo para cliente existente | ✅ Implementado | 🔴 Alta |
| Pantalla ENRUTAR (drag & drop) | ✅ Implementado | 🔴 Alta |
| Página de detalle del préstamo | ✅ Implementado | 🟡 Media |
| Historial de pagos por préstamo | ✅ Implementado | 🟡 Media |
| Historial de préstamos por cliente | ✅ Implementado | 🟡 Media |
| Editar datos del cliente | ✅ Implementado | 🟡 Media |
| Indicador de calidad del cliente | ✅ Implementado (Bueno/Regular/Riesgoso) | 🟡 Media |
| Botón WhatsApp desde tarjeta | ✅ Implementado | 🟡 Media |
| Botón llamar desde tarjeta | ✅ Implementado | 🟡 Media |
| Abrir Maps desde detalle de préstamo | ✅ Implementado | 🟡 Media |
| Cuotas adelantadas (badge verde en lista) | ✅ Implementado | 🟡 Media |
| Pagos parciales (display fraccionado 8.3/20) | ✅ Implementado | 🟡 Media |
| Sistema de días de atraso (badge naranja) | ✅ Implementado + auto-sync festivos Nager.Date | 🟡 Media |
| Selector de país/estado/ciudad en nueva unidad | ✅ Implementado (country-state-city offline) | 🟡 Media |
| Integración Google Maps (ubicar cliente al crear) | ⏳ Pendiente | 🟢 Baja |

---

## Fase 3: Gastos y Reportes
**Objetivo**: Trazabilidad financiera completa.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Pantalla GASTOS (unidad) | ✅ Implementado | 🔴 Alta |
| Editar/eliminar gastos pendientes | ✅ Implementado | 🔴 Alta |
| Aprobación de gastos (admin) | ✅ Implementado | 🔴 Alta |
| Pantalla REPORTES (préstamos y abonos por fecha) | ✅ Implementado | 🟡 Media |
| Pantalla REPORTE DIARIO (caja estimada) | ✅ Implementado | 🟡 Media |
| Pantalla FLUJO SEMANAL | ✅ Implementado | 🟡 Media |
| Ajustes del flujo semanal (crear/eliminar) | ✅ Implementado | 🟡 Media |
| Eliminar pago (con cuadre de saldo) | ✅ Implementado (migración 010 + deletePaymentAction) | 🔴 Alta |
| Cuadres de caja automáticos al eliminar pago | ✅ Implementado en reverse_payment RPC | 🔴 Alta |

---

## Fase 4: Panel Admin Completo
**Objetivo**: El admin tiene control total.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Dashboard global del admin | ✅ Implementado | 🔴 Alta |
| Ver detalles de cualquier unidad | ✅ Implementado (/admin/unidades/[id]) | 🔴 Alta |
| Inyectar/retirar capital | ✅ Implementado | 🔴 Alta |
| Editar configuración de unidad | ✅ Implementado (/admin/unidades/[id]/editar) | 🟡 Media |
| Ver reportes de cualquier unidad | ✅ Implementado (/admin/unidades/[id]/reportes) | 🟡 Media |
| Cancelar préstamos (admin) | ✅ Implementado (/admin/unidades/[id]/prestamos + cancelLoanAction) | 🟡 Media |

---

## Fase 5: Pulido y Producción
**Objetivo**: La app está lista para uso real.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Responsive design móvil (tarjetas compactas) | ✅ Implementado | 🔴 Alta |
| Navegación móvil (bottom nav + menú overlay) | ✅ Implementado | 🔴 Alta |
| Manejo de errores global (error.tsx) | ✅ Implementado | 🔴 Alta |
| Loading states en pantallas principales | ✅ Implementado (prestamos, gastos, reporte, nuevo, disponibles, menú) | 🔴 Alta |
| Caché de servidor (`unstable_cache`) para metadatos de unidad y festivos | ✅ Implementado (TTL 5 min / 60 min) | 🟡 Media |
| Tarjeta de crédito interactiva en formulario Nuevo | ✅ Implementado (preview en vivo con nombre, cédula, dirección, cuota, total) | 🟡 Media |
| Toasts con Sonner (AutoToast) | ✅ Implementado | 🟡 Media |
| Paginación en reportes | ✅ Implementado | 🟡 Media |
| PWA básica (manifest + meta tags) | ✅ Implementado | 🟢 Baja |
| Íconos PWA reales (192px y 512px) | ⏳ Pendiente — requiere diseño | 🟢 Baja |
| Notificaciones push (gastos pendientes) | ⏳ Pendiente | 🟢 Baja |
| Deploy en Vercel | ⏳ Pendiente — requiere acción manual | 🔴 Alta |
| Variables de entorno en producción | ⏳ Pendiente — requiere Vercel dashboard | 🔴 Alta |
| Service Worker básico (offline) | ✅ Implementado (public/sw.js + SwRegister) | 🟢 Baja |
| Testing unitario (vitest) | ✅ Implementado — 23 tests para overdue y date-timezone | 🟡 Media |
| Testing E2E básico | ⏳ Pendiente | 🟡 Media |

---

## Ideas para el Futuro (sin fecha)
- Exportar reportes a PDF/Excel
- Notificaciones cuando un cliente lleva X días sin pagar
- App móvil nativa (React Native)
- Dashboard de analytics avanzado para el admin
- Sistema de referidos entre unidades
- Integración con sistemas de pago electrónico
- ~~Editar ajuste semanal~~ ✅ Completado
- ~~Copiar resumen del día como texto para compartir por WhatsApp~~ ✅ Completado en Reporte Diario

---

## Leyenda de Estados
| Ícono | Significado |
|-------|-------------|
| ✅ | Completado |
| 🔄 | En progreso |
| ⏳ | Pendiente |
| 🚫 | Bloqueado |
| ❌ | Cancelado |
