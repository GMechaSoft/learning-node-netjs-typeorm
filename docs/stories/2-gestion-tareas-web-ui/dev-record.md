## Dev Agent Record — Dev-Rápido

### Debug Log

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| 1 | Lint | 3 warnings de ESLint provenían de `coverage/` (archivos generados por el reporte de cobertura, con `eslint-disable` no usados) | Excluido `coverage` en `eslint.config.js` (`globalIgnores`) y en `.gitignore`; lint quedó 0 errores / 0 warnings |

### Completion Notes

- ⚡ Dev-Rápido: UI web (SPA de una vista) para gestionar tareas: listado al cargar, crear, actualizar, cambiar estado y eliminar, con autenticación por token persistente (localStorage), validación de título sin llamar a la API y mensajes genéricos de error por código de respuesta (400/401/404/5xx/red). Consume la REST API de tareas de la HU #1 mediante un cliente HTTP tipado; la URL base es configurable por variable de entorno `VITE_API_BASE_URL`.
- 🧪 Cobertura QA: 16/16 (QA-01..QA-16 cubiertos por tests; 0 pendientes)

### File List

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Creado | `tareas-webui/package.json` (mod. desde scaffold) | Deps: react 19, react-dom; devDeps: typescript, vite, vitest, jsdom, testing-library, eslint (flat), prettier; scripts `lint`, `test`, `test:cov`, `build` |
| Creado | `tareas-webui/vite.config.ts` | Plugin react + base para `vite build`/`dev` |
| Creado | `tareas-webui/vitest.config.ts` | Vitest en entorno jsdom con `setup.ts` y cobertura v8 |
| Creado | `tareas-webui/eslint.config.js` | Flat config: recommended TS + react-hooks + react-refresh; ignora `dist` y `coverage` |
| Creado | `tareas-webui/tsconfig.json`, `tsconfig.app.json`, `tsconfig.node.json` | Strict TS para app y node |
| Creado | `tareas-webui/index.html`, `tareas-webui/public/`, `tareas-webui/.prettierrc`, `tareas-webui/.env.example`, `tareas-webui/README.md`, `tareas-webui/package-lock.json` | Scaffold Vite, convención singleQuote, ejemplo de `VITE_API_BASE_URL` |
| Modificado | `tareas-webui/.gitignore` | Añadido `coverage` |
| Creado | `tareas-webui/src/types/tarea.ts` | Contrato cliente de `Tarea` + `EstadoTarea` (redefinido leyendo el backend, frontera) |
| Creado | `tareas-webui/src/config/api-config.ts` | `API_BASE` desde `VITE_API_BASE_URL` con default `http://localhost:3000` |
| Creado | `tareas-webui/src/api/tareas.client.ts` | Cliente HTTP: GET/POST/PUT/DELETE `/api/tareas`, header Bearer, `ApiError` con mensaje genérico por código (400/401/404/5xx/red) |
| Creado | `tareas-webui/src/hooks/use-token.ts` | Token en estado + persistencia localStorage (guardar/reemplazar/limpiar, vacío = limpiar) |
| Creado | `tareas-webui/src/hooks/use-tareas.ts` | Hook CRUD: lista, carga con indicador, crear, actualizar, cambiar estado, eliminar, validación de título, mensajes de éxito/error |
| Creado | `tareas-webui/src/components/token-auth.tsx` + `.css` | Campo de autenticación: guardar/reemplazar/limpiar token |
| Creado | `tareas-webui/src/components/tarea-form.tsx` + `.css` | Formulario crear/editar: título obligatorio (trim), descripción opcional, botón deshabilitado en curso |
| Creado | `tareas-webui/src/components/tarea-item.tsx` + `.css` | Fila de tarea: título, descripción, selector de estado, editar, eliminar |
| Creado | `tareas-webui/src/components/tarea-list.tsx` + `.css` | Listado: estados "Cargando…" / vacío / error genérico / items |
| Creado | `tareas-webui/src/components/mensajes.tsx` + `.css` | Mensajes de éxito y error genéricos |
| Creado | `tareas-webui/src/App.tsx` + `App.css`, `index.css` | Composición de la vista única: auth + listado + formulario + mensajes |
| Creado | `tareas-webui/src/vite-env.d.ts` | Tipado de variables de entorno Vite |
| Creado | `tareas-webui/src/main.tsx` | Punto de entrada React |
| Creado | `tareas-webui/src/test/setup.ts` | Setup Vitest (jsdom + testing-library cleanup) |
| Creado | `tareas-webui/src/api/tareas.client.test.ts` | Tests del cliente: mapeo de errores por código + fetch/Bearer/códigos HTTP (QA-03..QA-06, QA-11..QA-16) |
| Creado | `tareas-webui/src/hooks/use-token.test.ts` | Persistencia de token (QA-07, QA-08) |
| Creado | `tareas-webui/src/hooks/use-tareas.test.ts` | Hook CRUD + validación + errores (QA-01..QA-16) |
| Creado | `tareas-webui/src/components/tarea-form.test.tsx` | Validación de título crear/editar + botón deshabilitado (QA-09, QA-10, QA-16) |
| Creado | `tareas-webui/src/App.test.tsx` | Integración render: listado, vacío, 401, red, sin token (QA-01, QA-02, QA-07, QA-11, QA-14) |
| Modificado | `docs/stories/2-gestion-tareas-web-ui/refinamiento.md` | 17/17 tareas marcadas completadas |

### Métricas Dev-Rápido

- Tiempo sesión IA: 41 min
- Tareas manuales DoD: 0 min
- Tiempo total: 41 min

### Verificación Final

- Lint: 0 errores / 0 warnings
- Tests: 43/43 pasando (5 archivos)
- Cobertura: 81% statements / 71% branches
- Build: OK (`dist` 228.73 kB, gzip 71.34 kB)

### Medición

- Medición CFP/PNF **diferida al cierre** (`step-03b`): el prelude devolvió `STRATEGY_NOT_APPROVED` (no existe `docs/cosmic/measurement-strategy.json` aprobada). `preparacion_lanzada = false`, `step-02d` omitido por su compuerta.
