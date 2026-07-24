---
tags: [convenciones, naming, estilo, patrones, codigo]
created: 2026-07-24
updated: 2026-07-24
---

# Convenciones — DinoPay

[[INDEX|← Volver al Index]]

---

## Naming de Archivos

| Tipo | Convención | Ejemplo |
|------|-----------|---------|
| Componentes React | PascalCase | `TarjetaPrestamo.tsx` |
| Páginas (App Router) | `page.tsx` (fijo por Next.js) | `page.tsx` |
| Layouts | `layout.tsx` (fijo) | `layout.tsx` |
| Hooks | camelCase con prefijo `use` | `usePrestamoActivo.ts` |
| Server Actions | camelCase | `registerPayment.ts` |
| Queries (TanStack) | camelCase | `useLoansQuery.ts` |
| Validaciones Zod | camelCase + Schema suffix | `newLoanSchema.ts` |
| Stores Zustand | camelCase + Store suffix | `uiStore.ts` |
| Utilidades | camelCase | `formatCurrency.ts` |
| Types/Interfaces | PascalCase + Type/Interface suffix | `LoanType.ts`, `PaymentInterface.ts` |

---

## Naming de Código

### Variables y funciones
```typescript
// Nombres de negocio en español
const prestamosActivos = []
const cuotaDelDia = 25000
const calcularSaldo = (loan: Loan) => loan.totalACobrar - loan.montoPagado

// Código técnico en inglés
const isLoading = false
const handleSubmit = async () => {}
const queryClient = new QueryClient()
```

### Componentes
```typescript
// PascalCase siempre
export function TarjetaPrestamo({ loan }: TarjetaPrestamoProps) {}
export function ModalRegistroPago({ isOpen, onClose }: ModalProps) {}

// Props interfaces con sufijo Props
interface TarjetaPrestamoProps {
  loan: Loan
  onPago: () => void
}
```

### Server Actions
```typescript
// Verbos de acción claros
export async function createLoan(data: NewLoanInput) {}
export async function registerPayment(data: PaymentInput) {}
export async function deletePayment(paymentId: string) {}
export async function updateClientData(clientId: string, data: ClientInput) {}
```

### Queries TanStack
```typescript
// useEntidadQuery para SELECTs
export function useLoansQuery(unitId: string) {}
export function useClientQuery(clientId: string) {}

// useEntidadMutation para mutaciones
export function useRegisterPaymentMutation() {}
export function useCreateLoanMutation() {}
```

---

## Estructura de Componentes

```typescript
// Orden estándar dentro de un componente
'use client' // Si es client component

import React from 'react'
// Imports externos
import { useState } from 'react'
// Imports internos
import { TarjetaBase } from '@/components/shared/TarjetaBase'
import { useLoansQuery } from '@/lib/queries/loans'
// Imports de tipos
import type { Loan } from '@/lib/supabase/types'

// Tipos/interfaces del componente
interface Props {
  loan: Loan
}

// Componente principal
export function TarjetaPrestamo({ loan }: Props) {
  // 1. Hooks de estado
  const [isOpen, setIsOpen] = useState(false)
  
  // 2. Hooks de queries/mutations
  const { data } = useLoansQuery(loan.unit_id)
  
  // 3. Handlers
  const handlePagar = () => {}
  
  // 4. Renderizado
  return (
    <div>
      ...
    </div>
  )
}
```

---

## Formatos de Datos

### Moneda
```typescript
// Siempre formatear moneda con función utilitaria
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(amount)
}

// Uso: formatCurrency(25000) → "$25.000"
```

### Fechas
```typescript
// Usar date-fns con locale español
import { format, isToday, parseISO } from 'date-fns'
import { es } from 'date-fns/locale'

format(new Date(), 'dd MMM yyyy', { locale: es }) // "24 jul 2026"
```

### Números de teléfono
```typescript
// Limpiar antes de usar en WhatsApp/llamadas
const cleanPhone = (phone: string) => phone.replace(/\D/g, '')
```

---

## Colores del Proyecto

| Uso | Color | Hex | Tailwind |
|-----|-------|-----|---------|
| Primario | Verde dinosaurio | `#16a34a` | `green-600` |
| Primario claro | Verde claro | `#22c55e` | `green-500` |
| Primario hover | Verde oscuro | `#15803d` | `green-700` |
| Fondo | Blanco | `#ffffff` | `white` |
| Texto principal | Gris oscuro | `#111827` | `gray-900` |
| Texto secundario | Gris | `#6b7280` | `gray-500` |
| Borde | Gris claro | `#e5e7eb` | `gray-200` |
| Error | Rojo | `#ef4444` | `red-500` |
| Advertencia | Amarillo | `#eab308` | `yellow-500` |
| Éxito | Verde | `#22c55e` | `green-500` |

---

## Estados de UI

### Píldoras de Estado
```typescript
// Préstamos
'activo'     → verde  → "Activo"
'completado' → gris   → "Completado"
'cancelado'  → rojo   → "Cancelado"

// Gastos
'pendiente'  → amarillo → "Pendiente"
'aprobado'   → verde    → "Aprobado"
'rechazado'  → rojo     → "Rechazado"
```

---

## Estructura de Server Actions

```typescript
'use server'

import { createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { NewLoanSchema } from '@/lib/validations/loan'

export async function createLoan(rawData: unknown) {
  // 1. Auth check
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado' }
  
  // 2. Validation
  const result = NewLoanSchema.safeParse(rawData)
  if (!result.success) return { error: result.error.flatten() }
  
  // 3. Business logic
  const { data, error } = await supabase
    .from('loans')
    .insert({ ...result.data, unit_id: user.id })
    .select()
    .single()
  
  if (error) return { error: error.message }
  
  // 4. Revalidate cache
  revalidatePath('/unidad/prestamos')
  
  return { data }
}
```

---

## Comentarios en el Código

Solo comentar cuando el POR QUÉ no es obvio:
```typescript
// Bien: explica un invariante no obvio
// La posición se asigna al final para que el nuevo préstamo
// quede al final de la ruta hasta que el cobrador lo reordene manualmente
const posicion = maxPosicion + 1

// Mal: el código ya lo dice
// Sumar el monto al total
total += monto
```

---

## Ver También
- [[arquitectura/ARQUITECTURA]] — Estructura de carpetas
- [[AI/GUIA-IA]] — Resumen rápido de convenciones para IAs
