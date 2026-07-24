---
tags: [seguridad, autenticacion, permisos, RLS, validacion]
created: 2026-07-24
updated: 2026-07-24
---

# Seguridad — DinoPay

[[INDEX|← Volver al Index]]

---

## Modelo de Seguridad

DinoPay aplica seguridad en **3 capas**:
1. **Middleware Next.js**: Redirige usuarios no autenticados antes de que la página cargue
2. **Server Actions/API Routes**: Validan permisos antes de ejecutar cualquier mutación
3. **Supabase RLS**: La base de datos rechaza queries no autorizadas aunque el código del servidor las envíe

---

## Capa 1: Middleware de Autenticación

```typescript
// middleware.ts — Se ejecuta en CADA request
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Rutas públicas (no requieren auth)
  if (pathname === '/login') return NextResponse.next()
  
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  
  // Sin sesión → login
  if (!user) return NextResponse.redirect(new URL('/login', request.url))
  
  // Rutas admin → verificar rol admin
  if (pathname.startsWith('/admin')) {
    const isAdmin = await checkIsAdmin(supabase, user.id)
    if (!isAdmin) return NextResponse.redirect(new URL('/unidad/prestamos', request.url))
  }
  
  // Rutas unidad → verificar rol unidad
  if (pathname.startsWith('/unidad')) {
    const isUnit = await checkIsUnit(supabase, user.id)
    if (!isUnit) return NextResponse.redirect(new URL('/admin/dashboard', request.url))
  }
}
```

---

## Capa 2: Validación en Server Actions

Todos los Server Actions siguen este patrón:
```typescript
// src/lib/actions/payments.ts
'use server'

export async function registerPayment(data: PaymentInput) {
  const supabase = await createServerClient()
  
  // 1. Verificar sesión
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')
  
  // 2. Verificar que el préstamo pertenece a esta unidad
  const { data: loan } = await supabase
    .from('loans')
    .select('id, unit_id, estado')
    .eq('id', data.loan_id)
    .single()
  
  if (!loan || loan.unit_id !== user.id) {
    throw new Error('Préstamo no encontrado o no autorizado')
  }
  
  if (loan.estado !== 'activo') {
    throw new Error('El préstamo no está activo')
  }
  
  // 3. Validar datos con Zod
  const validated = PaymentSchema.parse(data)
  
  // 4. Ejecutar operación
  const { error } = await supabase.from('payments').insert(validated)
  if (error) throw error
}
```

---

## Capa 3: Row Level Security (RLS)

### Policies por Tabla

#### `units`
```sql
-- Las unidades solo ven su propia fila
CREATE POLICY "unit_own_row" ON units
  FOR SELECT USING (id = auth.uid());

-- Los admins ven todas las unidades
CREATE POLICY "admin_all_units" ON units
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );
```

#### `clients`, `loans`, `payments`, `expenses`
```sql
-- Unidad solo ve sus datos
CREATE POLICY "unit_own_data" ON clients
  FOR ALL USING (unit_id = auth.uid());

-- Admin ve todos los datos
CREATE POLICY "admin_all_data" ON clients
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );
```

#### `capital_movements`
```sql
-- Solo el admin puede crear movimientos de capital
CREATE POLICY "admin_only_capital" ON capital_movements
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM admins WHERE id = auth.uid())
  );

-- La unidad solo puede VER sus propios movimientos
CREATE POLICY "unit_read_own_movements" ON capital_movements
  FOR SELECT USING (unit_id = auth.uid());
```

---

## Gestión de Claves API

| Clave | Dónde usarla | Prefijo | Riesgo si se expone |
|-------|-------------|---------|---------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Browser + Server | `NEXT_PUBLIC_` | Bajo (es pública) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser + Server | `NEXT_PUBLIC_` | Bajo (RLS la protege) |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo Server | Sin prefijo | **ALTO** — bypasea RLS |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Browser | `NEXT_PUBLIC_` | Medio (restringir en GCP) |

### Regla de Oro
> `SUPABASE_SERVICE_ROLE_KEY` en el browser = acceso total a la base de datos sin restricciones. **Nunca** usar con prefijo `NEXT_PUBLIC_`.

---

## Validación de Inputs

Toda entrada del usuario se valida con **Zod** antes de tocar la base de datos:

```typescript
// src/lib/validations/loan.ts
import { z } from 'zod'

export const NewLoanSchema = z.object({
  modalidad: z.enum(['diaria', 'semanal', 'quincenal', 'mensual']),
  interes: z.number().min(0).max(100),
  valor_neto: z.number().min(1),
  numero_cuotas: z.number().int().min(1),
})
```

**Dónde se valida**:
- Frontend: Para feedback inmediato al usuario (UX)
- Server Action: Para seguridad real (no confiar en el cliente)

---

## Ataques Prevenidos

| Ataque | Prevención |
|--------|-----------|
| CSRF | Next.js maneja esto con Server Actions (origen verificado) |
| XSS | React escapa todo por defecto. No usar `dangerouslySetInnerHTML` |
| SQL Injection | Supabase usa queries parametrizadas. No hacer string concatenation en SQL |
| IDOR (acceso a datos ajenos) | RLS + verificación en Server Actions |
| Escalada de privilegios | Middleware + verificación de rol en cada route |

---

## Ver También
- [[AI/REGLAS-CRITICAS#C-SEC]] — Reglas críticas de seguridad
- [[arquitectura/AUTENTICACION]] — Sistema de auth
- [[arquitectura/BASE-DE-DATOS#Row Level Security]] — Políticas RLS
