---
tags: [autenticacion, auth, supabase, roles, seguridad]
created: 2026-07-24
updated: 2026-07-24
---

# Autenticación — DinoPay

[[INDEX|← Volver al Index]]

---

## Sistema de Roles

DinoPay tiene **dos tipos de usuarios** con accesos completamente separados:

| Rol | Descripción | Acceso |
|-----|-------------|--------|
| **Administrador** | Dueño del sistema | `/admin/*` — Ve y controla todo |
| **Unidad** | Agente de cobro | `/unidad/*` — Solo sus propios datos |

---

## Flujo de Login

```
/login
  ↓
  [Ingresa username + password]
  ↓
  Supabase Auth verifica credenciales
  ↓
  ¿Existe en tabla admins?
    → SÍ → redirect /admin/dashboard
    → NO → ¿Existe en tabla units?
              → SÍ → redirect /unidad/prestamos
              → NO → Error: "Credenciales inválidas"
```

---

## Cómo se Crean los Usuarios

### Administrador
- Se crea directamente en Supabase Auth (primer setup del sistema)
- Se registra en la tabla `admins` con su UUID de auth

### Unidades
- El **administrador** las crea desde su panel `/admin/unidades/nueva`
- El proceso:
  1. Admin llena el formulario de nueva unidad (username, password, datos de la unidad)
  2. El sistema crea el usuario en `auth.users` de Supabase vía Admin API
  3. Se registra en la tabla `units` con el UUID asignado
  4. Las credenciales se envían/muestran al admin para que las comparta con la unidad

> ⚠️ Las unidades NO pueden registrarse por sí solas. Solo el admin puede crearlas.

---

## Implementación Técnica

### Middleware de Next.js
```typescript
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(...)
  const { data: { user } } = await supabase.auth.getUser()
  
  const isAdminRoute = request.nextUrl.pathname.startsWith('/admin')
  const isUnitRoute = request.nextUrl.pathname.startsWith('/unidad')
  
  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (isAdminRoute) {
    // Verificar que sea admin
    const { data: admin } = await supabase
      .from('admins').select('id').eq('id', user.id).single()
    if (!admin) return NextResponse.redirect(new URL('/login', request.url))
  }
  
  if (isUnitRoute) {
    // Verificar que sea unidad
    const { data: unit } = await supabase
      .from('units').select('id').eq('id', user.id).single()
    if (!unit) return NextResponse.redirect(new URL('/login', request.url))
  }
}
```

### Clientes Supabase
```typescript
// lib/supabase/client.ts — Para componentes del browser
import { createBrowserClient } from '@supabase/ssr'

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// lib/supabase/server.ts — Para Server Components y Actions
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), ... } }
  )
}
```

---

## Variables de Entorno Necesarias

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...  # Solo en servidor, para crear unidades
```

> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` NUNCA debe exponerse al cliente (no usar prefijo `NEXT_PUBLIC_`)

---

## Seguridad de Sesión

- Las sesiones se manejan con cookies HttpOnly (gestionadas por `@supabase/ssr`)
- Supabase Auth refresca automáticamente los tokens
- Logout limpia las cookies de sesión

---

## Ver También
- [[seguridad/SEGURIDAD]] — Políticas RLS y validaciones
- [[ARQUITECTURA]] — Estructura general
- [[modulos/ADMINISTRADOR]] — Qué puede hacer el admin
- [[modulos/UNIDAD]] — Qué puede hacer la unidad
