---
tags: [bugs, errores, problemas, resueltos]
created: 2026-07-24
updated: 2026-07-24
---

# Bugs — DinoPay

[[INDEX|← Volver al Index]]

> Registro de bugs encontrados y resueltos para evitar que se repitan.

---

## Bugs Abiertos

*(Ninguno por el momento — proyecto en inicio)*

---

## Bugs Resueltos

*(Sin historial aún)*

---

## Template para Registrar un Bug

```markdown
## BUG-XXX: [Título corto y descriptivo]

**Fecha**: YYYY-MM-DD
**Severidad**: Crítico / Alto / Medio / Bajo
**Estado**: Abierto / Resuelto

**Síntoma**:
Qué veía o experimentaba el usuario.

**Causa Raíz**:
Por qué ocurría el problema técnicamente.

**Solución**:
Cómo se resolvió.

**Cómo Evitarlo**:
Práctica o patrón que previene que vuelva a ocurrir.

**Archivos Afectados**:
- `src/archivo1.ts`
- `src/archivo2.tsx`

**Relacionado con**:
- [[funcionalidades/PANTALLA-PRESTAMOS]] si aplica
```

---

## Bugs Conocidos a Vigilar (Potenciales)

### P-BUG-001: Desincronización de caja al fallo de transacción
**Descripción**: Si al eliminar un pago se crea el `box_adjustment` pero falla la actualización del `loan`, la caja queda inconsistente.
**Mitigación**: Usar transacciones SQL o funciones RPC de Supabase para que todas las operaciones sean atómicas.
**Estado**: Prevenido por diseño (aún no implementado)

### P-BUG-002: Préstamo en limbo si falla al completar
**Descripción**: Si el préstamo se completa (saldo=0) pero falla la lógica que lo marca como `completado`, el cliente quedaría sin poder recibir un nuevo préstamo.
**Mitigación**: Usar trigger de DB o RPC atómica para completar el préstamo.
**Estado**: Prevenido por diseño (aún no implementado)

### P-BUG-003: Posición duplicada en ruta
**Descripción**: Si dos préstamos se crean simultáneamente, podrían obtener la misma posición.
**Mitigación**: Usar `SELECT MAX(posicion) FOR UPDATE` en transacción o sequence de DB.
**Estado**: Prevenido por diseño (aún no implementado)

---

## Ver También
- [[AI/REGLAS-CRITICAS]] — Partes más frágiles del sistema
- [[reglas-de-negocio/REGLAS]] — Reglas que previenen bugs de negocio
