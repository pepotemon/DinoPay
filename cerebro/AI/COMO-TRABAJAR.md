---
tags: [AI, trabajo, documentacion, proceso]
created: 2026-07-24
updated: 2026-07-24
---

# Cómo Trabajar en DinoPay — Manual para IAs

[[INDEX|← Volver al Index]]

---

## Protocolo de Cada Sesión

### Al INICIAR una sesión de trabajo:
1. Leer `cerebro/INDEX.md` para entender el estado actual
2. Revisar `cerebro/roadmap/ROADMAP.md` para saber qué está pendiente
3. Revisar `cerebro/backlog/BACKLOG.md` para prioridades
4. Si hay un bug reportado, revisar `cerebro/bugs/BUGS.md`

### Al FINALIZAR cada sesión de trabajo:
1. ✅ Actualizar `INDEX.md` (estado del proyecto)
2. ✅ Actualizar `ARQUITECTURA.md` si cambió algo técnico
3. ✅ Actualizar la pantalla afectada en `funcionalidades/`
4. ✅ Registrar nuevas decisiones en `decisiones/`
5. ✅ Anotar bugs encontrados en `bugs/BUGS.md`
6. ✅ Agregar nuevas ideas en `ideas/IDEAS.md`
7. ✅ Actualizar `roadmap/ROADMAP.md`
8. ✅ Agregar entrada al `changelog/CHANGELOG.md`
9. ✅ Verificar que no haya links rotos en el cerebro

---

## Reglas de Documentación

### Siempre documentar el POR QUÉ, no solo el QUÉ
❌ Malo: "Se usa RLS para seguridad"
✅ Bueno: "Se usa RLS porque garantiza que una unidad no pueda acceder a los datos de otra unidad incluso si hay un bug en el frontend, sin necesidad de código adicional en la aplicación."

### Escribir para el lector futuro
Imagina que nadie recuerda nada de este proyecto en 2 años. ¿Entienden por qué se hizo algo?

### Nunca dejar páginas huérfanas
Toda página nueva debe estar enlazada desde algún lugar (ideally desde `INDEX.md` o desde páginas relacionadas).

### Actualizar si algo cambia
Si se cambia una regla de negocio o arquitectura, actualizar TODOS los documentos que la mencionan.

---

## Cómo Documentar un Bug

Ir a `bugs/BUGS.md` y agregar:
```markdown
## BUG-XXX: [Título corto]
**Fecha**: YYYY-MM-DD
**Síntoma**: Qué veía el usuario
**Causa**: Por qué ocurría
**Solución**: Cómo se resolvió
**Cómo evitarlo**: Qué práctica previene esto
**Archivos afectados**: Lista de archivos
```

---

## Cómo Documentar una Decisión Nueva

Ir a `decisiones/` y crear un archivo nuevo:
```markdown
# Decisión: [Título]
## Qué se decidió
## Por qué
## Alternativas evaluadas
## Riesgos
## Beneficios
## Fecha
```

---

## Cómo Agregar una Idea

Ir a `ideas/IDEAS.md` y agregar bajo la categoría correcta:
```markdown
### IDEA-XXX: [Título]
**Estado**: pendiente / en evaluación / aceptada / rechazada
**Descripción**: Qué es la idea
**Por qué es valiosa**: Qué problema resuelve
**Complejidad estimada**: baja / media / alta
```

---

## Qué Nunca Hacer

- ❌ Nunca borrar documentación sin crear un rastro (archivar o dejar nota)
- ❌ Nunca asumir que algo "está claro" sin documentarlo
- ❌ Nunca modificar la DB sin actualizar `BASE-DE-DATOS.md`
- ❌ Nunca agregar una pantalla sin crear su doc en `funcionalidades/`
- ❌ Nunca cambiar una regla de negocio sin actualizar `REGLAS.md`

---

## Ver También
- [[AI/GUIA-IA]] — Cómo entender el proyecto
- [[AI/REGLAS-CRITICAS]] — Qué nunca romper en el código
