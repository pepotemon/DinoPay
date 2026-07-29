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

### BUG-001: Toast duplicado en Enrutar y Gastos

**Fecha**: 2026-07-29
**Severidad**: Medio
**Estado**: Resuelto

**Sintoma**:
El mensaje de exito ("Ruta guardada", "Gasto registrado") aparecia dos veces despues de guardar.

**Causa Raiz**:
Dos causas independientes:
1. `enrutar/page.tsx` renderizaba en servidor un banner `{params?.ok}` Y `AutoToast` mostraba un toast para el mismo parametro de la URL.
2. `AutoToast` usaba `useSearchParams()` como valor del efecto pero limpiaba la URL con `replaceState` al final. En React Strict Mode (dev) los efectos montan → desmontan → remontan, y el segundo mount disparaba el toast nuevamente antes de que el hook reflejara la URL limpia.

**Solucion**:
- Eliminado el banner servidor de `enrutar/page.tsx`.
- `AutoToast` refactorizado para leer desde `window.location.href` (siempre el estado real de la URL) y limpiar la URL *antes* de mostrar el toast, haciendolo idempotente ante dobles ejecuciones.

**Como Evitarlo**:
No mezclar notificaciones servidor (banners renderizados con `searchParams`) y cliente (`AutoToast`) para el mismo mensaje. Elegir uno solo; `AutoToast` es el patron preferido.

**Archivos Afectados**:
- `src/components/auto-toast.tsx`
- `src/app/unidad/enrutar/page.tsx`

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
