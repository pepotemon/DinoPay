---
tags: [ideas, futuro, experimentos, pendiente]
created: 2026-07-24
updated: 2026-07-24
---

# Ideas — DinoPay

[[INDEX|← Volver al Index]]

---

## Ideas Aceptadas (serán implementadas)

### IDEA-001: PWA Instalable
**Estado**: Aceptada
**Descripción**: Hacer la app instalable en móvil como PWA (Progressive Web App).
**Por qué es valiosa**: Los cobradores trabajan en campo con su celular. Una PWA se comporta como app nativa, funciona offline parcialmente y es más rápida de acceder.
**Complejidad**: Baja (Next.js tiene soporte nativo con `next-pwa`)

---

## Ideas Pendientes (en evaluación)

### IDEA-002: Notificaciones de Gastos Pendientes
**Estado**: Pendiente
**Descripción**: Notificar al admin cuando hay gastos nuevos pendientes de aprobar.
**Por qué es valiosa**: Sin notificaciones, el admin puede olvidar aprobar gastos y la unidad queda con números incorrectos.
**Complejidad**: Media (requiere Supabase Realtime o push notifications)

### IDEA-003: Exportar Reportes a PDF
**Estado**: Pendiente
**Descripción**: Desde el reporte diario o semanal, exportar un PDF del resumen.
**Por qué es valiosa**: Para enviar al admin o guardar registros físicos.
**Complejidad**: Media (usar `react-pdf` o `jsPDF`)

### IDEA-004: Foto del Cliente
**Estado**: Pendiente
**Descripción**: Permitir tomar/subir foto del cliente para identificarlo más fácilmente.
**Por qué es valiosa**: En campo, identificar visualmente al cliente ayuda a evitar errores.
**Complejidad**: Media (Supabase Storage + cámara del dispositivo)

### IDEA-005: Alertas de Atraso
**Estado**: Pendiente
**Descripción**: Mostrar badge/alerta en tarjetas de clientes que llevan X días sin pagar.
**Por qué es valiosa**: El cobrador sabe de inmediato quiénes están atrasados sin revisar el historial.
**Complejidad**: Baja (calculado en el query según fecha último pago)

### IDEA-006: Mensaje Pre-cargado en WhatsApp
**Estado**: Pendiente
**Descripción**: Al abrir WhatsApp, pre-cargar un mensaje con el resumen del estado del préstamo.
**Por qué es valiosa**: Ahorra tiempo al cobrador para recordarle al cliente cuánto debe.
**Complejidad**: Muy baja (solo agregar texto al URL de wa.me)

### IDEA-007: Modo Offline Parcial
**Estado**: Pendiente
**Descripción**: Guardar temporalmente los pagos registrados si no hay internet y sincronizar cuando se restablezca la conexión.
**Por qué es valiosa**: Los cobradores pueden estar en zonas con mala señal.
**Complejidad**: Alta (requiere Service Worker + cola de sincronización)

---

## Ideas Rechazadas

### IDEA-R001: App Móvil Nativa (React Native)
**Estado**: Rechazada
**Razón**: Una PWA bien hecha cubre las necesidades actuales. React Native duplica la base de código y requiere más recursos de desarrollo. Reconsiderar si el usuario lo solicita explícitamente.

### IDEA-R002: Sistema Multi-admin
**Estado**: Rechazada (por ahora)
**Razón**: La arquitectura actual soporta un solo admin. Agregar multi-admin requeriría rediseñar el modelo de datos. Posible en versiones futuras si el negocio lo requiere.

---

## Ideas Locas (sin evaluar, guardadas para no perderlas)

### IDEA-L001: IA para predicción de mora
Usar ML para predecir qué clientes tienen más probabilidad de no pagar, basado en historial.

### IDEA-L002: Mapa de calor de cobros
Visualización geográfica de todos los clientes en un mapa, coloreados según estado (pagó/no pagó/pendiente).

### IDEA-L003: Chat interno admin-unidad
Un chat básico dentro de la app para que el admin pueda comunicarse con las unidades sin salir de la app.

---

## Experimentos

*(Espacio para registrar experimentos técnicos o de producto)*

---

## Ver También
- [[roadmap/ROADMAP]] — Qué está planificado
- [[backlog/BACKLOG]] — Trabajo pendiente priorizado
