---
tags: [changelog, historial, cambios]
created: 2026-07-24
updated: 2026-07-24
---

# Changelog — DinoPay

[[INDEX|← Volver al Index]]

> Solo se registran cambios importantes. No trivialidades.

---

## [0.1.0] — 2026-07-24

### Agregado
- Segundo Cerebro (documentación completa en Obsidian) creado desde cero
- Arquitectura definida: Next.js 15 + Supabase + Tailwind + shadcn/ui + TanStack Query
- Schema de base de datos diseñado (8 tablas con RLS)
- Documentación de todas las pantallas del sistema
- Reglas de negocio documentadas
- Decisión de stack tecnológico registrada con alternativas evaluadas
- Glosario de términos
- Guía para IAs
- Roadmap por fases definido

### Decisiones tomadas en esta sesión
- **Stack**: Next.js + Supabase (ver [[decisiones/STACK-TECNOLOGICO]])
- **Modelo de caja**: Calculada siempre (nunca almacenada directamente)
- **Aislamiento de ajustes semanales**: Los `weekly_adjustments` son invisibles para el resto del sistema
- **RLS como primera línea de defensa de datos**: No filtrar datos por unidad en código, dejárselo a Supabase

### Problemas resueltos
- N/A (proyecto en inicio)

### Qué cambió en la base de datos
- N/A (schema diseñado pero no ejecutado aún)

---

## [Próxima versión — pendiente]

### Agregado
- Proyecto Next.js inicial creado con TypeScript, Tailwind CSS, App Router y scripts de build/lint.
- Dependencias base instaladas: Supabase SSR/JS, TanStack Query, Zustand, dnd kit, React Hook Form, Zod, Lucide y componentes estilo shadcn/ui.
- Rutas iniciales creadas: `/login`, `/admin/dashboard`, `/admin/unidades/nueva`, `/unidad/prestamos`, `/unidad/nuevo` y `/unidad/disponibles`.
- Cliente Supabase browser/server y middleware base por rol (`admin` / `unidad`) creados.
- Migraciones locales de Supabase creadas en `supabase/migrations/` usando el schema del cerebro.
- Proyecto Supabase `DinoPay Project` conectado con variables reales en `.env.local`.
- Migraciones ejecutadas en Supabase y primer usuario admin creado/verificado.
- Formulario `/admin/unidades/nueva` conectado a Server Action para crear usuarios de unidad en Supabase Auth e insertar su configuracion inicial en `units`.
- Login actualizado para aceptar username de unidad o email de admin.
- Boton de logout agregado en layouts de admin y unidad.
- Pantalla `/unidad/nuevo` implementada con formulario de cliente + prestamo, preview de cuota/total y validacion de intereses.
- Pantalla `/unidad/prestamos` conectada a prestamos activos reales, ordenados por `posicion`.
- Migracion local `005_create_client_with_loan.sql` agregada para crear cliente + prestamo en una funcion transaccional.
- Registro de pago base implementado en `/unidad/prestamos` con RPC `register_payment`.
- Migracion local `006_register_payment.sql` agregada para registrar pagos, actualizar saldo/cuotas y completar prestamos automaticamente.
- Formulario de pago ajustado para recalcular monto al cambiar cuotas, aceptar decimales y refrescar la lista tras registrar.
- Totalizador diario de `/unidad/prestamos` conectado a pagos reales del dia: recaudado, meta, faltante, progreso y visitados.
- Filtros `Todos / Pendientes / Visitados` y buscador por cliente/barrio/telefono agregados en `/unidad/prestamos`.
- Boton `No pago` agregado con tabla `loan_visits` y RPC `mark_no_pay_visit` para marcar visitados sin afectar caja.
- Pantalla `/unidad/disponibles` conectada a clientes activos sin prestamo activo, con resumen y ultimo prestamo completado.
- Flujo `/unidad/disponibles/[id]/nuevo` agregado para crear nuevo prestamo a cliente existente con datos prellenados del ultimo prestamo.
- Migracion local `008_create_loan_for_existing_client.sql` agregada para crear prestamos recurrentes y restaurar posicion de ruta.

### Verificado
- `npm.cmd run build` pasa correctamente.
- `npm.cmd run lint` pasa correctamente.
- Login admin exitoso en la app local.
- `npm.cmd run build` y `npm.cmd run lint` pasan tras implementar creacion de unidades.
- `npm.cmd run build` y `npm.cmd run lint` pasan tras implementar cliente + prestamo.
- Creacion de cliente + prestamo probada tras ejecutar la migracion `005_create_client_with_loan.sql`.

### Pendiente inmediato
- Generar tipos TypeScript desde Supabase.
- Ejecutar `006_register_payment.sql` en Supabase antes de registrar pagos desde la app.
- Rotar la secret key de Supabase porque fue compartida en el chat durante el setup.

### Planificado
- Configuración de Supabase
- Sistema de autenticación
- Primera pantalla funcional: Préstamos

---

*El changelog se actualiza al finalizar cada sesión de trabajo significativa.*
