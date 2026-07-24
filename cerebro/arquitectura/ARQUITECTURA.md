---
tags: [arquitectura, stack, framework, tecnico]
created: 2026-07-24
updated: 2026-07-24
---

# Arquitectura de DinoPay

[[INDEX|← Volver al Index]]

---

## Stack Tecnológico

### Frontend
| Tecnología | Versión | Rol |
|-----------|---------|-----|
| **Next.js** | 15+ (App Router) | Framework React full-stack |
| **TypeScript** | 5+ | Tipado estático |
| **Tailwind CSS** | 3+ | Estilos utilitarios |
| **shadcn/ui** | latest | Componentes UI base |
| **TanStack Query** | v5 | Manejo de estado servidor / cache |
| **Zustand** | v5 | Estado global del cliente |
| **dnd kit** | latest | Drag & drop para enrutar |
| **React Hook Form** | v7 | Manejo de formularios |
| **Zod** | v3 | Validación de schemas |
| **date-fns** | v3 | Manipulación de fechas |
| **Lucide React** | latest | Iconos |

### Backend / Infraestructura
| Tecnología | Rol |
|-----------|-----|
| **Supabase** | Base de datos PostgreSQL + Auth + Realtime + Storage |
| **Next.js API Routes** | Endpoints personalizados cuando Supabase RPC no alcanza |
| **Supabase RLS** | Row Level Security — seguridad a nivel de base de datos |
| **Supabase Realtime** | Actualizaciones en tiempo real (pagos, estado) |

### Integraciones Externas
| Servicio | Uso |
|---------|-----|
| **Google Maps API** | Ubicar clientes en mapa, abrir Maps desde tarjeta |
| **WhatsApp Web API** | Botón de WhatsApp desde tarjeta de préstamo |

---

## Por Qué Este Stack

### Por qué Next.js (y no Vite + React puro)
- Ofrece SSR/SSG nativamente, mejora SEO si se necesita en el futuro
- API Routes integradas para lógica de servidor (ej: generar reportes complejos)
- App Router permite layouts anidados perfectos para el patrón Admin / Unidad
- Excelente DX con TypeScript out-of-the-box
- Deploy sencillo en Vercel o cualquier hosting Node.js

### Por qué Supabase (y no Firebase/PlanetScale/Neon)
- Es una base de datos **relacional** (PostgreSQL) — los préstamos y bonos tienen relaciones complejas
- Auth integrado con roles nativos
- Row Level Security (RLS) permite que cada unidad vea SOLO sus datos sin lógica extra en el frontend
- Realtime out-of-the-box para updates instantáneos entre admin y unidades
- Dashboard visual para administrar datos directamente
- Storage para futuros archivos o imágenes
- Alternativas descartadas: Firebase (NoSQL, costoso para queries relacionales), Neon (sin auth ni realtime integrado)

### Por qué TanStack Query (y no SWR/Redux Toolkit Query)
- Cache inteligente con invalidación granular
- Optimistic updates nativos (crítico para UX rápida al registrar pagos)
- Manejo de loading/error states sin boilerplate
- Prefetching fácil para datos críticos

### Por qué dnd kit (y no react-beautiful-dnd)
- react-beautiful-dnd está en modo mantenimiento (sin actualizaciones activas)
- dnd kit es más moderno, performante y accesible
- Soporte nativo para touch (importante en móvil)

---

## Estructura de Carpetas del Proyecto

```
DinoPay/
├── cerebro/                    # Segundo Cerebro (Obsidian)
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/             # Rutas de autenticación
│   │   │   ├── login/
│   │   │   └── layout.tsx
│   │   ├── admin/              # Panel del administrador
│   │   │   ├── dashboard/
│   │   │   ├── unidades/
│   │   │   │   ├── nueva/
│   │   │   │   └── [id]/
│   │   │   ├── reportes/
│   │   │   └── layout.tsx
│   │   └── unidad/             # Panel de la unidad
│   │       ├── nuevo/          # Nueva cliente + préstamo
│   │       ├── prestamos/      # Lista de trabajo diaria
│   │       ├── disponibles/    # Clientes disponibles
│   │       ├── enrutar/        # Ordenar ruta
│   │       ├── gastos/
│   │       ├── reportes/
│   │       ├── reporte-diario/
│   │       ├── flujo-semanal/
│   │       └── layout.tsx
│   ├── components/
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── admin/              # Componentes exclusivos del admin
│   │   ├── unidad/             # Componentes exclusivos de la unidad
│   │   └── shared/             # Componentes compartidos
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts       # Cliente browser
│   │   │   ├── server.ts       # Cliente servidor (SSR)
│   │   │   └── types.ts        # Tipos generados de Supabase
│   │   ├── queries/            # TanStack Query hooks
│   │   ├── actions/            # Next.js Server Actions
│   │   ├── utils/
│   │   └── validations/        # Schemas Zod
│   ├── stores/                 # Zustand stores
│   └── types/                  # TypeScript types globales
├── public/
├── supabase/
│   ├── migrations/             # Migraciones SQL
│   └── seed.sql               # Datos iniciales
├── .env.local
├── package.json
└── next.config.ts
```

---

## Patrones Arquitectónicos

### Patrón: Server Components + Client Components
- **Server Components**: Fetching de datos inicial, layouts, páginas estáticas
- **Client Components**: Interactividad (modales, forms, drag&drop, tiempo real)
- **Server Actions**: Mutaciones (crear préstamo, registrar pago, etc.)

### Patrón: Row Level Security (RLS)
Cada unidad solo puede ver y modificar SUS propios datos. Esto se implementa a nivel de base de datos en Supabase, no en la aplicación.

```sql
-- Ejemplo: una unidad solo ve SUS préstamos
CREATE POLICY "units_own_loans" ON loans
  FOR ALL USING (unit_id = auth.uid());
```

### Patrón: Optimistic Updates
Al registrar un pago, la UI se actualiza inmediatamente (sin esperar la respuesta del servidor) usando TanStack Query. Si falla, hace rollback automático. Esto da la sensación de velocidad que se requiere en campo.

### Patrón: Caja calculada vs. almacenada
La **caja actual** de la unidad NO se almacena directamente. Se calcula en tiempo real sumando:
```
caja_actual = capital_inicial + ingresos - retiros + cobrado - prestado - gastos_aprobados
```
Esto evita desincronizaciones. Solo el `capital_inicial` se almacena en la tabla `units`.

---

## Flujo de Autenticación

```
Usuario entra a /login
    → Ingresa credenciales
    → Supabase Auth verifica
    → Si es admin → redirige a /admin/dashboard
    → Si es unidad → redirige a /unidad/prestamos
    → Si falla → muestra error
```

Los roles se manejan con metadata de usuario en Supabase Auth + RLS policies.

---

## Consideraciones de Performance

1. **Queries paginadas**: La lista de préstamos puede crecer. Usar paginación o infinite scroll.
2. **Cache agresivo**: TanStack Query con `staleTime` de 30s para datos que cambian poco.
3. **Realtime selectivo**: Solo suscribirse a cambios de la tabla `payments` y `loans` del día actual.
4. **Imágenes**: Next.js Image optimization para fotos de clientes (si se agregan en el futuro).
5. **Índices DB**: Índices en `unit_id`, `loan_id`, `fecha_pago` para queries frecuentes.

---

## Ver También
- [[BASE-DE-DATOS]] — Schema completo
- [[AUTENTICACION]] — Detalle del sistema de auth
- [[decisiones/STACK-TECNOLOGICO]] — Análisis completo de alternativas
- [[integraciones/INTEGRACIONES]] — Configuración de servicios externos
