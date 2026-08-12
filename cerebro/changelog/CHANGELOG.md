---
tags: [changelog, historial, cambios]
created: 2026-07-24
updated: 2026-08-12 (v0.27.0)
---

# Changelog — DinoPay

[[INDEX|← Volver al Index]]

> Solo se registran cambios importantes. No trivialidades.

---

## [0.27.0] — 2026-08-12

### Admin — Config inline, modales de edición, fixes de historial

**Configuración de unidad (`/admin/unidades/[id]/configuracion`) — reescritura completa**
- Página reemplazada por 3 secciones acordeón, todas contraídas por defecto.
- Cada sección es editable directamente (sin abrir otra página), muestra resumen en collapsed y tiene su propio botón "Guardar".
- **Información de la ruta**: nombre, encargado, teléfono, país, estado, ciudad, zona horaria → `updateUnitInfoInlineAction`.
- **Configuración operativa**: intereses (separados por coma), días laborales (checkboxes), permisos (eliminar abonos/préstamos) → `updateUnitOperativeInlineAction`.
- **Acceso y seguridad**: cambio de contraseña → `changeUnitPasswordInlineAction`.
- Las 3 acciones retornan `{ error?: string }` en lugar de hacer redirect — feedback inline sin navegación.
- Eliminado el bloque "Acciones rápidas" (Ver reportes / Ver préstamos) — eran redundantes.

**Editar cliente — ahora es un modal**
- "Editar cliente" en el menú de 3 puntos ya no navega a `/clientes/[clientId]/editar`.
- Abre `EditClientModal` directamente sobre la lista de clientes.
- Campos: alias, NIT, teléfono 1, teléfono 2, dirección, barrio.
- Acción `updateClientInlineAction` — retorna `{ error?: string }`, revalida la ruta al guardar.
- Server query de clientes ampliada: añadidos `telefono2, direccion1, barrio` al select.
- `ClientWithLoan` type actualizado con los 3 campos nuevos.

**Historial de pagos — bug fix**
- `getClientPaymentsAction` usaba columna `tipo_pago` que no existe en la tabla `payments`.
- Corregido a `metodo_pago` + añadido `numero_cuotas` al select.
- Las filas del modal ahora muestran método y número de cuotas: "efectivo · 1 cuota".

**UnitQuickModal — centrado en todas las pantallas**
- Eliminado el modo right-panel en desktop (`lg:items-stretch lg:justify-end`).
- Ahora es `items-center justify-center p-4` en todos los breakpoints — resuelve también la línea blanca del borde superior.

**Otras mejoras menores**
- "Ver historial" link eliminado de las tarjetas de cliente (redundante con los modales del menú).
- Página de edición `/clientes/[clientId]/editar` creada como fallback (accesible directamente por URL).

---

## [0.26.0] — 2026-08-12

### Admin — Modal de opciones rápidas + 3 páginas dedicadas por unidad

**Nueva navegación en lista de unidades**
- Las tarjetas de unidad ya no navegan directamente al hub — abren un modal de opciones rápidas.
- `UnitQuickModal`: bottom sheet en mobile, modal centrado en desktop. Muestra nombre, estado, 3 métricas (cartera, clientes activos, meta día) y 3 opciones de navegación como cards con icono, título y descripción.
- `UnitsListClient`: client component que maneja el estado `selectedUnit` para el modal.

**`/admin/unidades/[id]/clientes`** — Clientes y préstamos
- Buscador en tiempo real (filtra por alias o NIT).
- Pills de filtro: Todos / Activos / Disponibles / Inactivos.
- Cards de cliente con badge de estado, info del préstamo, barra de progreso de cuotas, link a historial.

**`/admin/unidades/[id]/transacciones`** — Transacciones
- Filtros de período: Hoy / Semana / Mes / Año (links, default semana).
- Form de rango personalizado (input type=date, GET a la misma ruta).
- 3 metric cards: Total ingresos (verde), Total retiros (rojo), Balance.
- Form de nuevo movimiento (ingreso/retiro) con `createCapitalMovementAction`.
- Lista de movimientos con badge de tipo, monto y nota.

**`/admin/unidades/[id]/configuracion`** — Configuración
- Cards: Información de ruta, Configuración operativa (intereses, días, permisos), Acceso/seguridad (cambio de contraseña colapsable), Acciones rápidas.

**`/admin/unidades/[id]`** → redirect a `/clientes`.

**`createCapitalMovementAction`** actualizado con campo opcional `redirectTo` para redirigir a la página de transacciones en lugar del hub.

---

## [0.25.0] — 2026-08-12

### Admin — Rediseño SaaS con sidebar + caché + bug fix caja

**Layout tipo SaaS con sidebar lateral**
- `AdminSidebar`: sidebar fija en desktop (lg+), w-56, sticky, con brand, nav por secciones, logout. Active state basado en `usePathname`.
- `AdminTopBar`: top bar mobile con hamburger + drawer deslizable con backdrop blur.
- Layout `src/app/admin/layout.tsx` reemplaza el header horizontal por el sistema sidebar + columna derecha.
- El botón "← Unidades" del hub ahora es `lg:hidden` (la sidebar lo hace redundante en desktop).

**Dashboard mejorado**
- 4 metric cards con íconos, colores y links: Unidades activas, Cartera total, Meta del día, Gastos pendientes.
- Card adicional con total de gastos aprobados histórico.
- Query extra de `loans` para cartera y meta en tiempo real.

**Caché en hub de unidad (performance)**
- `unstable_cache` con TTL 30s y tag `admin-unit-hub-{id}` para las 10 queries estáticas del hub.
- Query `todayPaymentsRaw` fuera del caché — siempre fresca.
- Server actions del hub llaman `revalidateTag` + `revalidatePath` al mutar datos.

**Bug fix — caja estimada incorrecta**
- `totalIngresos`/`totalRetiros` usaban solo los últimos 15 movimientos de capital (el mismo array limitado de la UI). Ahora se hace una query separada sin `.limit()` solo para los aggregados.

---

## [0.24.0] — 2026-08-12

### Admin — Hub de Unidad Rediseñado Completamente

**Pantalla de lista de unidades (`/admin/unidades`)**
- Cards enriquecidas con métricas en vivo: Cartera, Clientes activos, Meta día.
- Datos cruzados con préstamos activos en query paralela.

**Hub por unidad (`/admin/unidades/[id]`) — 3 tabs**

Pestaña **Clientes**:
- Filtros rápidos: Activos (con préstamo) / Disponibles (sin préstamo) / Inactivos.
- Cards con info completa: alias, NIT, teléfono, modalidad, interés, cuota, saldo, ratio cuotas.
- Badges: atraso (naranja con días), cuotas adelantadas (verde).
- Menú 3 puntos por cliente: ver historial, cancelar préstamo (con confirm), desactivar (placeholder).
- Página de historial de cliente: `/admin/unidades/[id]/clientes/[clientId]` con todos los préstamos y últimos 50 pagos.

Pestaña **Transacciones**:
- Caja estimada grande + sub-métricas (cartera, cobrado hoy, meta).
- Formulario movimiento de capital (ingreso/retiro) → `createCapitalMovementAction`.
- Lista de últimos 15 movimientos de capital.
- Gastos con sub-filtro Pendientes/Aprobados; pendientes tienen botones Aprobar/Rechazar → `decideExpenseFromHubAction`.

Pestaña **Configuración**:
- Card info de ruta: nombre, @usuario, encargado, teléfono, ciudad, zona horaria.
- Card operativa: tasas de interés (pills verdes), días laborales, permisos de eliminación.
- Card acciones: links a `/editar` y `/reportes`, formulario colapsable cambio de contraseña → `changeUnitPasswordAction`.

**Nuevos archivos**:
- `src/components/admin/unit-hub-client.tsx` — wrapper con tab state.
- `src/components/admin/unit-clients-tab.tsx` — tab clientes.
- `src/components/admin/unit-transactions-tab.tsx` — tab transacciones.
- `src/components/admin/unit-config-tab.tsx` — tab configuración.
- `src/lib/actions/admin/unit-hub.ts` — `decideExpenseFromHubAction`, `changeUnitPasswordAction`, `cancelLoanFromHubAction`.
- `src/app/admin/unidades/[id]/clientes/[clientId]/page.tsx` — historial de cliente.

---

## [0.23.0] — 2026-08-12

### Admin — Funcionalidades Completas

**Ver reportes de cualquier unidad**
- Nueva página `/admin/unidades/[id]/reportes` — reutiliza `ReportesClient` del panel de unidad.
- Botón "Reportes" añadido en el detalle de unidad admin.

**Cancelar préstamos activos (desde admin)**
- Nueva página `/admin/unidades/[id]/prestamos` — lista todos los préstamos de una unidad con historial.
- Acción `cancelLoanAction` en `src/lib/actions/admin/prestamos.ts` — marca `estado = 'cancelado'` con verificación de admin.
- Botón de cancelar con confirmación en `CancelLoanButton` (Client Component).
- Botón "Préstamos" añadido en el detalle de unidad admin.

### Flujo Semanal — Editar/eliminar ajustes individuales en la UI

- `flujo-client.tsx`: DayCard ahora lista cada ajuste individual del día con su monto, descripción, tipo y botones de editar (link a `/unidad/flujo-semanal/[id]/editar`) y eliminar (form con `deleteAjusteAction`).
- El servidor action `deleteAjusteAction` y la página de editar ya existían; ahora la UI los expone.

### Reporte Diario — Copiar resumen para WhatsApp

- `caja-client.tsx`: botón "Copiar resumen" que genera texto con caja inicial, cobrado, prestado, gastos, ingresos, retiros, caja final y conteo de clientes.

### PWA — Service Worker básico

- `public/sw.js`: cachea assets estáticos (`_next/static/*`, manifest, íconos). No intercepta rutas SSR.
- `SwRegister` registra el SW en el layout raíz.

### Testing

- Vitest instalado y configurado (`vitest.config.ts`).
- 23 tests unitarios para `calcularDiasAtraso`, `calcularCuotasAdelantadas`, `addDaysToDateString` y `dateInTimeZone`.
- Scripts `test` y `test:watch` añadidos a `package.json`.

### Seguridad — Audit RLS

- Todas las tablas tienen RLS habilitado con políticas correctas: `admins`, `units`, `clients`, `loans`, `payments`, `expenses`, `capital_movements`, `box_adjustments`, `weekly_adjustments`, `loan_visits`, `caja_snapshots`.
- Todas las funciones `SECURITY DEFINER` tienen `SET search_path = public, pg_catalog` (Migration 020).
- Pendiente crítico: rotar la `SUPABASE_SERVICE_ROLE_KEY` (fue expuesta en sesión de setup).

---

## [0.22.0] — 2026-07-29

### Corregido — Integridad Financiera (Auditoria Completa)

**Pago duplicado (idempotencia)**
- Añadida columna `client_key UUID` con índice `UNIQUE` a la tabla `payments` (Migration 018).
- El cliente genera un `crypto.randomUUID()` al momento de enviar el formulario en `prestamos-client.tsx`.
- La accion del servidor `registerPaymentAction` lo pasa como `p_client_key` al RPC.
- `register_payment` ahora verifica si ya existe un pago con ese `client_key`; si existe, devuelve el ID del pago existente sin insertar otro — garantia de idempotencia ante resubmissions o doble tap.

**Rounding artifact en ultima cuota**
- `register_payment` ahora absorbe residuos de centavos menores a `$0.05` poniendo `saldo = 0`. Evita que el prestamo quede activo con un saldo fantasma de e.g. `$0.01` despues del ultimo pago estandar.

**Zona horaria en `delete_loan_same_day`**
- Corregido el uso de `current_date` (UTC) por `unit_today(p_unit_id)` y de `created_at::date` (UTC) por `(created_at AT TIME ZONE v_tz)::date` — evitaba que unidades no-UTC pudieran o no pudieran borrar prestamos del mismo dia incorrectamente.

**Drop de `calculate_caja` (funcion obsoleta)**
- Eliminada la funcion `calculate_caja(uuid, date)` que usaba UTC y nunca fue llamada por el front-end. Migration 018.

**Sistema de snapshots de caja para performance (Migration 019)**
- Nueva tabla `caja_snapshots(unit_id, fecha_cierre, valor_caja)` con `UNIQUE(unit_id, fecha_cierre)` y RLS.
- `compute_caja_until(p_unit_id, p_fecha)`: calcula la suma total de caja hasta una fecha exclusiva usando zona horaria de la unidad.
- `ensure_caja_snapshot(p_unit_id, p_fecha_cierre)`: idempotente — devuelve valor existente o calcula y guarda.
- `reverse_payment` actualizado: invalida snapshots con `fecha_cierre > fecha_del_pago` al anular un pago.
- `reporte-diario/page.tsx` refactorizado para usar `ensure_caja_snapshot` como baseline y cargar solo ~60 dias de datos (mes actual + mes anterior).
- `caja-client.tsx`: `CajaData` reemplaza `capitalInicial` por `snapshotDate` + `cajaBase`; `cajaInicial` ahora calcula `cajaBase + delta(snapshotDate..fecha)`; navegacion atras bloqueada al llegar al limite del snapshot.
- Visitas (`loan_visits.fecha`) ahora se leen directamente sin conversion de zona horaria (columna ya es fecha local).
- Pagos (`payments.fecha_pago`) ahora se leen directamente sin `hora_registro` (columna ya es fecha local).

---

## [0.21.0] — 2026-07-29

### Corregido

**Toast duplicado en Enrutar y Gastos**
- `AutoToast` refactorizado para ser idempotente: ahora lee el `?ok`/`?error` directamente desde `window.location.href` (en lugar del hook `useSearchParams`) y limpia la URL *antes* de disparar el toast. Esto evita que el efecto dispare el toast dos veces en React Strict Mode (desarrollo) o ante re-renders rápidos.
- Eliminado el banner servidor `{params?.ok}` y `{params?.error}` de `enrutar/page.tsx`; el mensaje ya era mostrado también por `AutoToast`, produciendo una doble notificacion.
- Removido `router` de las dependencias del `useEffect` en `AutoToast` (no se usaba en el cuerpo del efecto).

### Modificado

**Modal de opciones rapidas en Prestamos**
- Direccion del cliente ahora centrada (`text-center`) en la cabecera del modal.
- Quitado el PNG del dino en el modal de opciones rapidas (vista `main`) para un diseño mas limpio.
- Quitado el PNG del dino en el modal de "No pago" (vista `nopay`).

**Registros de pagos en Historial de Pagos**
- Las filas de pago ahora muestran solo el metodo y la fecha+hora formateada con zona horaria de la unidad (ej. "29 jul 2026, 3:21 a.m.").
- Eliminadas las lineas redundantes: `fecha_pago` (era la misma fecha de `hora_registro`) y "Cuotas pagadas: X" (informacion ya visible en las tarjetas de resumen).
- Nueva funcion helper `formatPaymentDatetime(isoStr, tz)` para formatear timestamps ISO con zona horaria local.

---

## [0.20.7] -- 2026-07-28

### Modificado

**Header de Prestamos**
- Redisenado el header de Prestamos como hero movil con titulo grande, tarjeta verde, recaudado, meta, faltante y progreso circular.
- El acceso a Planear recorrido queda como boton principal separado debajo del resumen.
- Busqueda y filtros quedan visualmente integrados debajo del hero.

---

## [0.20.6] -- 2026-07-28

### Modificado

**Avatares de clientes**
- Los dinos de cliente ahora usan verde DinoPay.
- El modal de pago y su confirmacion ya no muestran avatar para mantener el flujo compacto.

---

## [0.20.5] -- 2026-07-28

### Agregado

**Avatares en modales de prestamos**
- Los modales de prestamos muestran PNGs de dino centrados arriba como avatar del cliente.
- El avatar usa el genero guardado del cliente para elegir variante masculina, femenina o neutral.

---

## [0.20.4] -- 2026-07-28

### Agregado

**Prestamos**
- Las fichas de prestamos muestran una pildora "Visitado hoy" cuando el cliente ya registro abono en el dia.

---

## [0.20.3] -- 2026-07-28

### Corregido

**Cierre de bug de fechas en pantallas internas**
- Flujo Semanal ahora agrupa prestamos creados por fecha local de la unidad y usa el hoy local para sus rangos.
- Gastos inicia filtros y consultas con el hoy local de la unidad.
- El detalle admin de unidad calcula "Cobrado hoy" segun la zona horaria de esa unidad.
- Los movimientos de capital creados desde admin guardan su fecha segun la unidad, no segun UTC.
- Prestamos usa el hoy local para calcular atrasos y cuotas adelantadas.
- Los gastos nuevos guardan fecha de negocio segun zona horaria de la unidad.
- Nueva migracion `017_timezone_safe_expenses.sql` evita defaults UTC en `expenses.fecha`.

### Modificado

**Zona horaria de unidades**
- Crear/editar unidad valida zonas horarias reales como `America/Belem`.
- Editar unidad muestra advertencia antes de cambiar la zona horaria porque afecta agrupaciones por dia.

---

## [0.20.2] -- 2026-07-28

### Corregido

**Fechas por zona horaria en Reportes**
- La pantalla Reportes ahora lista prestamos y abonos segun la fecha local de la unidad.
- El date picker usa el hoy local de la unidad, evitando que movimientos nocturnos salten al dia siguiente por UTC.

---
## [0.20.1] -- 2026-07-28

### Corregido

**Fechas por zona horaria en caja del dia**
- Caja del dia agrupa pagos, prestamos, visitas y movimientos por fecha local de la unidad, no por UTC.
- Prestamos usa hoy local para cobrado/visitados y permisos de eliminar del dia.
- Nueva migracion `016_timezone_safe_business_dates.sql` para que pagos, no pagos y prestamos nuevos usen la fecha local de la unidad en Supabase.

---
## [0.20.0] -- 2026-07-28

### Agregado / Modificado

**Navegacion ultra rapida en unidad**
- Prefetch persistente de rutas principales de unidad desde el layout movil.
- La barra inferior precarga rutas al tocar o pasar sobre cada acceso.
- Los accesos internos del menu declaran prefetch explicito.
- La cache cliente de React Query conserva datos por mas tiempo para reducir recargas entre pantallas cliente.

---
## [0.19.1] -- 2026-07-28

### Modificado

**Formulario de unidades**
- Eliminado el campo "Dias bloqueados para eliminar pagos" de crear/editar unidad.
- La eliminacion de abonos queda guiada solo por permiso del admin y misma fecha del abono.

---
## [0.19.0] -- 2026-07-28

### Agregado

**Edicion de unidades desde Admin**
- Nueva pantalla `/admin/unidades/[id]/editar` para actualizar datos operativos de una unidad existente.
- Permite cambiar encargado, telefono, capital inicial, ubicacion, zona horaria, intereses, dias laborales, estado activo y permisos de eliminacion.
- El detalle de unidad ahora muestra boton Editar y badges con permisos actuales.

---
## [0.18.1] -- 2026-07-28

### Corregido

**No pago con motivo**
- Nueva migracion reparadora `015_repair_no_pay_visits.sql` para crear/actualizar `loan_visits`, policies y RPC `mark_no_pay_visit` de forma idempotente.
- Pensada para Supabase cuando la migracion original de no pago no esta aplicada o quedo incompleta.

---
## [0.18.0] -- 2026-07-28

### Agregado / Modificado

**Permisos de eliminacion para unidades**
- Nuevos permisos por unidad: eliminar abonos del dia y eliminar prestamos del dia.
- Historial de pagos muestra "Eliminar abono" solo si el abono es de hoy y la unidad tiene permiso.
- Historial de prestamos muestra "Eliminar prestamo" solo si fue creado hoy, no tiene abonos y la unidad tiene permiso.
- Nuevas RPCs seguras: `reverse_payment` valida permiso/mismo dia y `delete_loan_same_day` valida permiso/mismo dia/sin abonos.

---
## [0.17.1] -- 2026-07-28

### Modificado

**Ajuste de color principal**
- Verde primary reforzado para que botones, iconos, textos activos y focus rings tengan mas presencia visual.

---
## [0.17.0] -- 2026-07-28

### Agregado / Modificado

**Compactado fuerte de Prestamos** (`/unidad/prestamos`)
- Fichas de prestamo mas bajas y densas para aprovechar mejor el ancho movil.
- Modal de pago y confirmacion compactados con controles, botones y separaciones reducidas.
- Modal de no pago y confirmacion tambien compactados para registrar motivo sin ocupar media pantalla.

---
## [0.16.0] — 2026-07-28

### Agregado / Modificado

**Rediseño completo de Flujo Semanal** (`/unidad/flujo-semanal`)
- Hero: "Flujo" (negro) + "Semanal" (primary) + 👻 emoji
- Rango de fechas libre (ya no fijado a semana de lunes a domingo): dos date pickers Fecha Inicial / Fecha Final; por defecto inicio de semana a hoy
- "Crear Ajuste" → bottom sheet con tipo (ingreso/egreso), monto, fecha, descripción; usa `useActionState`
- **5 tarjetas de resumen**: Cobrado (con sub-líneas Transferencia/Efectivo) | Prestado, Gastos | Recaudado (net), Ajustes (ancho completo)
- **"Copiar Resumen"** y **"Copiar Todo"** con `navigator.clipboard.writeText` + feedback visual (Check icon 2s)
- **Tarjetas diarias** (una por cada día del rango): header en primary con fecha larga + botón copiar individual; líneas con icono + Prestado(-) / Cobrado / Transferencia / Efectivo / Gastos(-) / Ajustes / Total Recaudado / Total Final
- Todo el filtrado es client-side (servidor precarga 90 días); cambio de rango de fechas es instantáneo
- `createAjusteAction` actualizada: redirect a `/unidad/flujo-semanal` (sin params de semana)

---

## [0.15.0] — 2026-07-28

### Agregado / Modificado

**Rediseño completo de "Caja del Día"** (`/unidad/reporte-diario`)
- Nuevo componente `CajaDelDiaClient` con navegación de fechas `< DD/MM/YYYY >` totalmente client-side (sin roundtrips al cambiar día)
- Server precarga todo el historial (pagos, préstamos creados, gastos aprobados, movimientos de capital, visitas 180 días) en una sola petición paralela de 7 queries
- **8 tarjetas en grilla 2×4**: Caja Inicial · Caja Final · Cobrado · Préstamos(N) · Ingresos · Gastos · Retiros · Cuadres de caja
- **Sección Clientes**: Programados · Visitados (2 col) + Pendientes (ancho completo, fondo negro)
- Caja Inicial = capital_inicial + cobrado_antes - prestado_antes - gastos_antes + ingresos_antes - retiros_antes
- Caja Final = Caja Inicial + movimientos del día seleccionado
- Cuadres de caja en $0 (placeholder — tabla `box_adjustments` no implementada aún)

---

## [0.14.0] — 2026-07-28

### Agregado / Modificado

**Rediseño y optimización de velocidad en pantalla Reportes** (`/unidad/reportes`)
- Eliminado el botón "Ver" — el date picker ahora filtra al instante (sin roundtrip al servidor)
- Tabs "Préstamos / Abonos" ahora son cliente-side (`useState`) — cambio de tab instantáneo sin navegación
- Arquitectura: server carga 30 días de datos (loans + payments) en un solo request al montar; `ReportesClient` filtra localmente por fecha y tab
- Hero actualizado: "Reportes / fecha larga", emoji 📊, diseño coherente con el resto del design system
- Tarjetas rediseñadas: `rounded-2xl border bg-background shadow-sm` sin Card/shadcn
- Totalizadores también sin Card/shadcn
- Skeleton en `loading.tsx` actualizado al nuevo hero

---

## [0.13.0] — 2026-07-28

### Agregado / Modificado

**Rediseño completo de la pantalla Gastos** (`/unidad/gastos`)
- Nueva arquitectura: shell servidor con Suspense + `GastosClient` (cliente)
- Hero: "Gastos / Diarios $X" con emoji 🧾, totalizador en tiempo real del rango filtrado
- "Nuevo gasto" → bottom sheet (`showSheet`) con select de categoría + monto + nota textarea; usa `useFormStatus` para estado de carga
- Filtro de fecha: dos `<input type="date">` con bg-green-50, filtra localmente (sin roundtrip al servidor)
- Aviso informativo: tarjeta `border-primary/20 bg-primary/5` explicando que los pendientes no afectan el cierre de caja
- Tarjeta de gasto: categoría, fecha formateada, monto, badge de estado (píldora), nota opcional, botones Editar/Eliminar solo si pendiente
- Carga 90 días de datos del servidor y filtra en cliente para que cambios de rango sean instantáneos
- Skeleton propio en `loading.tsx` con hero + botón + date pickers + aviso + tarjetas

---

## [0.12.0] — 2026-07-28

### Agregado / Modificado

**Tarjeta de crédito en el formulario "Nuevo"** (`NuevoClienteForm`)
- El bloque de resumen del préstamo ahora se muestra como una tarjeta de crédito visual (`CreditCardPreview`)
- Muestra en tiempo real: nombre del cliente, cédula, dirección 1, valor por cuota, plazo (modalidad) y total a entregar
- Diseño: gradiente verde, chip simulado (grilla 3×3 dorada), relación de aspecto 86:54, círculos decorativos, tipografía blanca
- Los campos `alias`, `nit` y `direccion1` son ahora controlados (state) para alimentar la tarjeta en vivo

**Optimización de velocidad de carga (caché de servidor)**
- Nuevo módulo `src/lib/data/unit.ts`: función `getUnitMeta(unitId)` con `unstable_cache` de Next.js (TTL 5 min)
  - Elimina consultas duplicadas a la tabla `units` en prestamos, nuevo y menú
- Nuevo módulo `src/lib/data/holidays.ts`: función `getHolidayDates(countryCode, year)` con `unstable_cache` (TTL 60 min)
  - Incluye lógica de auto-sync de Nager.Date si la DB no tiene festivos para el año
  - La pantalla de préstamos ya no hace 2 viajes a Supabase por festivos en cada carga
- Datos de tiempo real (préstamos activos, pagos, visitas) no se cachean — siempre frescos

---

## [0.11.0] — 2026-07-28

### Agregado / Modificado

**Cabecera con fecha/hora, bandera y nombre de usuario** (pantalla PRÉSTAMOS)
- Reloj en vivo (`LiveClock`) debajo del título, muestra fecha + hora en la zona horaria de la unidad (campo `zona_horaria` de la tabla `units`)
- Bandera emoji del país usando Unicode Regional Indicators a partir de `pais_codigo`
- Nombre del encargado (`encargado`) al lado del reloj
- Page ahora carga y pasa `zona_horaria` y `encargado` junto con `pais_codigo`

**Contadores de visitados/pendientes en la cabecera**
- Nueva fila bajo los stats: `X/Y visitados · Z pendientes` con los números en negrita

**Filtro "Todos"**
- Tabs de filtro ahora son 3: Todos / Pendientes / Visitados (grid-cols-3)
- "Todos" muestra la lista completa de préstamos activos sin filtrar
- Tipo del estado cambia de `"pendientes" | "visitados"` a `"todos" | "pendientes" | "visitados"`

**Búsqueda cross-filter**
- Al escribir en la barra de búsqueda, se ignora el filtro activo y se busca en TODOS los préstamos
- Permite encontrar un cliente esté donde esté (pendiente o visitado) sin cambiar de pestaña

**Recibo de pago (imagen copiable)**
- Nueva vista `"receipt"` en el bottom sheet, accesible desde "Copiar Recibo" en las acciones de la ficha
- Genera una imagen PNG con canvas (`drawReceiptCanvas`) con los colores y estilo de DinoPay
- Contenido: título, nombre del cliente, fecha/hora actual, información del préstamo (inicio, total a pagar, valor neto, interés, modalidad), detalles de cuotas (valor, número actual X/Y, último pago), resumen (total pagado, saldo)
- Multiidioma: Brazil (BR) → portugués (`pt-BR`), resto → español (`es-419`); términos traducidos en `LANG_ES` y `LANG_PT`
- Botones: "Copiar" (Clipboard API `ClipboardItem` PNG) y "Descargar" como fallback
- El canvas se genera a 2× (retina) para nitidez en pantallas de alta densidad

---

## [0.10.0] — 2026-07-27

### Agregado / Modificado

**Historial de Pagos rediseñado** (vista `info-payments` del bottom sheet)
- Grid de 4 stats: Total Pagado (destacado en fondo primary), Saldo, Cuotas Pagadas y Pagos Realizados
- Cuando hay pago parcial muestra "Faltan $X para completar la cuota #N" bajo las cuotas
- Cada fila de pago lleva un tag de cuota acumulada (`#6,83`) en color primary, calculado recorriendo el historial de más nuevo a más antiguo partiendo del `cuotasFrac` actual
- Íconos: `Banknote`, `Lock`, `Layers`, `Receipt`, `ArrowLeftRight`
- Tipo `PaymentLoanContext` permite que tanto `ClientLoan` como `LoanHistory` naveguen a `info-payments`

**Historial de Préstamos rediseñado** (vista `info-loans` del bottom sheet)
- Nuevo componente `LoanCard` usado para el préstamo activo y cada préstamo anterior
- Cada tarjeta muestra: rango de fechas (inicio → fin), grid 2×2 de stats (Cuotas, Valor Cuota, Saldo, Interés), sección Resumen con bullets:
  - Total prestado / Total a cobrar / Modalidad / Monto neto recibido
  - Cuotas parciales: cantidad de pagos donde `monto < valor_cuota` (no una fracción)
  - Para préstamos completados: `"El cliente pagó su préstamo con X días de atraso"` si el último pago fue después de `fecha_fin`
- Botón "Ver Pagos" navega a `info-payments` con el contexto correcto (incluyendo `clientLoan` para poder volver al `main`)
- Header de la vista `info-loans`: "HISTORIAL DE PRÉSTAMOS DE" (pequeño, uppercase) + nombre del cliente (grande, 2xl, uppercase, centrado)
- Eliminada línea redundante "Tu préstamo actual es de $X y tu cuota es de $Y"
- Page carga historial de pagos de préstamos anteriores (`prevPaymentHistory`) y los fusiona en `paymentHistoryByLoan`

**Múltiples pagos por día**
- Después de registrar un pago, el botón "Pagar" permanece visible como "Registrar otro pago" (en lugar de ocultarse)
- El cliente sigue apareciendo en "Visitados" con borde verde

---

## [0.9.0] — 2026-07-27

### Agregado

**Cuotas adelantadas**
- `src/lib/utils/overdue.ts`: nueva función `calcularCuotasAdelantadas(ultimaCuotaFecha, modalidad, diasLaborales)` — devuelve cuántas cuotas por adelantado tiene el cliente; 0 cuando está al día o atrasado
- `/unidad/prestamos/page.tsx`: carga `dias_laborales` de la unidad y calcula `adelantadasByLoan` por préstamo
- Badge `"X adelantada(s)"` verde en la fila del cliente y punto indicador verde cuando hay cuotas adelantadas (solo visible si no está pagado/no-pago del día)

**Pagos parciales**
- Nueva migración `013_partial_payments.sql`: `register_payment` calcula `v_full_cuotas = floor(monto / valor_cuota)`; `cuotas_pagadas` solo avanza por cuotas completas; `ultima_cuota_fecha` no avanza si el pago no cubre una cuota completa; `saldo` siempre baja por el monto real
- Display de cuotas deriva de `(total_a_cobrar - saldo) / valor_cuota` → muestra valores fraccionados como `8.3 / 20` en la lista, el sheet y los detalles
- Pantalla de confirmación de pago detecta pago parcial (`monto < valor_cuota`): fondo naranja, texto "Pago parcial · No cubre una cuota completa"
- `SheetInfoDetails`: renombrado "Cuotas parciales" → "Cuotas pagadas" mostrando el valor fraccionado

---

## [0.8.0] — 2026-07-27

### Agregado

**Sistema de días de atraso**
- Nueva migración `011_add_pais_codigo.sql`: agrega columna `pais_codigo TEXT` a `units` (código ISO 2 letras, ej: `"CO"`, `"BR"`) y tabla `holidays(country_code, year, date, name)` para cache de festivos
- `src/lib/utils/overdue.ts`: función `calcularDiasAtraso(ultimaCuotaFecha, holidaySet)` — cuenta días hábiles vencidos excluyendo domingos y festivos del país de la unidad
- `src/lib/actions/admin/holidays.ts`: server action `syncHolidaysAction` — consulta la API gratuita Nager.Date y guarda los festivos en Supabase; skipea si el año ya está cacheado
- `/unidad/prestamos/page.tsx`: carga `pais_codigo` de la unidad, lee festivos desde cache y calcula `overdueByLoan` (días de atraso por préstamo) antes de renderizar
- Badge `"Xd atraso"` naranja en la fila de cada cliente de la lista cuando tiene cuotas vencidas; punto del indicador también cambia a naranja
- **IMPORTANTE**: ejecutar `011_add_pais_codigo.sql` en Supabase; poblar festivos vía `syncHolidaysAction` o directamente en la tabla `holidays`

**Selector de país/estado/ciudad en formulario de nueva unidad**
- Instalado `country-state-city@3.2.1` — datos offline, ~250 países, sin API key
- `CreateUnitForm` reemplaza los 4 inputs de texto libre (país, estado, ciudad, zona horaria) con selectores en cascada: País → Estado → Ciudad; zona horaria se auto-rellena al elegir el país
- El código ISO del país (`paisCodigo`) se guarda en el campo oculto y se persiste en `units.pais_codigo`
- `createUnitAction` actualizado para recibir y guardar `pais_codigo`

**"Ver Detalles" rediseñado**
- Dos secciones: "Detalles del cliente" (Dirección 1, Dirección 2, Teléfono, Barrio) y "Detalles del préstamo" (Modalidad, Interés, Cuotas parciales, Fecha de cuota, Último pago, Fecha de inicio, Fecha de fin, Fecha de creación)
- Layout de filas label/valor con bordes, inspirado en la referencia del usuario
- Query de préstamos ampliada para incluir `interes`, `fecha_inicio`, `fecha_fin`, `ultima_cuota_fecha`, `created_at`

---

## [0.7.0] — 2026-07-27

### Modificado

**Rediseño completo de la pantalla Préstamos** (`/unidad/prestamos`)
- Diseño propio, desacoplado de la referencia original
- Cabecera sticky compacta: título + stats en una sola línea (`$cobrado · $meta · %`) + barra de progreso fina + búsqueda + tabs de filtro — sin tarjeta hero con gradiente
- Lista densa: una fila por cliente con punto de color (verde = cobrado, rojo = no-pago, gris = pendiente), nombre, barrio + cuotas y monto de cuota con chevron
- Bottom sheet unificado reemplaza todos los modales y menús separados anteriores:
  - Vista `main`: dirección, badge de estado, stats (cuota/saldo/cuotas), botones Llamar/WhatsApp, botones Pagar/No Pago, acciones secundarias (detalles, historial de pagos, historial de préstamos, editar cliente)
  - Vista `pay` → `pay-confirm`: formulario de pago dentro del mismo sheet con flujo de confirmación
  - Vista `nopay` → `nopay-confirm`: selector de razón + confirmación dentro del mismo sheet
  - Vistas `info-*`: detalles, historial de pagos e historial de préstamos dentro del sheet con botón Volver
- Máquina de estados (`SheetState`) con backView() para navegar entre vistas sin cerrar el sheet
- Sin botones expuestos en la lista → elimina riesgo de acción accidental en campo

---

## [0.6.0] — 2026-07-24

### Agregado

**Streaming con Suspense en pantallas lentas**
- `nuevo/page.tsx` y `disponibles/page.tsx` refactorizados: el shell estático (título, botones) renderiza instantáneamente; los datos de Supabase streaman en segundo plano dentro de `<Suspense>`
- Skeleton animado aparece donde irán los datos mientras cargan, en lugar de pantalla en blanco
- `loading.tsx` agregados en `nuevo/`, `disponibles/` y `enrutar/` (faltaban) para navegación dura

**Préstamos nativos (sin recarga)**
- Filtros y búsqueda: `useState` en cliente, sin URL params ni viaje al servidor
- Registro de pago y "Sin pago hoy": `router.refresh()` en lugar de `redirect()`, la página actualiza en segundo plano sin mover la pantalla
- `prefetch={true}` en links del menú del bottom nav para precargar pantallas secundarias

---

## [0.5.0] — 2026-07-24

### Agregado

**Navegación móvil (bottom nav)**
- Nuevo componente cliente `src/components/unidad/bottom-nav.tsx`
- Barra fija en la parte inferior con 4 accesos: Préstamos, Nuevo, Disponibles, Menú
- Botón "Menú" abre overlay con: Enrutar clientes, Gastos, Reportes, Caja, Flujo semanal
- Botón "Cerrar sesión" en rojo al final del menú (lógica de logout inline)
- Estado activo resaltado en color primario en barra y dentro del menú
- Header reducido a logo únicamente; nav horizontal eliminada
- `pb-24` en `<main>` para que el contenido no quede tapado por la barra

---

## [0.4.0] — 2026-07-24

### Agregado

**Anular pago** (eliminar con recálculo)
- Nueva migración `supabase/migrations/010_reverse_payment.sql` con RPC `reverse_payment(p_payment_id, p_unit_id)`
- El RPC verifica propiedad, respeta `dias_bloqueados_eliminacion` de la unidad, hace soft-delete del pago y revierte el préstamo (saldo, cuotas_pagadas, estado activo si estaba completado)
- Server action `deletePaymentAction` en `src/lib/actions/unidad/payments.ts`
- Botón de papelera (Trash2) en cada pago del historial en `/unidad/prestamos/[id]`
- **IMPORTANTE**: ejecutar `010_reverse_payment.sql` en Supabase antes de usar

**Ver detalle de unidad (admin)**
- Nueva página `/admin/unidades/[id]` con: métricas (caja estimada, cartera activa, cobrado hoy, meta del día), historial de movimientos de capital, formulario para inyectar/retirar capital
- Nueva página `/admin/unidades` con lista de todas las unidades (enlace desde nav)
- Nav admin actualizado: nuevo link "Unidades" → `/admin/unidades`

**Inyectar/retirar capital (admin)**
- Server action `createCapitalMovementAction` en `src/lib/actions/admin/capital.ts`
- Inserta en tabla `capital_movements` con admin_id, unit_id, tipo (ingreso/retiro), monto, nota, fecha
- Formulario en la página de detalle de la unidad

**Caja estimada corregida**
- `reporte-diario` y `admin/unidades/[id]` ahora incluyen `capital_movements` en el cálculo de caja
- Fórmula completa: `capital_inicial + total_cobrado - total_prestado - gastos_aprobados + capital_inyectado - capital_retirado`

**Editar ajuste semanal**
- `updateAjusteAction` en `src/lib/actions/unidad/ajustes.ts`
- Nueva página `/unidad/flujo-semanal/[id]/editar` con componente `EditAjusteForm`
- Botón lápiz (Pencil) en cada ajuste de la lista del flujo semanal

**Toasts (Sonner)**
- `sonner` instalado como dependencia
- `<Toaster position="top-center" richColors />` en root layout
- Componente `AutoToast` en `src/components/auto-toast.tsx`: lee `?ok=` y `?error=` de la URL, dispara toast y limpia la URL. Envuelto en `<Suspense>` en el layout
- Todos los redirects con `?ok=...` y `?error=...` existentes funcionan automáticamente con toasts sin cambiar los server actions

**Paginación en reportes**
- `/unidad/reportes` ahora pagina a 20 items por página via `?pagina=N`
- Los totalizadores (total prestado, total abonado) siguen calculándose para el día entero
- Botones Anterior/Siguiente al final de la lista

**Loading states adicionales**
- `src/app/unidad/flujo-semanal/loading.tsx` — skeleton con header de navegación
- `src/app/unidad/reportes/loading.tsx` — skeleton con filtro, stats y tarjetas

### Pendiente (requiere acción manual)
- Ejecutar `supabase/migrations/010_reverse_payment.sql` en el proyecto Supabase
- Generar tipos TypeScript: `npx supabase gen types typescript --project-id <ID> > src/types/database.ts`
- Crear íconos PWA: `public/icons/icon-192.png` e `icon-512.png`

---

## [0.3.0] — 2026-07-24

### Agregado

**Editar datos del cliente**
- Nueva página `/unidad/prestamos/[id]/editar-cliente`
- Server action `updateClientAction` en `src/lib/actions/unidad/clients.ts`
- Componente `EditClientForm` con campos prellenados (alias, NIT, teléfonos, dirección, barrio)
- Botón "Editar" en la tarjeta de Contacto del detalle del préstamo

**Editar y eliminar gastos pendientes**
- `deleteExpenseAction` y `updateExpenseAction` agregados a `src/lib/actions/unidad/gastos.ts`
- Botones "Editar" y "Eliminar" visibles solo en gastos con estado `pendiente`
- Nueva página `/unidad/gastos/[id]/editar` con componente `EditExpenseForm`
- La eliminación falla silenciosamente si el gasto ya fue aprobado (protección server-side)

**Reporte diario** (`/unidad/reporte-diario`)
- Cobrado hoy, prestado hoy, visitados, pendientes de cobro
- Gastos aprobados y pendientes del día
- Caja estimada calculada en tiempo real: `capital_inicial + total_cobrado - total_prestado - gastos_aprobados`
- Nota: no incluye movimientos de capital del admin

**Mejora pantalla de préstamos** (`/unidad/prestamos`)
- Tarjetas compactas con borde izquierdo de color: verde = cobrado, naranja = sin pago, sin color = pendiente
- Cuota mostrada prominentemente en grande (`text-2xl`)
- Saldo como dato secundario
- Botones de llamar/WhatsApp solo con ícono (sin texto) para ahorrar espacio
- Badge de estado inline ("Cobrado" / "Sin pago")
- "Sin pago hoy" como botón secundario, "Registrar pago" como acción dominante
- Totalizador rediseñado más compacto con `Stat` component reutilizable

**Historial de préstamos por cliente** (en `/unidad/prestamos/[id]`)
- Card "Préstamos anteriores" al final del detalle, mostrando préstamos completados/cancelados
- Datos: modalidad, fecha inicio, cuotas pagadas/total, monto, estado con badge de color

**Calidad del cliente** (en `/unidad/prestamos/[id]`)
- Badge inline junto a la posición: Bueno / Regular / Riesgoso
- Cálculo: `cuotas_pagadas / (cuotas_pagadas + visitas_sin_pago)` sobre TODOS los préstamos del cliente
- Bueno: ≥ 80% · Regular: 50-79% · Riesgoso: < 50%
- No se muestra si no hay historial suficiente

**PWA básica**
- `public/manifest.json` con nombre, colores, orientación y rutas
- Meta tags en `src/app/layout.tsx`: `theme-color`, `apple-mobile-web-app-capable`, `manifest`
- **Pendiente**: crear iconos reales en `public/icons/icon-192.png` e `icon-512.png`

**Loading y error states**
- `src/app/unidad/prestamos/loading.tsx` — skeleton de tarjetas
- `src/app/unidad/gastos/loading.tsx` — skeleton de resumen + cards
- `src/app/unidad/reporte-diario/loading.tsx` — skeleton de stats
- `src/app/unidad/error.tsx` — error boundary auto-contenido (sin imports de UI para evitar ChunkLoadError de Next.js)

**Flujo semanal** (`/unidad/flujo-semanal`)
- Navegación por semanas con flechas ◀ ▶ (no permite avanzar a semanas futuras)
- Semana calculada siempre desde el lunes; param `?semana=YYYY-MM-DD` en la URL
- Totalizadores: cobrado efectivo + transferencia, prestado, gastos aprobados, ajustes neto, recaudado
- Fórmula: `Recaudado = Cobrado - Prestado - Gastos ± Ajustes`
- Desglose por día (solo muestra días con actividad)
- Lista de ajustes de la semana con botón eliminar
- Formulario "Nuevo ajuste" inline con selector visual ingreso/egreso
- Server actions: `createAjusteAction`, `deleteAjusteAction` en `src/lib/actions/unidad/ajustes.ts`
- Componente cliente: `NuevoAjusteForm` con `useActionState`
- **REGLA**: Ajustes son invisibles para el resto del sistema (caja, reportes, admin)

**Reportes** (`/unidad/reportes`)
- Filtro por fecha (input date, default hoy, no permite futuro)
- Totalizadores: total prestado + total abonado del día
- Tabs Préstamos / Abonos con contador
- Préstamos: alias cliente, modalidad, interés, hora de creación, capital → total
- Abonos: alias cliente, cuota N/Total, método de pago, monto, hora de registro

**Navegación**
- Nav del layout de unidad actualizado: Préstamos · Nuevo · Disponibles · Enrutar · Gastos · Reportes · Semanal · Caja

### Modificado
- `src/app/unidad/prestamos/[id]/page.tsx` — agrega `client_id` al select, historial, calidad, botón Editar
- `src/app/unidad/gastos/page.tsx` — agrega botones editar/eliminar en pendientes
- `src/lib/actions/unidad/gastos.ts` — refactor con `getActiveUnit()` helper, nuevas acciones
- `src/app/layout.tsx` — PWA meta tags via `<head>` directo (no via `Viewport` export para evitar bug de webpack en Next.js 15)
- `src/app/unidad/layout.tsx` — 3 nuevos links en nav

### Bugs resueltos
- `error.tsx` no puede importar componentes UI externos en Next.js 15 (ChunkLoadError). Solución: auto-contenido con HTML/SVG puro.
- `Viewport` como export nombrado en layout causa ChunkLoadError en webpack. Solución: meta tags directos en `<head>`.

---

## [0.2.0] — 2026-07-24

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
- Pantalla `/unidad/enrutar` agregada con drag & drop mobile-first usando dnd kit.
- Migracion local `009_update_route_positions.sql` agregada para guardar posiciones de ruta.
- Pantalla `/unidad/gastos` agregada con resumen, formulario de nuevo gasto y listado de gastos recientes.
- Registro de gastos conectado a Supabase usando la tabla `expenses`; los gastos nacen en estado `pendiente`.
- Pantalla `/admin/gastos` agregada para aprobar o rechazar gastos pendientes por unidad.
- Dashboard admin conectado a metricas reales de unidades activas y gastos.
- Página `/unidad/prestamos/[id]` agregada con detalle del préstamo, contacto, dirección, historial de pagos y visitas sin pago.
- Tarjetas de `/unidad/prestamos` actualizadas con acciones rápidas: Ver, Llamar y WhatsApp.
- Pantalla `/unidad/prestamos` rediseñada con experiencia móvil tipo app: totalizador destacado, búsqueda grande, tabs, tarjetas compactas y pago en modal.
- Menú `...` de préstamo agregado con WhatsApp, llamada, detalles, historial de pagos, historial de préstamos y editar cliente; los accesos informativos abren modales.
- Modal de pago rediseñado con stepper de cuotas, monto y selector de método; `No Pago` ahora abre modal con razón obligatoria guardada en `loan_visits.nota`.
- Modales de pago y no pago actualizados con paso de confirmación final antes de ejecutar la acción.
- Loader global `PageSpinner` reemplazado por un dinosaurio SVG pequeño estilo Chrome, caminando sobre una línea de suelo.
- `.gitignore` actualizado para excluir adjuntos locales de Codex y metadata local de Obsidian.
- Loader de dinosaurio refinado con silueta pixelada y animación de dos frames inspirada en el Chrome Dino runner.
- Loader de dinosaurio rehecho como sprite SVG de dos frames completos para que la carrera se lea mejor visualmente.
- Loader `PageSpinner` cambiado a sprite real del Chrome T-Rex, guardado localmente con licencia BSD en `public/assets`.
- Loader `PageSpinner` centrado en la altura útil móvil para que no quede pegado arriba durante cargas.
- Iconos emoji grandes de pantallas internas reemplazados por `PageDino`, un dino animado por seccion usando el sprite local.
- `PageDino` simplificado como escena sin tarjeta ni colores por pantalla; cada vista muestra simbolos contextuales animados alrededor del dino.
- Pantalla de prestamos actualizada con fichas moviles completas: resumen de cuota, saldo/prestamo/pagado, acciones visibles de pago/no pago y menu `...` para opciones secundarias.
- Fichas de prestamos compactadas para reducir altura en movil sin perder acciones visibles ni resumen principal.
- Pantalla de prestamos ajustada para aprovechar mejor el ancho movil, reduciendo margenes laterales duplicados del layout.
- Fichas de prestamos rediseñadas en formato ticket compacto para diferenciarse de la referencia inicial y mostrar mas tarjetas por pantalla.

### Verificado
- `npm run build` pasa correctamente.
- `npm run lint` pasa correctamente.
- Login admin exitoso en la app local.
- Creacion de cliente + prestamo probada tras ejecutar la migracion `005_create_client_with_loan.sql`.

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

---

*El changelog se actualiza al finalizar cada sesión de trabajo significativa.*
