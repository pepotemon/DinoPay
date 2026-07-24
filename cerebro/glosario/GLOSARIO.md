---
tags: [glosario, terminos, conceptos, siglas]
created: 2026-07-24
updated: 2026-07-24
---

# Glosario — DinoPay

[[INDEX|← Volver al Index]]

---

## Términos del Negocio

### Administrador (Admin)
Usuario de mayor jerarquía. Crea y gestiona las unidades, aprueba gastos, inyecta capital y monitorea todas las operaciones.

### Unidad
Usuario operativo creado por el administrador. Equivale a un "agente de cobro" o "ruta". Gestiona su propia cartera de clientes y préstamos. Cada unidad tiene su propio capital y configuración.

### Cliente
Persona que recibe un préstamo de la unidad. Tiene datos de identificación, domicilio y contacto.

### Préstamo (Loan)
El crédito otorgado a un cliente. Tiene modalidad, interés, capital, cuotas y saldo. Solo puede haber un préstamo activo por cliente.

### Cuota (Parcela / Bono)
El pago periódico que debe hacer el cliente. Su frecuencia depende de la modalidad del préstamo.

### Saldo
El dinero que el cliente aún debe al momento actual. `saldo = total_a_cobrar - total_pagado`.

### Modalidad
La frecuencia de pago del préstamo:
- **Diaria**: pago cada día laboral
- **Semanal**: pago cada semana
- **Quincenal**: pago cada 15 días
- **Mensual**: pago cada mes

### Interés
El porcentaje que se cobra sobre el capital prestado. `total = capital * (1 + interes/100)`.

### Capital Inicial
El monto de dinero con que el administrador habilita una unidad para empezar operaciones.

### Capital Actual (Caja)
El dinero disponible actualmente en la unidad, calculado en base a todos los movimientos realizados.

### Caja Inicial (del día)
El dinero con que la unidad empieza un día específico, antes de cualquier movimiento de ese día.

### Caja Final (del día)
El dinero con que la unidad cierra un día específico, después de todos los movimientos.

### Meta del Día
La suma de las cuotas de todos los préstamos activos que tienen pago programado para el día de hoy.

### Recaudado
El total cobrado en un período (día, semana).

### Cobrado
Sinónimo de Recaudado. La suma de todos los pagos registrados.

### Visitado
Un cliente que tuvo algún tipo de interacción en el día: ya sea que pagó o fue marcado como "No pagó".

### No Pagó
Marca que el cobrador pone cuando visitó al cliente pero este no realizó su pago del día.

### Disponible (Cliente)
Cliente cuyo préstamo fue completamente pagado y está listo para recibir un nuevo préstamo.

### Enrutar
El proceso de ordenar los clientes según el recorrido geográfico óptimo del cobrador.

### Posición (en Ruta)
El número de orden de un préstamo en la ruta del cobrador. Los préstamos en la pantalla de Cobros se muestran en este orden.

### Cuadre de Caja
Registro automático de cualquier movimiento que afecte la caja por razones distintas a cobros, préstamos o gastos normales. Ej: eliminación de un pago, cancelación de un préstamo.

### Gasto
Egreso operativo de la unidad que debe ser aprobado por el administrador antes de afectar la caja.

### Ingreso de Capital
Dinero que el administrador inyecta a la unidad para aumentar su capital disponible.

### Retiro de Capital
Dinero que el administrador retira de la unidad.

### Flujo Semanal
Reporte personal/operativo de la unidad que muestra el resumen de la semana. Permite ajustes de referencia que NO afectan la caja real.

### Ajuste (Flujo Semanal)
Ingreso o egreso de referencia personal que el cobrador registra en el flujo semanal. No afecta ningún otro reporte ni la caja.

### Recaudado Semanal
`Cobrado - Prestado - Gastos ± Ajustes` de la semana. Solo aparece en el flujo semanal.

---

## Términos Técnicos

### RLS (Row Level Security)
Mecanismo de PostgreSQL/Supabase que restringe qué filas puede ver o modificar cada usuario autenticado. En DinoPay, garantiza que cada unidad solo acceda a sus propios datos.

### Server Action
Función asíncrona de Next.js que se ejecuta en el servidor. Se usa para mutaciones de datos (crear préstamos, registrar pagos, etc.).

### Server Component
Componente de React que se renderiza en el servidor. Se usa para fetching inicial de datos.

### Client Component
Componente de React que se ejecuta en el browser. Necesario para interactividad (modales, forms, drag & drop).

### Optimistic Update
Actualización inmediata de la UI antes de que el servidor confirme el cambio. Si el servidor falla, hace rollback. Usado en registro de pagos para dar sensación de velocidad.

### dnd kit
Biblioteca de drag & drop para React, usada en la pantalla de Enrutar Clientes.

### TanStack Query
Biblioteca de manejo de estado de servidor / cache. Maneja fetching, caching, sincronización y actualizaciones optimistas.

### Supabase
Backend-as-a-Service que provee PostgreSQL, Auth, Realtime y Storage.

---

## Abreviaturas Internas

| Abreviatura | Significado |
|-------------|-------------|
| PRE | Préstamo |
| PAG | Pago |
| CLI | Cliente |
| UNI | Unidad |
| ADM | Administrador |
| GAS | Gasto |
| CAJ | Caja |
| RUT | Ruta |
| FSE | Flujo Semanal |
| R-XXX-00 | Regla de negocio (ej: R-PRE-01) |

---

## Ver También
- [[reglas-de-negocio/REGLAS]] — Reglas que usan estos términos
- [[arquitectura/ARQUITECTURA]] — Términos técnicos en contexto
