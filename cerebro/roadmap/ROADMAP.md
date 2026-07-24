---
tags: [roadmap, planificacion, estado, prioridades]
created: 2026-07-24
updated: 2026-07-24
---

# Roadmap — DinoPay

[[INDEX|← Volver al Index]]

---

## Estado General: 🔄 Módulo Unidad casi completo — Fase 3 en progreso

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
| Unidad: pantalla PRÉSTAMOS (lista + cobros) | ✅ Implementado y mejorado | 🔴 Alta |
| Unidad: registro de pago | ✅ Implementado | 🔴 Alta |
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
| Editar configuración de unidad | ⏳ Pendiente | 🟡 Media |
| Ver reportes de cualquier unidad | ⏳ Pendiente | 🟡 Media |
| Cancelar préstamos (admin) | ⏳ Pendiente | 🟡 Media |

---

## Fase 5: Pulido y Producción
**Objetivo**: La app está lista para uso real.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Responsive design móvil (tarjetas compactas) | ✅ Implementado | 🔴 Alta |
| Navegación móvil (bottom nav + menú overlay) | ✅ Implementado | 🔴 Alta |
| Manejo de errores global (error.tsx) | ✅ Implementado | 🔴 Alta |
| Loading states en pantallas principales | ✅ Implementado (prestamos, gastos, reporte) | 🔴 Alta |
| Toasts con Sonner (AutoToast) | ✅ Implementado | 🟡 Media |
| Paginación en reportes | ✅ Implementado | 🟡 Media |
| PWA básica (manifest + meta tags) | ✅ Implementado | 🟢 Baja |
| Íconos PWA reales (192px y 512px) | ⏳ Pendiente — requiere diseño | 🟢 Baja |
| Notificaciones push (gastos pendientes) | ⏳ Pendiente | 🟢 Baja |
| Deploy en Vercel | ⏳ Pendiente | 🔴 Alta |
| Variables de entorno en producción | ⏳ Pendiente | 🔴 Alta |
| Testing E2E básico | ⏳ Pendiente | 🟡 Media |

---

## Ideas para el Futuro (sin fecha)
- Exportar reportes a PDF/Excel
- Notificaciones cuando un cliente lleva X días sin pagar
- App móvil nativa (React Native)
- Dashboard de analytics avanzado para el admin
- Sistema de referidos entre unidades
- Integración con sistemas de pago electrónico
- Editar ajuste semanal (actualmente solo crear/eliminar)
- Copiar resumen del día como texto para compartir por WhatsApp

---

## Leyenda de Estados
| Ícono | Significado |
|-------|-------------|
| ✅ | Completado |
| 🔄 | En progreso |
| ⏳ | Pendiente |
| 🚫 | Bloqueado |
| ❌ | Cancelado |
