---
tags: [preguntas, decisiones, pendiente, abierto]
created: 2026-07-24
updated: 2026-07-24
---

# Preguntas Abiertas — DinoPay

[[INDEX|← Volver al Index]]

> Decisiones que aún no están resueltas. Deben resolverse antes de implementar la funcionalidad relacionada.

---

## Alta Prioridad (bloquean desarrollo)

### Q-001: Cliente duplicado por NIT
**Pregunta**: Si una unidad intenta crear un cliente con el mismo NIT que ya existe en su cartera, ¿se bloquea el registro o se alerta pero permite continuar?
**Contexto**: Dos personas pueden tener documentos similares, o puede ser un error de tipeo.
**Opciones**:
- A) Bloquear: no se puede crear si el NIT ya existe → más seguro pero puede frustrar al usuario
- B) Alertar: mostrar un warning y dejar que el usuario decida → más flexible
- C) No verificar: ignorar duplicados → más simple pero arriesga duplicados de datos
**Afecta**: [[funcionalidades/PANTALLA-NUEVO]]

### Q-002: ¿Qué pasa si se borra el único préstamo activo de una unidad?
**Pregunta**: Si el admin cancela el único préstamo activo de un cliente, ¿el cliente aparece automáticamente en Disponibles?
**Contexto**: Un préstamo cancelado no es lo mismo que completado. El cliente no "terminó de pagar".
**Opciones**:
- A) Sí → aparece en Disponibles como cualquier otro cliente sin préstamo
- B) No → queda "oculto" con estado especial "cancelado"
**Afecta**: [[modulos/ADMINISTRADOR]], [[funcionalidades/PANTALLA-CLIENTES-DISPONIBLES]]

---

## Media Prioridad

### Q-003: Auto-guardado en Enrutar Clientes
**Pregunta**: ¿La ruta se guarda automáticamente después de cada movimiento, o solo cuando el usuario presiona "Guardar"?
**Contexto**: Auto-guardar es más cómodo pero puede generar muchos writes a la DB.
**Opciones**:
- A) Guardar manual con botón → el usuario tiene control explícito
- B) Auto-guardar con debounce (1-2 segundos) → UX más fluida
**Afecta**: [[funcionalidades/PANTALLA-ENRUTAR]]

### Q-004: ¿Puede la unidad ver su capital actual?
**Pregunta**: ¿La unidad puede ver cuánto capital tiene disponible (caja actual), o solo el admin?
**Contexto**: Puede ser útil para que la unidad sepa cuánto dinero puede prestar, pero también puede generar confusiones.
**Afecta**: [[modulos/UNIDAD]], [[funcionalidades/PANTALLA-REPORTE-DIARIO]]

### Q-005: Categorías de gastos — ¿Globales o por unidad?
**Pregunta**: ¿Las categorías de gastos son globales (todas las unidades usan las mismas) o el admin puede configurar categorías diferentes para cada unidad?
**Afecta**: [[funcionalidades/PANTALLA-GASTOS]], [[modulos/ADMINISTRADOR]]

### Q-006: ¿Cuántos días puede eliminar un pago?
**Pregunta**: El campo `dias_bloqueados_eliminacion` en `units` — ¿es el número de días DESPUÉS del pago en que NO se puede eliminar, o el número de días DENTRO del cual SÍ se puede eliminar?
**Necesita clarificación del usuario.**
**Afecta**: [[reglas-de-negocio/REGLAS#R-PAG-05]]

---

## Baja Prioridad

### Q-007: ¿Qué incluye el botón "Copiar" de la tarjeta?
**Pregunta**: Al presionar "Copiar" en la tarjeta de préstamo, ¿se copia como texto o como imagen? Y si es imagen, ¿qué información exactamente incluye?
**Opciones**:
- A) Texto formateado para pegar en WhatsApp
- B) Imagen generada con `html2canvas` con el estado visual del préstamo
**Afecta**: [[funcionalidades/PANTALLA-PRESTAMOS]]

### Q-008: Historial de préstamos del admin — ¿Cuánto puede ver?
**Pregunta**: Cuando el admin ve el historial de una unidad, ¿puede ver todos los préstamos desde el inicio, o solo los últimos X meses?
**Afecta**: [[modulos/ADMINISTRADOR]]

### Q-009: Días laborales y cuota de hoy
**Pregunta**: Si hoy es un día no laboral (ej: domingo), ¿los préstamos de modalidad diaria no aparecen en la pantalla de Préstamos, o aparecen pero sin cuota?
**Afecta**: [[funcionalidades/PANTALLA-PRESTAMOS]], [[reglas-de-negocio/REGLAS#R-PAG-01]]

---

## Resueltas

*(Sin preguntas resueltas aún — proyecto en inicio)*

---

## Ver También
- [[reglas-de-negocio/REGLAS]] — Reglas ya definidas
- [[roadmap/ROADMAP]] — Para saber qué funcionalidades están próximas
