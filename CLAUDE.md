# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Electron dev server (opens desktop window)
npm run build     # Build production Electron app
npm run lint      # ESLint on src/ and src-electron/
npm run format    # Prettier (auto-fix)
```

There are no tests configured. Type-check with:

```bash
npx vue-tsc --noEmit
```

Python solver setup (required for the optimization feature):

```bash
./scripts/install-python-env.sh   # Create .venv and install requirements
./scripts/build-python-app.sh     # Compile Python to standalone executable
```

## Architecture

This is a **Quasar (Vue 3) + Electron** desktop app for planning hot-air balloon flights. It has four distinct source
roots:

### `src/` — Vue/Quasar frontend

- **Pages** (`pages/`): Route-level components. `FlightPage.vue` is the main workspace.
- **Stores** (`stores/`): Pinia stores. `flight.ts` is the core store holding balloons, cars, people, and flight
  assignments.
- **Composables** (`composables/`): Business logic extracted from components. `flightOperations.ts` handles
  adding/editing/removing entities; `solver.ts` wraps IPC calls to the Python solver.
- **Components** (`components/`): Organized into `dialog/`, `drag/`, `panels/`, `steps/`, `toolbar/`.

### `src-common/` — Shared types and IPC contracts

Contains TypeScript interfaces (`entities.ts`) and typed API descriptors (`api/*.api.ts`) shared between the renderer
and main process. **This is the single source of truth for all data shapes and IPC channel names.** When adding a new
IPC call, define it here first.

### `src-electron/` — Electron main and preload

- `electron-main.ts`: App entry point; registers all IPC handlers.
- `electron-preload.ts`: Exposes typed API to renderer via `contextBridge`.
- Each `*API/` subdirectory implements one API surface from `src-common/api/`.
- `projectsAPI/migrations.ts`: Handles data migrations when the project file format changes.

### `src-python/` — Optimization solver

A standalone Python process called as a subprocess by `src-electron/solverAPI/`. Input/output is JSON over stdin/stdout.
The solver assigns people and vehicles to balloon flights. It is compiled to a single executable by
`build-python-app.sh` for distribution.

## IPC Pattern

Communication between renderer and main process follows a consistent pattern:

1. `src-common/api/*.api.ts` defines the channel name and TypeScript types.
2. `src-electron/electron-preload.ts` bridges it via `contextBridge.exposeInMainWorld`.
3. `src/composables/windowAPI.ts` (or similar) calls the exposed API from the renderer.
4. `src-electron/*API/` registers the `ipcMain.handle` handler.

## Key Configuration

- `quasar.config.ts`: Vite + Electron builder config. Electron entry/preload paths, CSS auto-imports, and build targets
  are all here.
- `tsconfig.json`: Strict mode + `noUncheckedIndexedAccess` enabled.
- `eslint.config.js`: Flat config; Vue 3 + TypeScript strict rules + Prettier. Runs on `src/**/*.{ts,vue}` and
  `src-electron/**/*.ts`.
- `.prettierrc`: Single quotes, semicolons, `singleAttributePerLine: true`.
