# Feature: Action Cable para Broadcasting de Tareas en Tiempo Real

**ADW ID:** 4
**Fecha:** 2026-03-05
**Especificacion:** .issues/4/plan.md

## Overview

Se integró Action Cable (WebSockets) en la aplicación para emitir broadcasts en tiempo real cada vez que una tarea se crea o actualiza. Múltiples clientes conectados reciben actualizaciones instantáneas sin necesidad de refrescar la página, habilitando una experiencia colaborativa.

## Que se Construyo

- Canal `TasksChannel` en el backend que permite suscripción al stream `"tasks"`
- Broadcasts automáticos desde `TasksController` al crear y actualizar tareas
- Consumer de Action Cable en el frontend (`cable.js`) conectado a `ws://localhost:3000/cable`
- Suscripción reactiva en `App.jsx` que actualiza el estado de React al recibir broadcasts
- Tests completos en frontend para verificar el comportamiento del canal

## Implementacion Tecnica

### Ficheros Modificados

- `backend/config/application.rb`: Habilitado `require "action_cable/engine"` (estaba comentado)
- `backend/config/routes.rb`: Montado `ActionCable.server => '/cable'`
- `backend/config/environments/development.rb`: Configurado `allowed_request_origins` para permitir WebSocket desde `localhost:5173`
- `backend/app/controllers/api/tasks_controller.rb`: Añadidos broadcasts en `#create` y `#update`
- `frontend/package.json`: Añadida dependencia `@rails/actioncable`
- `frontend/src/App.jsx`: Importado consumer y añadido `useEffect` con suscripción al canal
- `frontend/src/__tests__/App.test.jsx`: Añadido mock de `@rails/actioncable` y 3 nuevos tests

### Ficheros Nuevos

- `backend/app/channels/application_cable/connection.rb`: Clase base de conexión Action Cable
- `backend/app/channels/application_cable/channel.rb`: Clase base de canal
- `backend/app/channels/tasks_channel.rb`: Canal que hace stream desde `"tasks"`
- `backend/config/cable.yml`: Adaptador `async` para dev/test, `redis` para producción
- `backend/test/channels/tasks_channel_test.rb`: Tests del canal
- `frontend/src/services/cable.js`: Consumer de Action Cable exportado como singleton

### Cambios Clave

1. **Broadcast en el controlador**: Se usa el patrón de broadcast explícito desde el controlador (no callbacks del modelo) con `ActionCable.server.broadcast("tasks", { action: "created"|"updated", task: task.as_json })`
2. **Deduplicación en el frontend**: Al recibir un broadcast `created`, se verifica `prev.some(t => t.id === data.task.id)` para evitar duplicados cuando el mismo cliente crea la tarea (actualización optimista + broadcast)
3. **Limpieza de suscripción**: El `useEffect` retorna `() => subscription.unsubscribe()` para limpiar al desmontar el componente
4. **Origen permitido configurable**: La configuración de `allowed_request_origins` usa `ENV.fetch('CORS_ORIGIN', 'http://localhost:5173')` para flexibilidad entre entornos

## Como Usar

1. Arrancar el backend normalmente (`bin/rails server` — Action Cable se sirve en el mismo puerto 3000 bajo `/cable`)
2. Abrir la aplicación en dos ventanas del navegador apuntando a `http://localhost:5173`
3. Crear o completar una tarea en una ventana — la otra se actualizará automáticamente sin recargar

## Configuracion

- **Variable de entorno `CORS_ORIGIN`**: Controla el origen permitido para conexiones WebSocket en desarrollo. Por defecto: `http://localhost:5173`
- **`cable.yml`**: Adaptador `async` para desarrollo/test (no requiere Redis). Cambiar a `redis` en producción configurando `REDIS_URL`
- **Endpoint WebSocket**: `ws://localhost:3000/cable` (configurable en `frontend/src/services/cable.js` via `VITE_API_BASE_URL`)

## Testing

```bash
# Backend: tests del canal y tests de integración del controlador
cd backend && bin/rails test test/channels/tasks_channel_test.rb
cd backend && bin/rails test test/controllers/api/tasks_controller_test.rb

# Frontend: incluye 3 nuevos tests de Action Cable
cd frontend && npm test
```

Los nuevos tests del frontend verifican:
- Que se crea la suscripción a `TasksChannel` al montar el componente
- Que un broadcast `created` añade la tarea a la lista (sin duplicados)
- Que un broadcast `updated` actualiza la tarea existente en la lista

## Notas

- Action Cable viene incluido en Rails; solo requería descomentar una línea en `application.rb`
- El adaptador `async` funciona en un solo proceso y no escala horizontalmente — usar Redis en producción con múltiples workers
- Si se añaden operaciones de `destroy` en el futuro, considerar añadir broadcast con `action: "deleted"` siguiendo el mismo patrón
