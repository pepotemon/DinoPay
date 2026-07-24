---
tags: [funcionalidad, pantalla, enrutar, drag-drop, ordenamiento]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: ENRUTAR CLIENTES

[[INDEX|← Volver al Index]]

---

## Objetivo
Permitir al cobrador ordenar su ruta de cobro del día arrastrando y soltando las tarjetas de clientes. El orden aquí se refleja directamente en la pantalla de Préstamos.

Estado de implementación: 🔄 pantalla mobile-first con drag & drop implementada. Requiere ejecutar migración `009_update_route_positions.sql`.

## Problema que Resuelve
Cada día el cobrador tiene una ruta óptima según su recorrido geográfico. Sin esta pantalla, los clientes aparecerían en orden de creación (inútil para un cobrador en campo).

---

## Estructura de la Pantalla

```
┌──────────────────────────────────┐
│ ENRUTAR CLIENTES                 │
│                          [Guardar] │
├──────────────────────────────────┤
│ ═══ 1. Juan García               │
│     Cra 5 #12-34 | Barrio Norte  │
│ ═══ 2. María López               │
│     Calle 7 #45-12               │
│ ═══ 3. Pedro Martínez            │
│     Av. Principal #67            │
│  ...                             │
└──────────────────────────────────┘
```

- El ícono `═══` (hamburguesa) es el handle para arrastrar
- El número muestra la posición actual
- Al arrastrar una tarjeta, los demás se desplazan

---

## Comportamiento

### Arrastrar y Soltar
- Implementado con **dnd kit** (biblioteca de drag & drop para React)
- Funciona en dispositivos táctiles (móvil) y con mouse (desktop)
- La lista se reordena visualmente mientras se arrastra (sin esperar guardar)
- El número de posición se actualiza en tiempo real mientras se mueve

### Guardar
- Existe un botón "Guardar" prominente
- Al guardar: se actualiza la columna `posicion` en la tabla `loans` para todos los préstamos activos de la unidad
- La pantalla de [[PANTALLA-PRESTAMOS]] se actualiza con el nuevo orden
- Se muestra confirmación de "Ruta guardada ✓"

### Auto-guardado
> **Decisión pendiente**: ¿Guardar automáticamente después de cada movimiento o solo al presionar el botón? Ver [[preguntas/PREGUNTAS-ABIERTAS#Auto-guardado en Enrutar]].

---

## Reglas de Posicionamiento

### Cuando se crea un nuevo préstamo
- El nuevo préstamo se coloca al **final** de la lista (posición más alta)
- El cobrador puede reorganizarlo desde esta pantalla

### Cuando un préstamo se completa (cliente pasa a Disponibles)
- El registro en `loans` guarda su última `posicion`
- Los demás préstamos **NO** se re-numeran (no hay brecha lógica, solo visual)

### Cuando el cliente disponible vuelve a tener préstamo activo
- El sistema intenta colocar el nuevo préstamo en la **misma posición** que tenía el anterior
- Si esa posición ya está ocupada: el nuevo préstamo se inserta en esa posición y el que estaba ahí baja una posición (y todos los siguientes también bajan 1)
- Si la posición ya no existe (era la última y ahora hay menos préstamos): se coloca al final

### Lógica de Inserción al Restaurar Posición
```
Préstamo A estaba en posición 3
Préstamo A vuelve a activarse
La posición 3 ahora tiene a Préstamo C

→ Nuevo estado:
  1: Préstamo X
  2: Préstamo Y
  3: Préstamo A  ← restaurado
  4: Préstamo C  ← bajó de 3 a 4
  5: ...
```

---

## Información en Cada Tarjeta de la Ruta

| Dato | Fuente |
|------|--------|
| Número de posición | Calculado de la lista |
| Alias del cliente | `clients.alias` |
| Dirección | `clients.direccion1` |
| Barrio | `clients.barrio` |

---

## Archivos Involucrados
- `src/app/unidad/enrutar/page.tsx`
- `src/components/unidad/ListaEnrutar.tsx` — Lista sortable con dnd kit
- `src/components/unidad/TarjetaRuta.tsx` — Tarjeta individual de la ruta
- `src/lib/actions/rutas.ts` — Server Action: guardar nuevo orden
- `src/lib/queries/rutas.ts`

---

## Dependencias Técnicas
- `@dnd-kit/core` — Motor de drag & drop
- `@dnd-kit/sortable` — Lista sortable
- `@dnd-kit/utilities` — Utilidades (CSS transform)

---

## Performance
- Si la unidad tiene 100+ clientes, la lista puede ser lenta de renderizar
- Considerar virtualización con `@tanstack/react-virtual` para listas largas
- El guardado actualiza TODOS los `posicion` en una sola transacción SQL para evitar estados inconsistentes

---

## Ver También
- [[PANTALLA-PRESTAMOS]] — Donde se refleja el orden
- [[PANTALLA-CLIENTES-DISPONIBLES]] — Reglas de restauración de posición
- [[reglas-de-negocio/REGLAS#Posicionamiento en Ruta]]
