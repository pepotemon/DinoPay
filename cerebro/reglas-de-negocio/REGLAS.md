---
tags: [reglas, negocio, logica, prestamos, pagos, caja]
created: 2026-07-24
updated: 2026-07-24
---

# Reglas de Negocio — DinoPay

[[INDEX|← Volver al Index]]

> Estas reglas NUNCA deben quedar solo en el código. Son la fuente de verdad del comportamiento del sistema.

---

## Clientes

### R-CLI-01: Un préstamo activo por cliente
Un cliente solo puede tener **UN préstamo activo** a la vez. Si tiene préstamo activo, no puede aparecer en "Clientes Disponibles" ni recibir un nuevo préstamo.

**Implementación**: Unique index en `loans(client_id)` where `estado = 'activo'`.

### R-CLI-02: Clientes no se eliminan
Los clientes nunca se eliminan físicamente de la base de datos. Se desactivan (`activo = false`) si es necesario, pero el historial se preserva siempre.

### R-CLI-03: Pertenencia a la unidad
Un cliente pertenece a la unidad que lo creó. Ninguna otra unidad puede ver o modificar sus datos.

---

## Préstamos

### R-PRE-01: Intereses habilitados
El porcentaje de interés de un préstamo DEBE ser uno de los porcentajes configurados por el administrador en la unidad. No se pueden ingresar intereses arbitrarios.

### R-PRE-02: Cálculo del total
```
total_a_cobrar = valor_neto * (1 + interes / 100)
valor_cuota = total_a_cobrar / numero_cuotas
```

### R-PRE-03: Fecha de inicio
La fecha de inicio de un préstamo siempre es el día en que se crea.

### R-PRE-04: Fecha de fin estimada
Se calcula según la modalidad:
- **Diaria**: `fecha_inicio + numero_cuotas` días laborales de la unidad
- **Semanal**: `fecha_inicio + numero_cuotas` semanas
- **Quincenal**: `fecha_inicio + numero_cuotas * 15` días
- **Mensual**: `fecha_inicio + numero_cuotas` meses

### R-PRE-05: Posición en ruta al crear
Un préstamo nuevo se coloca al **final** de la lista de ruta (posición más alta + 1).

### R-PRE-06: Posición al restaurar cliente disponible
Cuando un cliente disponible recibe nuevo préstamo, se intenta restaurar su posición anterior. Si está ocupada, se inserta en esa posición desplazando los demás hacia abajo.

### R-PRE-07: Completar préstamo
Un préstamo se marca `completado` cuando `cuotas_pagadas >= numero_cuotas` O cuando el `saldo <= 0`. Al completarse, el cliente pasa automáticamente a "Disponibles".

### R-PRE-08: Cancelar préstamo
Solo el administrador puede cancelar un préstamo. Al cancelarse, se genera un `box_adjustment` de tipo `entrada` por el saldo pendiente que regresa a la caja.

---

## Pagos

### R-PAG-01: Días permitidos
Los pagos solo se pueden registrar en **días laborales** configurados en la unidad.

### R-PAG-02: Monto mínimo
El monto mínimo de un pago es `$0.01`. No se pueden registrar pagos de $0.

### R-PAG-03: Cuotas múltiples
Al registrar múltiples cuotas en un pago, el monto = `numero_cuotas_pago × valor_cuota`. El monto puede ser editado manualmente (para pagos parciales o con "propina").

### R-PAG-04: Actualización de saldo
Al registrar un pago:
```
saldo = saldo - monto_pagado
cuotas_pagadas = cuotas_pagadas + numero_cuotas_pago
ultima_cuota_fecha = fecha_pago
```
Si `saldo <= 0` o `cuotas_pagadas >= numero_cuotas` → el préstamo se completa (R-PRE-07).

### R-PAG-05: Eliminar pago
Un pago solo se puede eliminar si se cumplen ambas condiciones:
1. La unidad tiene `puede_eliminar_abonos = true` configurado por el administrador.
2. El pago fue registrado el mismo dia (`fecha_pago = current_date`).

Al eliminar un pago:
1. El pago se marca como `eliminado = true` en la tabla `payments`.
2. Se revierte el saldo del prestamo hasta maximo `total_a_cobrar`.
3. Se revierten solo las cuotas completas realmente cubiertas por el monto del pago.
4. El prestamo vuelve a estado `activo` si estaba `completado`.

### R-PRE-08: Eliminar prestamo
Un prestamo solo se puede eliminar si se cumplen todas estas condiciones:
1. La unidad tiene `puede_eliminar_prestamos = true` configurado por el administrador.
2. El prestamo fue creado el mismo dia (`created_at::date = current_date`).
3. El prestamo no tiene ningun abono registrado en `payments`, incluso si hubiera pagos anulados.

El borrado del prestamo es fisico y primero limpia visitas asociadas (`loan_visits`).


### R-PAG-06: Métodos de pago
Los métodos son **efectivo** y **transferencia**. Ambos afectan la caja de la misma manera (solo diferencia en reportes de efectivo vs. transferencia).

---

## Gastos

### R-GAS-01: Aprobación requerida
Ningún gasto afecta la caja hasta que el administrador lo aprueba.

### R-GAS-02: No editable tras aprobación
Un gasto aprobado o rechazado no puede ser editado ni eliminado por la unidad.

### R-GAS-03: Impacto en caja
Solo gastos con estado `aprobado` se incluyen en los cálculos de caja.

---

## Cálculo de Caja

### R-CAJ-01: Caja inicial del día
```
caja_inicial(fecha) = capital_inicial
                    + suma(capital_movements donde fecha < D y tipo='ingreso')
                    - suma(capital_movements donde fecha < D y tipo='retiro')
                    + suma(payments donde fecha_pago < D y eliminado=false)
                    - suma(loans.valor_neto donde created_at < D)
                    - suma(expenses donde fecha < D y estado='aprobado')
                    + suma(box_adjustments donde fecha < D y tipo='entrada')
                    - suma(box_adjustments donde fecha < D y tipo='salida')
```

Donde `D` = fecha del día a calcular.

### R-CAJ-02: Caja final del día
```
caja_final(fecha) = caja_inicial(fecha)
                  + cobrado(fecha)
                  - prestado(fecha)
                  + ingresos_capital(fecha)
                  - retiros_capital(fecha)
                  - gastos_aprobados(fecha)
                  + cuadres_entrada(fecha)
                  - cuadres_salida(fecha)
```

### R-CAJ-03: La caja nunca se almacena directamente
La caja se **calcula siempre** a partir de los movimientos. Esto evita desincronizaciones. El único valor almacenado es `capital_inicial` en la tabla `units`.

---

## Flujo Semanal

### R-FSE-01: Aislamiento de ajustes
Los ajustes creados en la pantalla de Flujo Semanal (`weekly_adjustments`) son invisibles para el resto del sistema. No afectan la caja real, no aparecen en el reporte diario, no son visibles para el admin.

### R-FSE-02: Cálculo del recaudado semanal
```
recaudado_semanal = cobrado_semana 
                  - prestado_semana 
                  - gastos_aprobados_semana
                  + ajustes_ingreso_semana
                  - ajustes_egreso_semana
```

---

## Posicionamiento en Ruta

### R-RUT-01: Orden reflejado en cobros
La pantalla de Préstamos muestra los clientes en el mismo orden que la pantalla de Enrutar.

### R-RUT-02: Posición al crear nuevo préstamo
Posición = `MAX(posicion de todos los loans activos de la unidad) + 1`.

### R-RUT-03: Posición al restaurar
Al activar nuevo préstamo para cliente disponible:
1. Buscar la posición del último préstamo completado de ese cliente
2. Si esa posición está libre → asignarla
3. Si está ocupada → insertar en esa posición, los demás se desplazan +1

---

## Permisos del Administrador

| Acción | Admin | Unidad |
|--------|-------|--------|
| Crear/editar unidades | ✅ | ❌ |
| Ver datos de otras unidades | ✅ | ❌ |
| Aprobar/rechazar gastos | ✅ | ❌ |
| Inyectar/retirar capital | ✅ | ❌ |
| Cancelar préstamos | ✅ | ❌ |
| Eliminar pagos (cualquier fecha) | ✅ | ❌ |
| Crear gastos en una unidad | ✅ | ❌ |
| Registrar pagos | ❌ | ✅ |
| Crear clientes | ❌ | ✅ |
| Editar su perfil de unidad | ❌ | ✅ (limitado) |

---

## Ver También
- [[base-de-datos/SCHEMA]] — Implementación en DB
- [[modulos/ADMINISTRADOR]] — Panel del admin
- [[modulos/UNIDAD]] — Panel de la unidad
