## Dev Agent Record — Dev-Rápido

### Debug Log

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| 1 | tooling | `npx expo install -- --save-dev …` rechaza la bandera (`CommandError: Unexpected: --save-dev`) | Instalar sin `--save-dev` (`npx expo install vitest jsdom @testing-library/jest-dom`) y mover las deps a `devDependencies` en `package.json` |
| 2 | dependencias | `react-test-renderer@19.3.0` exige `react@^19.3.0` pero el proyecto tiene `react@19.2.3` (peer conflict) | `npm install --save-dev react-test-renderer@19.2.3` (peers `react@^19.2.3`) + `@types/react-test-renderer@19.1.0` (19.2.0 no existe en registry) |
| 3 | test | `TypeError: act is not a function` (10 tests) — se importaba `act` de `vitest` | `import { act } from 'react'` en `use-tareas.test.ts` |
| 4 | test | Mock de fetch sin efecto: los tests asignaban `fetchMock` local pero nunca `globalThis.fetch`, así que el hook ejecutaba el fetch real (jsdom) | `beforeEach` por describe: `fetchMock = vi.fn(); globalThis.fetch = fetchMock as unknown as typeof fetch` + quitar las reasignaciones `fetchMock = vi.fn()` dentro de cada `it` (rompían el enlace con `globalThis.fetch`) |
| 5 | typecheck | Errores TS en tests: `result.current` posiblemente null y `globalThis.fetch = undefined` no assignable | `test-utils.tsx`: `result: { current: T }` (garantizado tras `act` de montaje) y restaurar el fetch original guardado en constante de módulo |
| 6 | typecheck | `expo-env.d.ts` gitignored y ausente en clonos frescos → `Cannot find module '*.module.css'` / side-effect import `@/global.css` (archivos de la plantilla) | `src/types/css.d.ts` con `declare module '*.module.css'` y `declare module '*.css'` |
| 7 | lint | `react-hooks/set-state-in-effect` en `use-tareas.ts` (`void autenticar()` síncrono en el cuerpo del efecto) | Diferir la autenticación a un microtask (`Promise.resolve().then(…)`) con flag `activo` de limpieza — la autenticación es asíncrona, los setState ya ocurrían tras el primer await |
| 8 | lint | `react-hooks/set-state-in-effect` en `use-color-scheme.web.ts` (código de plantilla: `setHasHydrated(true)` en el efecto) | `requestAnimationFrame` para el `setHasHydrated(true)` (mismo comportamiento de hidratación, setState en callback) |
| 9 | tooling | `expo lint` fallaba en el primer run (`Cannot find module 'eslint'`): el comando instala eslint-config-expo en la misma ejecución que lintea | Segundo run de `npx expo lint` con eslint ya instalado → 0 errores |
| 10 | infra | VFS de Método Ceiba (`metodoceiba-vfs:…`) no ejecutable con `node` directamente | Resolver el respaldo físico: `node ".ceiba-metodo\metodo-ceiba\medicion\preparar-medicion-cli.mjs" prelude …` (misma salida: exit 3 `STRATEGY_NOT_APPROVED`) |

### Completion Notes

- ⚡ Dev-Rápido: Demo móvil de tareas (HU #4, 9 ACs) en React Native 0.86 + Expo SDK 57 + TypeScript — una sola vista (Expo Router `Stack`), CRUD completo contra la web API existente, **autenticación JWT automática** (usuario fijo `demo`, sin login ni persistencia; re-emisión de token ante 401) y **puerto de la API configurable** por `EXPO_PUBLIC_API_BASE_URL` (default `http://localhost:3000`). Espejo móvil de la webui (HU #2) sin tocar el backend.
- 🧪 Cobertura QA: 14/14 — QA-01..QA-10 y QA-11..QA-13 con tests de `use-tareas.test.ts` / `tareas.client.test.ts` / `auth.client.test.ts` (28 tests, 100% pasando); QA-01/02/03/04/05/06/07 verificados en vivo en el navegador (demo web de Expo) y **QA-14 verificado en vivo con evidencia de red**: con la API del puerto 3000 detenida, el demo con `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000` (`.env.local`, gitignored) creó y eliminó una tarea contra `http://localhost:4000/api/tareas`.
- Verificación técnica: `npx tsc --noEmit` sin errores, `npx expo lint` sin errores, `npm run test` 28/28.
- Medición: prelude `HALT` (exit 3) con `STRATEGY_NOT_APPROVED` — no existe `docs/cosmic/measurement-strategy.json` aprobada. Degradación limpia: `cosmic_vigencia`/`pnf_vigencia` = `SIN_MEDICION`; la medición COSMIC/PNF queda pendiente de `/ceiba-generar-strategy` (igual que HU #1 y #2).

### File List

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Modificado | `tareas-mobileui/src/app/_layout.tsx` | T1: `Stack` con la sola pantalla `index` (sin header); conserva `SafeAreaProvider`, `ThemeProvider` (expo-router), splash y `AnimatedSplashOverlay` |
| Eliminado | `tareas-mobileui/src/app/explore.tsx` | T1: navegación de la plantilla fuera de alcance de la HU |
| Eliminado | `tareas-mobileui/src/components/app-tabs.tsx`, `app-tabs.web.tsx` | T1: pestañas de la plantilla |
| Creado | `tareas-mobileui/src/config/api-config.ts` | T2: `API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'` + `DEMO_USER = 'demo'` |
| Creado | `tareas-mobileui/.env.example` | T2: documenta `EXPO_PUBLIC_API_BASE_URL` |
| Creado | `tareas-mobileui/src/types/tarea.ts` | T3: `EstadoTarea`, `Tarea`, `CrearTareaDto`, `ActualizarTareaDto` |
| Creado | `tareas-mobileui/src/api/tareas.client.ts` | T4: `listarTareas/crearTarea/actualizarTarea/eliminarTarea` (fetch + Bearer + 204), `ApiError` (status `number\|'red'`), `mapearError` (400/401/404/5xx/red) |
| Creado | `tareas-mobileui/src/api/auth.client.ts` | T4: `emitirToken(usuario)` contra `POST /api/auth/token` (sin Bearer) |
| Creado | `tareas-mobileui/src/hooks/use-tareas.ts` | T5: `useTareas` — auth automática al montar (emite con `demo`, carga listado), `ejecutarConToken` con re-emisión una vez ante 401, `crear/actualizar/cambiarEstado/eliminar` con validación de título antes de la API, mensajes de éxito/validación/error, reintento de autenticación |
| Creado | `tareas-mobileui/src/components/mensajes.tsx` | T6: banner de mensajes temado (exito/validacion/error) |
| Creado | `tareas-mobileui/src/components/tarea-form.tsx` | T7: formulario crear/editar (título obligatorio + descripción opcional), testIDs `tarea-form-*` |
| Creado | `tareas-mobileui/src/components/tarea-item.tsx` | T8: tarjeta de tarea (título, badge de estado, descripción, acciones editar/estado/eliminar), testIDs `tarea-*` |
| Creado | `tareas-mobileui/src/app/index.tsx` | T9: `HomeScreen` — estados `autenticando`/`authError` (con botón Reintentar) y vista normal (formulario + listado, estado vacío) |
| Creado | `tareas-mobileui/vitest.config.mts` | T10: Vitest 5 + jsdom, alias `@/` → `src/`, setup `jest-dom`, cobertura v8 |
| Creado | `tareas-mobileui/src/test/setup.ts` | T10: `@testing-library/jest-dom/vitest` |
| Creado | `tareas-mobileui/src/test/test-utils.tsx` | T10: `renderHook` (react-test-renderer, compatible RN 0.86 — RTL no soporta RN) + `respuestaJson` |
| Creado | `tareas-mobileui/src/api/tareas.client.test.ts` | T11: 13 tests — `mapearError` (QA-11 400, QA-12 5xx, QA-13 red, 404), CRUD (métodos/payloads/Bearer/204), URL base por env (QA-14) y default |
| Creado | `tareas-mobileui/src/api/auth.client.test.ts` | T11: 5 tests — contrato `POST /api/auth/token` (sin Bearer, body `{usuario}`), URL por env, 400, red |
| Creado | `tareas-mobileui/src/hooks/use-tareas.test.ts` | T12: 10 tests — QA-01..QA-10 (auth automática, CRUD, validación sin llamar a la API, error de red + reintento, re-emisión ante 401) |
| Creado | `tareas-mobileui/src/types/css.d.ts` | T13: declaraciones para imports de CSS (módulos + side-effect) mientras `expo-env.d.ts` (gitignored) no existe |
| Modificado | `tareas-mobileui/src/hooks/use-color-scheme.web.ts` | T13: hidratación vía `requestAnimationFrame` (lint `set-state-in-effect`) |
| Modificado | `tareas-mobileui/package.json` | T10: deps de test en `devDependencies` (`vitest`, `jsdom`, `@testing-library/jest-dom`, `react-test-renderer@19.2.3`, `@types/react-test-renderer@19.1.0`), scripts `test`/`test:watch` |
| Creado | `docs/stories/4-demo-tareas-mobile/dev-record.md` | Cierre: este registro |

### Métricas Dev-Rápido

- Tiempo sesión IA: 48 min
- Tareas manuales DoD: 0 min
- Tiempo total: 48 min
