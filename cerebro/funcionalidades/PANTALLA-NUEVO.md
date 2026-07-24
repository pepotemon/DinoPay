---
tags: [funcionalidad, pantalla, nuevo-cliente, prestamo, unidad]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: NUEVO — Crear Cliente + Préstamo

[[INDEX|← Volver al Index]]

---

## Objetivo
Permitir a la unidad registrar un nuevo cliente junto con su primer préstamo en un solo formulario. Al guardar, el préstamo queda activo inmediatamente.

Estado de implementación: 🔄 formulario inicial conectado. Requiere ejecutar la migración `005_create_client_with_loan.sql` en Supabase.

## Problema que Resuelve
En campo, el cobrador necesita registrar nuevos clientes rápidamente sin navegar entre múltiples pantallas. Todo en un solo flujo.

---

## Flujo

```
Unidad entra a /unidad/nuevo
  ↓
  Llena datos de identificación del cliente
  ↓
  Llena datos de domicilio y contacto
  ↓
  Selecciona ubicación en Google Maps
  ↓
  Configura el préstamo (modalidad, interés, monto, cuotas)
  ↓
  Ve la tarjeta de preview del préstamo
  ↓
  Presiona "Guardar"
  ↓
  Sistema crea cliente + préstamo en DB
  ↓
  Redirige a /unidad/prestamos con el nuevo préstamo visible
```

---

## Campos del Formulario

### Sección: Identificación
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| Nombre/Alias | text | ✅ | Identificador principal del cliente |
| NIT / Documento | text | ❌ | Documento de identidad |

### Sección: Domicilio
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| Dirección 1 | text | ❌ | Dirección principal |
| Dirección 2 | text | ❌ | Complemento de dirección |
| Barrio | text | ❌ | Barrio/sector |

### Sección: Contacto
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| Teléfono 1 | tel | ❌ | Principal (usado para WhatsApp y llamadas) |
| Teléfono 2 | tel | ❌ | Alternativo |
| Género | select | ❌ | masculino / femenino / otro |

### Sección: Ubicación
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| Mapa Google Maps | mapa interactivo | ❌ | El usuario arrastra un pin para ubicar al cliente. Se guarda lat/lng |

### Sección: Préstamo
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| Modalidad | select | ✅ | diaria / semanal / quincenal / mensual |
| Interés | select | ✅ | Solo los % habilitados por el admin para esta unidad |
| Valor Neto | number | ✅ | Capital a prestar |
| Número de Cuotas | number | ✅ | Cantidad de cuotas |

### Tarjeta de Preview (calculada automáticamente)
Muestra en tiempo real mientras el usuario llena el formulario:
- **Valor de la cuota**: `(valor_neto * (1 + interes/100)) / numero_cuotas`
- **Modalidad**: texto amigable (ej: "Diario")
- **Valor del préstamo**: valor neto
- **Total a cobrar**: valor neto + intereses

---

## Cálculos del Préstamo

```typescript
// Fórmulas de cálculo
const totalACobrar = valorNeto * (1 + interes / 100)
const valorCuota = totalACobrar / numeroCuotas
const fechaFin = calcularFechaFin(fechaInicio, modalidad, numeroCuotas)

// fechaFin según modalidad:
// diaria: fechaInicio + numeroCuotas días laborales
// semanal: fechaInicio + numeroCuotas semanas
// quincenal: fechaInicio + numeroCuotas * 15 días
// mensual: fechaInicio + numeroCuotas meses
```

---

## Reglas de Negocio
- Un cliente NO puede tener dos préstamos activos al mismo tiempo
- El interés debe ser uno de los habilitados por el admin en la unidad
- El valor neto mínimo debe ser mayor a 0
- El número de cuotas mínimo es 1
- Al guardar, el préstamo se activa inmediatamente (estado = 'activo')
- La posición en la ruta se asigna al final de la lista actual
- Se calcula `fecha_inicio = hoy` y `fecha_fin` según modalidad + cuotas

## Casos Especiales
- Si el cliente ya existe en el sistema (mismo NIT), el sistema debería alertar. Aún por definir si se bloquea o se permite el duplicado. Ver [[preguntas/PREGUNTAS-ABIERTAS#Cliente duplicado por NIT]].

---

## Archivos Involucrados
- `src/app/unidad/nuevo/page.tsx` — Página principal
- `src/components/unidad/NuevoClienteForm.tsx` — Formulario completo
- `src/components/unidad/PreviewTarjetaPrestamo.tsx` — Tarjeta de preview
- `src/components/shared/MapaPicker.tsx` — Selector de ubicación
- `src/lib/actions/clientes.ts` — Server Action: crear cliente
- `src/lib/actions/prestamos.ts` — Server Action: crear préstamo
- `src/lib/validations/nuevo-cliente.ts` — Schema Zod

---

## Ideas Futuras
- Guardar borradores automáticamente para no perder datos si se cierra accidentalmente
- Foto del cliente (Supabase Storage)
- Importar clientes desde CSV
- Búsqueda de cliente existente para hacer un nuevo préstamo sin re-registrarlo (esto ya se maneja desde [[PANTALLA-CLIENTES-DISPONIBLES]])

---

## Ver También
- [[PANTALLA-PRESTAMOS]] — A donde va el préstamo después de crearse
- [[PANTALLA-CLIENTES-DISPONIBLES]] — Nuevo préstamo para cliente existente
- [[reglas-de-negocio/REGLAS#Préstamos]] — Reglas detalladas
- [[base-de-datos/SCHEMA#loans]] — Estructura de la tabla loans
