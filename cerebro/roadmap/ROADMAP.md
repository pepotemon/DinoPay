---
tags: [roadmap, planificacion, estado, prioridades]
created: 2026-07-24
updated: 2026-07-24
---

# Roadmap — DinoPay

[[INDEX|← Volver al Index]]

---

## Estado General: 🔄 Setup Inicial / Fundamentos en progreso

---

## Fase 1: Fundamentos (MVP)
**Objetivo**: Tener una unidad funcional que pueda registrar préstamos y cobros.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Configurar proyecto Next.js | ✅ Completado | 🔴 Alta |
| Configurar Supabase (proyecto + schema inicial) | ✅ Completado | 🔴 Alta |
| Sistema de autenticación (login admin/unidad) | 🔄 Login admin verificado | 🔴 Alta |
| Middleware de rutas por rol | 🔄 Base creada | 🔴 Alta |
| Panel Admin: crear unidad | ✅ Implementado | 🔴 Alta |
| Unidad: pantalla NUEVO (cliente + préstamo) | 🔄 Formulario implementado, requiere migración 005 | 🔴 Alta |
| Unidad: pantalla PRÉSTAMOS (lista + cobros) | 🔄 Lista, cobros, No pagó, totalizador y filtros conectados | 🔴 Alta |
| Unidad: modal registro de pago | 🔄 Formulario base implementado | 🔴 Alta |
| Completar préstamo automáticamente | ✅ Implementado en RPC | 🔴 Alta |
| Cálculo de caja en tiempo real | ⏳ Pendiente | 🔴 Alta |

---

## Fase 2: Operaciones Completas
**Objetivo**: La unidad puede gestionar toda su cartera.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Pantalla CLIENTES DISPONIBLES | 🔄 Listado y nuevo préstamo conectados | 🔴 Alta |
| Nuevo préstamo para cliente existente | ✅ Implementado | 🔴 Alta |
| Pantalla ENRUTAR (drag & drop) | 🔄 Implementada, requiere migración 009 | 🔴 Alta |
| Modal "Ver Detalles" del préstamo | ⏳ Pendiente | 🟡 Media |
| Historial de pagos por préstamo | ⏳ Pendiente | 🟡 Media |
| Historial de préstamos por cliente | ⏳ Pendiente | 🟡 Media |
| Editar datos del cliente | ⏳ Pendiente | 🟡 Media |
| Botón WhatsApp desde tarjeta | ⏳ Pendiente | 🟡 Media |
| Botón llamar desde tarjeta | ⏳ Pendiente | 🟡 Media |
| Integración Google Maps (ubicar cliente) | ⏳ Pendiente | 🟡 Media |
| Abrir Maps desde tarjeta de préstamo | ⏳ Pendiente | 🟡 Media |

---

## Fase 3: Gastos y Reportes
**Objetivo**: Trazabilidad financiera completa.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Pantalla GASTOS (unidad) | ⏳ Pendiente | 🔴 Alta |
| Aprobación de gastos (admin) | ⏳ Pendiente | 🔴 Alta |
| Pantalla REPORTES (préstamos y pagos) | ⏳ Pendiente | 🟡 Media |
| Pantalla REPORTE DIARIO | ⏳ Pendiente | 🟡 Media |
| Cuadres de caja automáticos | ⏳ Pendiente | 🔴 Alta |
| Eliminar pago (con cuadre) | ⏳ Pendiente | 🔴 Alta |
| Pantalla FLUJO SEMANAL | ⏳ Pendiente | 🟡 Media |
| Ajustes del flujo semanal | ⏳ Pendiente | 🟡 Media |

---

## Fase 4: Panel Admin Completo
**Objetivo**: El admin tiene control total.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Dashboard global del admin | ⏳ Pendiente | 🔴 Alta |
| Ver detalles de cualquier unidad | ⏳ Pendiente | 🔴 Alta |
| Inyectar/retirar capital | ⏳ Pendiente | 🔴 Alta |
| Editar configuración de unidad | ⏳ Pendiente | 🟡 Media |
| Ver reportes de cualquier unidad | ⏳ Pendiente | 🟡 Media |
| Cancelar préstamos (admin) | ⏳ Pendiente | 🟡 Media |

---

## Fase 5: Pulido y Producción
**Objetivo**: La app está lista para uso real.

| Tarea | Estado | Prioridad |
|-------|--------|-----------|
| Responsive design móvil completo | ⏳ Pendiente | 🔴 Alta |
| Manejo de errores global | ⏳ Pendiente | 🔴 Alta |
| Loading states en todas las pantallas | ⏳ Pendiente | 🔴 Alta |
| Copiar estado del préstamo (imagen/texto) | ⏳ Pendiente | 🟡 Media |
| PWA (instalable en móvil) | ⏳ Pendiente | 🟢 Baja |
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

---

## Leyenda de Estados
| Ícono | Significado |
|-------|-------------|
| ✅ | Completado |
| 🔄 | En progreso |
| ⏳ | Pendiente |
| 🚫 | Bloqueado |
| ❌ | Cancelado |
