---
tags: [index, dashboard, dinopay]
created: 2026-07-24
updated: 2026-07-24
---

# 🦖 DinoPay — Segundo Cerebro

> **El código implementa. El cerebro explica. Ambos evolucionan juntos.**

DinoPay es una aplicación web de pagos y microcréditos (préstamos) diseñada para que administradores gestionen múltiples "unidades" (agentes de cobro), cada una con su propia cartera de clientes y préstamos activos.

---

## 🗺️ Navegación Principal

### 🏗️ Arquitectura & Técnico
- [[arquitectura/ARQUITECTURA]] — Stack, frameworks, patrones, decisiones técnicas
- [[arquitectura/BASE-DE-DATOS]] — Schema completo de Supabase/PostgreSQL
- [[arquitectura/AUTENTICACION]] — Sistema de autenticación dual (admin / unidad)
- [[arquitectura/FLUJO-DE-DATOS]] — Cómo fluye la información en la app

### 📱 Funcionalidades
- [[funcionalidades/PANTALLA-NUEVO]] — Crear nuevo cliente + préstamo
- [[funcionalidades/PANTALLA-PRESTAMOS]] — Lista de trabajo diaria (cobros)
- [[funcionalidades/PANTALLA-CLIENTES-DISPONIBLES]] — Clientes sin préstamo activo
- [[funcionalidades/PANTALLA-ENRUTAR]] — Ordenar ruta de cobro (drag & drop)
- [[funcionalidades/PANTALLA-GASTOS]] — Gastos de la unidad
- [[funcionalidades/PANTALLA-REPORTES]] — Reportes de préstamos y pagos
- [[funcionalidades/PANTALLA-REPORTE-DIARIO]] — Resumen del día
- [[funcionalidades/PANTALLA-FLUJO-SEMANAL]] — Cuaderno semanal de caja

### 👥 Módulos de Usuario
- [[modulos/ADMINISTRADOR]] — Rol administrador: crea y controla unidades
- [[modulos/UNIDAD]] — Rol unidad: gestiona préstamos y cobros

### 🧠 Conocimiento
- [[reglas-de-negocio/REGLAS]] — Todas las reglas de negocio del sistema
- [[flujos/FLUJOS]] — Diagramas de todos los flujos principales
- [[glosario/GLOSARIO]] — Términos, siglas y conceptos internos
- [[base-de-datos/SCHEMA]] — Schema SQL detallado con relaciones

### 📊 Proyecto
- [[roadmap/ROADMAP]] — Hoja de ruta y estado de desarrollo
- [[backlog/BACKLOG]] — Trabajo pendiente clasificado
- [[changelog/CHANGELOG]] — Historial de cambios importantes
- [[bugs/BUGS]] — Bugs encontrados y resueltos
- [[ideas/IDEAS]] — Ideas futuras y experimentos

### 🔧 Técnico & Operacional
- [[decisiones/STACK-TECNOLOGICO]] — Por qué elegimos cada tecnología
- [[integraciones/INTEGRACIONES]] — Supabase, Google Maps, WhatsApp
- [[seguridad/SEGURIDAD]] — Autenticación, permisos, validaciones
- [[convenciones/CONVENCIONES]] — Naming, estilo, patrones del proyecto
- [[preguntas/PREGUNTAS-ABIERTAS]] — Decisiones aún no resueltas

### 🤖 Manual para IAs
- [[AI/GUIA-IA]] — Cómo una IA nueva debe entender este proyecto
- [[AI/COMO-TRABAJAR]] — Reglas de trabajo y documentación
- [[AI/REGLAS-CRITICAS]] — Qué nunca romper, qué partes son críticas

---

## 📈 Estado Actual del Proyecto

| Área | Estado |
|------|--------|
| Arquitectura definida | ✅ Completa |
| Segundo Cerebro | ✅ Creado |
| Base de datos (schema) | ✅ Diseñado |
| Frontend (Next.js) | ✅ Setup inicial creado |
| Backend (Supabase) | ✅ Proyecto conectado y migraciones ejecutadas |
| Módulo Admin | 🔄 Login admin verificado |
| Módulo Unidad | 🔄 Base de rutas creada |
| Deploy | ⏳ Pendiente |

---

## 🎯 Resumen del Proyecto

**DinoPay** permite a un **administrador** crear **unidades** (agentes de cobro) que gestionan carteras de préstamos diarios. Cada unidad tiene su propio capital, clientes y ruta de cobro. El administrador monitorea, aprueba gastos, inyecta capital y genera reportes globales.

**Colores:** Verde dinosaurio `#16a34a` y Blanco `#ffffff`
**Público:** Administradores de microcrédito y sus agentes de campo

---

## 🔗 Links Rápidos

- Repositorio: `C:\Users\helle\DinoPay`
- Cerebro: `C:\Users\helle\DinoPay\cerebro\`
- Supabase Project: [[integraciones/INTEGRACIONES#Supabase]]
- Google Maps: [[integraciones/INTEGRACIONES#Google Maps]]
