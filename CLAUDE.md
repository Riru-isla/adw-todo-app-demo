# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Full-stack todo list app: Rails 8.1 API backend + React 18 / Vite 6 frontend, with PostgreSQL 16 in Docker.

## Development Environment

Use the custom slash commands to manage the dev environment:

- `/env:start` — setup + start everything (infra, backend, frontend)
- `/env:stop` — stop servers (add `--infra` to also stop Docker)
- `/env:restart` — full restart
- `/infra:up` / `/infra:down` / `/infra:restart` — manage PostgreSQL container only

## Common Commands

### Backend (run from `backend/`)

```bash
bin/rails server                     # Start dev server (port 3000)
bin/rails test                       # Run all tests
bin/rails test test/models/task_test.rb              # Run a single test file
bin/rails test test/models/task_test.rb:10           # Run a single test by line
bin/rails db:create db:migrate       # Create and migrate database
bin/rails db:test:prepare            # Prepare test database
bin/rubocop                          # Lint (Rails Omakase style)
bin/brakeman --no-pager              # Security analysis
```

### Frontend (run from `frontend/`)

```bash
npm run dev           # Start Vite dev server (port 5173)
npm run test          # Run all Vitest tests
npm run test -- --run src/__tests__/App.test.jsx   # Run a single test file
npm run build         # Production build
```

## Architecture

### Backend — Rails API-only (`backend/`)

- Single resource: `Task` (title:string, completed:boolean)
- API namespace: all routes under `/api/` — `resources :tasks, only: [:index, :create, :update, :destroy]`
- Controller: `Api::TasksController` inherits from `ApplicationController < ActionController::API`
- Error pattern: `rescue_from ActiveRecord::RecordNotFound` returns `{ error: "..." }` with 404; validation failures return `{ errors: [...] }` with 422
- CORS: allows requests from `http://localhost:5173`
- Database: PostgreSQL via Docker Compose (`backend/docker-compose.yml`), databases named `aurgi_sample_app_development` / `aurgi_sample_app_test`

### Frontend — React 18 + Vite (`frontend/`)

- Component tree: `App` → `TaskForm` + `TaskList` → `TaskItem`
- API layer: `src/services/api.js` — all fetch calls to `http://localhost:3000/api`
- No routing library or state management library; state lives in `App` via `useState`/`useEffect`
- UI is in Spanish (labels, placeholders, empty-state messages)

### Test Patterns

**Backend (Minitest):** integration tests using `ActionDispatch::IntegrationTest`, fixtures in `test/fixtures/tasks.yml`, parallel test execution enabled.

**Frontend (Vitest + React Testing Library):** API calls mocked via `vi.mock('../services/api')`, globals enabled (no need to import `test`/`expect`/`vi`), jsdom environment configured in `vite.config.js`.
