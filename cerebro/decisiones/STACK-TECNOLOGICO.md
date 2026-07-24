---
tags: [decision, stack, arquitectura, tecnologia]
created: 2026-07-24
updated: 2026-07-24
---

# Decisión: Stack Tecnológico

[[INDEX|← Volver al Index]]

---

## Qué se Decidió
Usar **Next.js 15 + Supabase + Tailwind CSS + shadcn/ui + TanStack Query** como stack principal de DinoPay.

---

## Contexto de la Decisión
DinoPay es una aplicación de gestión de microcréditos que opera mayormente en campo (dispositivos móviles), requiere datos relacionales complejos (préstamos → pagos → clientes → unidades), y debe ser rápida, confiable y fácil de mantener por un equipo pequeño.

---

## Alternativas Evaluadas

### Framework Frontend

| Opción | Pros | Contras | Decisión |
|--------|------|---------|---------|
| **Next.js** ✅ | SSR/SSG, API Routes, App Router, ecosistema maduro | Complejidad del App Router | **ELEGIDO** |
| Vite + React | Más simple, más rápido en dev | Sin SSR, sin API Routes nativas | Descartado |
| Remix | Buen modelo de datos, loaders | Ecosistema menor, menos docs | Descartado |
| SvelteKit | Muy performante, simple | Ecosistema más pequeño, menos devs | Descartado |

**Por qué Next.js**: Los layouts anidados del App Router son perfectos para separar `/admin/*` de `/unidad/*` con middleware de autenticación. Las Server Actions simplifican las mutaciones sin necesidad de endpoints REST manuales.

---

### Base de Datos

| Opción | Pros | Contras | Decisión |
|--------|------|---------|---------|
| **Supabase** ✅ | PostgreSQL, Auth integrado, RLS, Realtime, SDK | Vendor lock-in parcial | **ELEGIDO** |
| Firebase/Firestore | Bien conocido, escalable | NoSQL (malo para relaciones complejas), costoso | Descartado |
| PlanetScale | MySQL, branching de DB | Sin auth nativa, sin realtime | Descartado |
| Neon | PostgreSQL serverless, barato | Sin auth, sin realtime, más manual | Descartado |
| Railway + PostgreSQL | Control total | Mucha configuración, sin auth/realtime integrado | Descartado |

**Por qué Supabase**: Los préstamos tienen relaciones complejas (cliente → préstamo → pagos → cuadres). PostgreSQL es ideal para esto. RLS garantiza que cada unidad solo vea sus datos sin código adicional en el frontend. Realtime es gratis y nos permite mostrar actualizaciones en vivo. Auth integrado elimina un servicio externo.

---

### Estado y Fetching

| Opción | Pros | Contras | Decisión |
|--------|------|---------|---------|
| **TanStack Query** ✅ | Cache inteligente, optimistic updates, devtools | Curva de aprendizaje | **ELEGIDO** |
| SWR | Simple, de Vercel | Menos features que TQ, sin optimistic updates nativos | Descartado |
| Redux Toolkit Query | Muy completo | Excesivo para este proyecto | Descartado |
| Solo Server Components | Menos JS en cliente | Sin optimistic updates, recarga de página | Descartado parcialmente (usado en combinación) |

**Por qué TanStack Query**: El registro de pagos debe sentirse instantáneo (optimistic updates). La lista de préstamos necesita refrescarse cuando hay cambios sin recargar la página.

---

### Drag & Drop (para Enrutar)

| Opción | Pros | Contras | Decisión |
|--------|------|---------|---------|
| **dnd kit** ✅ | Moderno, accessible, touch support, activo | Más verboso que RBDND | **ELEGIDO** |
| react-beautiful-dnd | Fácil de usar | En modo mantenimiento, no funciona con React 18 Strict Mode | Descartado |
| react-sortable-hoc | Simple | Deprecado | Descartado |

---

### UI Components

| Opción | Pros | Contras | Decisión |
|--------|------|---------|---------|
| **shadcn/ui** ✅ | Componentes copiables, 100% personalizable, sin dependencia npm | Necesita configuración inicial | **ELEGIDO** |
| Material UI | Muy completo | Opinionado, pesado | Descartado |
| Ant Design | Muy completo | Pesado, difícil de personalizar | Descartado |
| Chakra UI | Fácil | Menos performante, más dependencias | Descartado |

---

## Riesgos Identificados

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|-------------|---------|-----------|
| Límites de Supabase Free tier | Media | Alto | Monitorear uso, migrar a paid cuando sea necesario |
| App Router de Next.js (complejidad) | Media | Medio | Documentar patrones, usar ejemplos probados |
| Performance con 100+ préstamos activos | Baja | Medio | Paginación, virtual lists, índices DB |
| Supabase Realtime en muchas conexiones | Baja | Medio | Limitar subscripciones, usar polling si es necesario |

---

## Beneficios Esperados

1. **Velocidad de desarrollo**: shadcn/ui + TanStack Query + Server Actions reduce el boilerplate enormemente
2. **Seguridad por defecto**: RLS en Supabase garantiza aislamiento de datos sin código adicional
3. **UX rápida en campo**: Optimistic updates hacen que registrar pagos sea instantáneo
4. **Mantenibilidad**: TypeScript + Zod en todo el stack elimina errores de tipos
5. **Escalabilidad**: Supabase puede crecer sin cambiar la arquitectura

---

## Fecha de la Decisión
2026-07-24

## Revisión Sugerida
Si el proyecto supera 50 unidades activas y 10,000 préstamos, revisar si Supabase free tier es suficiente o si necesitamos Supabase Pro.

---

## Ver También
- [[arquitectura/ARQUITECTURA]] — Implementación del stack
- [[integraciones/INTEGRACIONES]] — Configuración de Supabase y servicios externos
