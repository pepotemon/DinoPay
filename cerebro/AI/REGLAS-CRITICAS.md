---
tags: [AI, reglas, critico, nunca-romper]
created: 2026-07-24
updated: 2026-07-24
---

# Reglas Críticas — Lo Que Nunca Romper

[[INDEX|← Volver al Index]]

> Estas son las reglas que, si se rompen, causan inconsistencias graves de datos o problemas de seguridad.

---

## 🔴 CRÍTICO — Seguridad

### C-SEC-01: RLS siempre activado
**Nunca desactivar Row Level Security en las tablas de Supabase.**
Si RLS está desactivado, cualquier unidad puede ver los datos de otra.

### C-SEC-02: Service Role Key solo en servidor
`SUPABASE_SERVICE_ROLE_KEY` NUNCA debe usarse en componentes del cliente ni en variables con prefijo `NEXT_PUBLIC_`. Exponer esta key da acceso total a la base de datos sin RLS.

### C-SEC-03: Validación de intereses en servidor
La validación de que el interés sea uno de los permitidos por la unidad DEBE hacerse en el servidor (Server Action o RPC). No confiar solo en la validación del frontend — puede ser bypasseada.

---

## 🔴 CRÍTICO — Integridad de Datos

### C-DAT-01: Nunca actualizar la caja directamente
La columna `capital_actual` en `units` SOLO debe actualizarse a través de triggers o funciones SQL definidas. Nunca desde el frontend directamente.

Si se necesita recalcular la caja, usar la función `calculate_caja(unit_id, fecha)`.

### C-DAT-02: Eliminar pago = cuadre de caja
Cuando se elimina un pago, siempre debe:
1. Marcarse `eliminado = true` en `payments` (nunca borrar el registro)
2. Revertir `cuotas_pagadas` y `saldo` en `loans`
3. Crear registro en `box_adjustments`

Si alguno de estos 3 pasos falla, deben fallar todos (transacción).

### C-DAT-03: Un préstamo activo por cliente
El unique index en `loans(client_id) WHERE estado='activo'` no debe eliminarse. Garantiza la regla fundamental del negocio.

### C-DAT-04: Ajustes semanales aislados
Los `weekly_adjustments` NUNCA deben incluirse en:
- Cálculos de la caja real
- Reporte diario
- Panel del admin
- Cualquier query fuera de la pantalla de Flujo Semanal

---

## 🟡 IMPORTANTE — Experiencia de Usuario

### C-UX-01: Optimistic updates en pagos
El registro de pagos DEBE usar optimistic updates. El cobrador está en campo y no puede esperar 2-3 segundos por cada pago. Si se quita el optimistic update, la UX se degrada severamente.

### C-UX-02: Lista de préstamos ordenada por posición
La pantalla de Préstamos SIEMPRE debe mostrar los préstamos ordenados por `posicion` ASC. Si se cambia el ORDER BY, toda la funcionalidad de "Enrutar" pierde sentido.

### C-UX-03: Fecha semana actual por defecto
Los reportes con filtro de fecha deben mostrar la semana actual por defecto, no un campo vacío. El usuario no debería tener que seleccionar fechas para ver datos comunes.

---

## 🟡 IMPORTANTE — Lógica de Negocio

### C-NEG-01: Completar préstamo automáticamente
Cuando `saldo <= 0` o `cuotas_pagadas >= numero_cuotas`, el préstamo debe cambiar a `completado` y el cliente debe moverse a Disponibles. Este proceso debe ser atómico (todo o nada).

### C-NEG-02: Posición al restaurar cliente
Al activar un préstamo para un cliente disponible, la lógica de restauración de posición debe ejecutarse. Ver [[reglas-de-negocio/REGLAS#R-RUT-03]].

### C-NEG-03: Días laborales respetados
Los días no laborales configurados en la unidad no deben permitir registro de pagos. La validación debe estar en el Server Action.

---

## Partes Más Frágiles del Sistema

| Parte | Riesgo | Por qué es frágil |
|-------|--------|-------------------|
| Cálculo de caja | Alto | Suma de múltiples tablas, cualquier movimiento sin cuadre rompe el balance |
| Completar préstamo | Alto | Si falla la transición a "disponible", el cliente queda en limbo |
| Eliminación de pagos | Alto | Debe ser transaccional (3 operaciones atómicas) |
| RLS policies | Alto | Si se daña una policy, hay fuga de datos entre unidades |
| Posicionamiento en ruta | Medio | La lógica de inserción al restaurar puede desordenar posiciones |
| Optimistic updates | Medio | Si el rollback falla, la UI queda en estado inconsistente |

---

## Ver También
- [[reglas-de-negocio/REGLAS]] — Todas las reglas de negocio
- [[seguridad/SEGURIDAD]] — Detalles de seguridad
- [[arquitectura/BASE-DE-DATOS]] — Schema con índices y constraints
