# Feature: Confirmación de Eliminación de Tarea

**ADW ID:** 2
**Fecha:** 2026-03-04
**Especificacion:** adws/.issues/2/plan.md

## Overview

Se añadió un diálogo de confirmación nativo HTML antes de eliminar una tarea. El objetivo es prevenir eliminaciones accidentales al requerir que el usuario confirme explícitamente la acción antes de que se ejecute.

## Que se Construyo

- Diálogo de confirmación modal inline dentro de cada `TaskItem`
- Botón "Cancelar" que cierra el diálogo sin eliminar
- Botón "Eliminar" dentro del diálogo que confirma y ejecuta la eliminación
- Estilos CSS para el diálogo (backdrop oscuro, sombra, layout de botones)
- Tests unitarios cubriendo apertura del diálogo, confirmación y cancelación

## Implementacion Tecnica

### Ficheros Modificados

- `frontend/src/components/TaskItem.jsx`: Añadido `useRef` para referenciar el `<dialog>` nativo; el botón "Eliminar" ahora llama a `showModal()` en lugar de `onDelete` directamente; añadido elemento `<dialog>` con botones de confirmación y cancelación
- `frontend/src/__tests__/TaskItem.test.jsx`: Mockeados `HTMLDialogElement.prototype.showModal` y `.close`; actualizados tests existentes y añadidos 3 nuevos tests para el flujo de confirmación
- `frontend/src/index.css`: Añadidos estilos para `.confirm-dialog`, `.confirm-dialog::backdrop`, `.confirm-dialog p`, `.confirm-dialog-actions` y `.btn-cancel`

### Cambios Clave

- Se usa el elemento `<dialog>` nativo de HTML (no librería externa), que ofrece accesibilidad incorporada: manejo de foco, cierre con tecla Escape y `aria-modal` automático
- La referencia al diálogo se gestiona con `useRef(null)`, manteniendo el componente como función pura sin estado adicional
- El botón de confirmación llama a `onDelete(task.id)` y `dialogRef.current.close()` en el mismo handler
- Cada `TaskItem` tiene su propio `<dialog>` independiente, sin conflicto entre múltiples tareas
- No se requieren cambios en el backend ni nuevas dependencias

## Como Usar

1. En la lista de tareas, hacer clic en el botón **"Eliminar"** de una tarea
2. Aparece un diálogo modal con el mensaje "¿Estás seguro de que deseas eliminar esta tarea?"
3. Hacer clic en **"Cancelar"** para cerrar el diálogo sin eliminar la tarea
4. Hacer clic en **"Eliminar"** dentro del diálogo para confirmar y eliminar la tarea
5. Presionar **Escape** también cierra el diálogo sin eliminar (comportamiento nativo)

## Configuracion

No se requiere configuración adicional. La funcionalidad es puramente frontend y no requiere variables de entorno ni cambios en el backend.

## Testing

```bash
# Ejecutar tests del frontend
cd frontend && npm test -- --run

# Tests relevantes en TaskItem.test.jsx:
# - "shows confirmation dialog when delete is clicked"
# - "calls onDelete when confirmation is accepted"
# - "does not call onDelete when confirmation is cancelled"
```

Los mocks de `HTMLDialogElement.prototype.showModal` y `.close` están configurados en `beforeAll` ya que jsdom no implementa estos métodos nativamente.

## Notas

- El backdrop del diálogo nativo no cierra el modal al hacer clic fuera (comportamiento por defecto de `<dialog>`), lo cual es intencionalmente seguro para evitar cierres accidentales
- La tecla Escape cierra el diálogo sin eliminar por comportamiento nativo del elemento `<dialog>`
- No se modificó `App.test.jsx` a pesar de estar en el plan original; los tests de integración en ese fichero no requirieron cambios
