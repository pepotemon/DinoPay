---
tags: [flujos, diagramas, procesos, mermaid]
created: 2026-07-24
updated: 2026-07-24
---

# Flujos del Sistema — DinoPay

[[INDEX|← Volver al Index]]

---

## Flujo 1: Autenticación

```mermaid
flowchart TD
    A[Usuario entra a la app] --> B{¿Tiene sesión activa?}
    B -->|No| C[/login]
    B -->|Sí| D{¿Qué rol tiene?}
    C --> E[Ingresa credenciales]
    E --> F{¿Son válidas?}
    F -->|No| G[Error: credenciales inválidas]
    G --> E
    F -->|Sí| D
    D -->|Admin| H[/admin/dashboard]
    D -->|Unidad| I[/unidad/prestamos]
    D -->|Desconocido| C
```

---

## Flujo 2: Ciclo de Vida del Préstamo

```mermaid
flowchart LR
    A[Cliente nuevo] --> B[/unidad/nuevo]
    B --> C{Préstamo creado}
    C -->|Estado: activo| D[/unidad/prestamos]
    D --> E{¿Saldo = 0?}
    E -->|No| F[Registra pagos periódicos]
    F --> E
    E -->|Sí| G[Préstamo completado]
    G --> H[/unidad/disponibles]
    H --> I{¿Nuevo préstamo?}
    I -->|Sí| D
    I -->|No| J[Cliente espera]
```

---

## Flujo 3: Registro de Pago

```mermaid
flowchart TD
    A[Cobrador abre tarjeta] --> B[Presiona 'Pagar']
    B --> C[Modal de pago]
    C --> D[Selecciona número de cuotas]
    D --> E[Monto se calcula automáticamente]
    E --> F[Selecciona método: efectivo/transferencia]
    F --> G[Presiona 'Registrar']
    G --> H[Optimistic update en UI]
    H --> I[Server Action: registerPayment]
    I --> J{¿Éxito?}
    J -->|Sí| K[Confirma. TanStack Query invalida cache]
    J -->|No| L[Rollback optimistic update]
    K --> M{¿Saldo = 0?}
    M -->|Sí| N[Préstamo → completado]
    N --> O[Cliente → disponibles]
    M -->|No| P[Continúa activo]
```

---

## Flujo 4: Gasto → Aprobación

```mermaid
flowchart LR
    A[Unidad crea gasto] --> B{Estado: pendiente}
    B --> C[Aparece en panel admin]
    C --> D{Admin decide}
    D -->|Aprueba| E{Estado: aprobado}
    D -->|Rechaza| F{Estado: rechazado}
    E --> G[Afecta caja de la unidad]
    E --> H[Aparece en reporte diario]
    F --> I[No afecta nada]
```

---

## Flujo 5: Cliente Disponible → Nuevo Préstamo

```mermaid
flowchart TD
    A[Cliente en Disponibles] --> B[Cobrador toca tarjeta]
    B --> C[Formulario pre-llenado con datos del último préstamo]
    C --> D[Muestra indicador de calidad del cliente]
    D --> E[Cobrador ajusta datos si necesario]
    E --> F[Guardar]
    F --> G[Nuevo préstamo creado: estado activo]
    G --> H[Intenta restaurar posición en ruta]
    H --> I{¿Posición libre?}
    I -->|Sí| J[Asigna posición anterior]
    I -->|No| K[Inserta en posición, desplaza los demás]
    J --> L[Aparece en /prestamos]
    K --> L
```

---

## Flujo 6: Eliminación de Pago

```mermaid
flowchart TD
    A[Cobrador quiere eliminar pago] --> B{¿Dentro del período permitido?}
    B -->|No| C[Error: período de bloqueo activo]
    B -->|Sí| D[Confirmar eliminación]
    D --> E[Server Action: deletePayment]
    E --> F[Transacción SQL atómica]
    F --> G[Marcar payment.eliminado = true]
    F --> H[Revertir loan.cuotas_pagadas y saldo]
    F --> I[Crear box_adjustment tipo: salida]
    G & H & I --> J{¿Todos exitosos?}
    J -->|Sí| K[Commit - UI actualizada]
    J -->|No| L[Rollback - UI no cambia]
    K --> M{¿Préstamo estaba completado?}
    M -->|Sí| N[Reactivar préstamo - sacar de disponibles]
    M -->|No| O[Sigue activo con nuevo saldo]
```

---

## Flujo 7: Creación de Nueva Unidad (Admin)

```mermaid
flowchart TD
    A[Admin abre formulario] --> B[Llena datos de la unidad]
    B --> C[Valida formulario con Zod]
    C --> D{¿Válido?}
    D -->|No| E[Mostrar errores]
    E --> B
    D -->|Sí| F[Server Action con service role key]
    F --> G[Crear usuario en Supabase Auth]
    G --> H{¿Éxito?}
    H -->|No| I[Error: username ya existe o problema de auth]
    H -->|Sí| J[Insertar en tabla units con el UUID generado]
    J --> K[Mostrar credenciales al admin]
    K --> L[Admin comparte credenciales con la unidad]
```

---

## Ver También
- [[reglas-de-negocio/REGLAS]] — Reglas que gobiernan estos flujos
- [[funcionalidades/PANTALLA-PRESTAMOS]] — Pantalla central del flujo diario
- [[arquitectura/BASE-DE-DATOS]] — Tablas involucradas en cada flujo
