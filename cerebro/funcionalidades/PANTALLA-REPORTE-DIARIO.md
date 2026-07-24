---
tags: [funcionalidad, pantalla, reporte-diario, caja, movimientos]
created: 2026-07-24
updated: 2026-07-24
---

# Pantalla: REPORTE DIARIO

[[INDEX|← Volver al Index]]

---

## Objetivo
Vista resumida de todos los movimientos del día con totalizadores de caja. Es el "cierre de día" de la unidad — permite al cobrador y al admin saber exactamente el estado financiero al final de la jornada.

---

## Estructura de la Pantalla

```
┌────────────────────────────────────────┐
│  📅 Fecha: [2026-07-24 ◀ ▶]           │
├────────────────────────────────────────┤
│  💰 Caja Inicial:  $1,000,000          │
│  💵 Caja Final:    $1,125,000          │
├────────────────────────────────────────┤
│  ✅ Cobrado:       $350,000            │
│  📤 Prestado:      $200,000            │
│  ⬆️  Ingresos:     $0                  │
│  ⬇️  Retiros:      $0                  │
│  💸 Gastos:        $25,000             │
├────────────────────────────────────────┤
│  📊 CUADRES DE CAJA                    │
│  [Lista de ajustes]                    │
├────────────────────────────────────────┤
│  👥 CLIENTES DEL DÍA                   │
│  Programados: 122                      │
│  Visitados: 45                         │
│  Pendientes: 77                        │
│                                        │
│  [Lista de clientes por categoría]     │
└────────────────────────────────────────┘
```

---

## Selector de Fecha
- Flechas ◀ ▶ para navegar día a día
- Muestra hoy por defecto
- No tiene calendario — navegación lineal para rapidez

---

## Totalizadores de Caja

### Caja Inicial
> El dinero con que empezó la unidad ese día, **antes** de cualquier movimiento.

```
caja_inicial(fecha) = capital_inicial_unidad
                    + todos los ingresos admin hasta fecha - 1
                    - todos los retiros admin hasta fecha - 1
                    + todo lo cobrado hasta fecha - 1
                    - todo lo prestado hasta fecha - 1
                    - todos los gastos aprobados hasta fecha - 1
                    + todos los cuadres de caja hasta fecha - 1
```

En términos simples: es la `caja_final` del día anterior.

### Caja Final
> El dinero disponible al **final** del día, después de todos los movimientos.

```
caja_final(fecha) = caja_inicial(fecha)
                  + cobrado(fecha)
                  - prestado(fecha)
                  + ingresos(fecha)
                  - retiros(fecha)
                  - gastos_aprobados(fecha)
                  ± cuadres_caja(fecha)
```

### Cobrado
Suma de todos los pagos (`payments`) del día, no eliminados, de cualquier método.

### Prestado
Suma de `valor_neto` de todos los préstamos (`loans`) cuya `created_at` sea del día.

### Ingresos
Movimientos de tipo `ingreso` en `capital_movements` del día (hechos por el admin).

### Retiros
Movimientos de tipo `retiro` en `capital_movements` del día (hechos por el admin).

### Gastos
Suma de gastos en `expenses` con estado `aprobado` cuya fecha sea del día.

---

## Cuadres de Caja

Lista cronológica de todos los `box_adjustments` del día.

### Tipos de Cuadres
| Concepto | Tipo | Descripción |
|---------|------|-------------|
| `eliminacion_pago` | Salida o Entrada | Se eliminó un pago → el dinero "vuelve" al cliente (sale de caja) o "vuelve" a caja si fue error |
| `eliminacion_prestamo` | Entrada | Se canceló un préstamo → el capital vuelve a caja |
| `error_operativo` | Ambos | Corrección manual por error |
| `ingreso_admin` | Entrada | Capital inyectado por el admin |
| `retiro_admin` | Salida | Capital retirado por el admin |

### Tarjeta de Cuadre
```
┌──────────────────────────────────┐
│ ⬆️ Eliminación de pago           │
│ +$27,500                         │
│ Cliente: María López             │
│ 09:32 AM                         │
└──────────────────────────────────┘
```

---

## Sección: Clientes del Día

### Categorías

| Categoría | Descripción |
|-----------|-------------|
| **Programados** | Todos los préstamos activos con cuota para hoy |
| **Visitados** | Clientes que pagaron O fueron marcados como "No pagó" |
| **Pendientes** | Clientes activos que NO tienen ningún registro hoy |

### Lista de Clientes por Categoría
Cada categoría expande/colapsa mostrando:
- Nombre del cliente
- Cuota del día
- Estado (pagó / no pagó / pendiente)
- Monto pagado si pagó

---

## Archivos Involucrados
- `src/app/unidad/reporte-diario/page.tsx`
- `src/components/unidad/TotalizadoresDiarios.tsx`
- `src/components/unidad/ListaCuadresCaja.tsx`
- `src/components/unidad/ResumenClientesDia.tsx`
- `src/lib/queries/reporte-diario.ts`

---

## Reglas de Negocio
- Los valores de caja se calculan en el servidor, nunca en el cliente (para evitar errores de redondeo)
- El reporte es de solo lectura (no se puede editar desde aquí)
- Si hay préstamos o pagos eliminados, sus cuadres de caja aparecen en la sección correspondiente

---

## Ver También
- [[PANTALLA-FLUJO-SEMANAL]] — Resumen de la semana
- [[PANTALLA-GASTOS]] — Gastos que aparecen aquí
- [[base-de-datos/SCHEMA#box_adjustments]] — Cuadres de caja en DB
- [[reglas-de-negocio/REGLAS#Cálculo de Caja]]
