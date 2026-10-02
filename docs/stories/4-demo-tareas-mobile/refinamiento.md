# Refinamiento — Historia #4: Demo móvil de tareas (React Native + Expo)

## Plan

**Arquitectura:** app Expo Router de una sola vista (React Native + TypeScript) en `tareas-mobileui` (plantilla Expo SDK 57 ya inicializada), patrón "cliente fino + custom hook de estado + componentes presentacionales temados" — espejo móvil de la HU #2 (`tareas-webui`). Mantiene las convenciones del proyecto: archivos kebab-case, componentes PascalCase, `async/await` end-to-end, sin librerías de UI externas (design system de la plantilla: `ThemedText`/`ThemedView` + tokens de `@/constants/theme`). La app solo consume el contrato HTTP de la API ya entregada; NO toca el código del backend.

**Diferencias respecto a la webui (decididas en la HU):**
- **Auth automática**: sin login ni persistencia — al montar, `useTareas` emite el token sola con `POST /api/auth/token` (usuario fijo `demo`); ante un `401` re-emite una vez y repite la acción.
- **Config de endpoint**: variable de entorno **`EXPO_PUBLIC_API_BASE_URL`** (Expo inyecta `process.env.EXPO_PUBLIC_*` en el bundle) con default `http://localhost:3000` (la webui usa `import.meta.env.VITE_*`).
- **Vista única**: se elimina la navegación por pestañas de la plantilla (`app-tabs` + `explore`); el layout queda en un `Stack` con la sola pantalla `index`.

**Contrato de API consumido** (extraído de `tareas-webapi/src/modules/tareas/api/tareas.controller.ts` + `auth.controller.ts` + `tarea.entity.ts` + DTOs):
- Base: `{API_BASE_URL}/api/tareas` · `{API_BASE_URL}/api/auth/token` (prefix global `api`, CORS habilitado en `main.ts`)
- `POST /api/auth/token` → `200 { token }` (pública; `400` usuario vacío) · `GET /api/tareas` → `200 Tarea[]` · `POST` → `201 Tarea` · `PUT /:id` → `200 Tarea` · `DELETE /:id` → `204`
- Errores: `400` (datos inválidos) · `401` (token ausente/inválido) · `5xx` (servidor) · red (API inaccesible)
- `Tarea = { id: number; titulo: string; descripcion: string | null; estado: 'pendiente' | 'completada'; creadaEn: string }`

**Pasos**
1. Simplificar el layout a una sola vista (Stack + index; borrar tabs/explore) — capa: `src/app` — referencia: plantilla Expo Router (`_layout.tsx`, `app-tabs.tsx`)
2. Config de entorno + tipos de dominio — capa: `src/config`, `src/types` — referencia: `tareas-webui/src/config/api-config.ts` + `tarea.entity.ts`
3. Cliente HTTP fino de tareas + auth (`ApiError` + `mapearError` + `emitirToken`) — capa: `src/api` — referencia: `tareas-webui/src/api/tareas.client.ts` + `auth.client.ts`
4. Custom hook `useTareas` con autenticación automática y re-emisión ante 401 — capa: `src/hooks` — referencia: `tareas-webui/src/hooks/use-tareas.ts` + `use-usuario.ts`
5. Componentes presentacionales (`TareaForm`, `TareaItem`, `Mensajes` + pantalla `index`) — capa: `src/components`, `src/app` — referencia: `tareas-webui/src/components/*` + `guia-react-mobile.md` §2-5
6. Tests (Vitest + jest-dom + react-test-renderer, fetch mockeado) — capa: `src/**` — referencia: `qa.md` QA-01..QA-14
7. Verificación: lint + typecheck + tests + arranque del demo — capa: raíz — referencia: `AGENTS.md` (comandos)

**Archivos relevantes**
- `tareas-webui/src/api/tareas.client.ts` + `auth.client.ts` — referencia: estructura del cliente fino (fetch, `ApiError`, `mapearError` por código)
- `tareas-webui/src/hooks/use-tareas.ts` + `use-usuario.ts` — referencia: máquina de estados de la vista (listado, mutaciones, mensajes, validación de título) y flujo de emisión de token
- `tareas-webui/src/types/tarea.ts` — referencia: tipos del dominio lado consumidor
- `tareas-webapi/src/modules/auth/api/auth.controller.ts` — referencia: contrato de `POST /auth/token` (pública, `{ usuario }` → `{ token }`)
- `tareas-mobileui/src/components/themed-text.tsx` / `themed-view.tsx` + `src/constants/theme.ts` — referencia: design system de la plantilla a reutilizar (tipos, colores, Spacing)
- `tareas-mobileui/src/app/_layout.tsx` + `app-tabs.tsx` — referencia: layout de la plantilla que se simplifica
- `tareas-mobileui/AGENTS.md` — referencia: reglas del proyecto (Expo Router, `npx expo install`, lint + typecheck obligatorios)
- `docs/architecture/coding-standards.md` — referencia: nomenclatura, async/await, convención de tests

**Reutilización**
- `tareas-webapi` (backend) — se **consume** (no se modifica): contrato HTTP/JSON + auth de desarrollo
- Design system de la plantilla (`ThemedText`, `ThemedView`, `Spacing`, `useTheme`, `SafeAreaView`) — se **reutiliza** en `TareaForm`/`TareaItem`/`Mensajes` y la pantalla
- Contrato `Tarea`/DTOs/códigos de error — se **redefine en cliente** leyendo el backend (igual que webui; no se importa Node)
- `src/api/tareas.client.ts` + `auth.client.ts` — se **crean** (adaptando `tareas-webui/src/api/*` al contexto RN: no hay `import.meta.env`; se usa `process.env.EXPO_PUBLIC_*`)
- `src/hooks/use-tareas.ts` — se **crea** (fusión de `use-tareas` + `use-usuario` de webui con la variante de auth automática)
- Framework de tests — se **crea** (Vitest + jsdom): `tareas-mobileui` no tiene stack de tests; `tareas-webui` usa Vitest+Testing Library pero React Testing Library no soporta React Native en SDK 57 → se usa `react-test-renderer` (soportado por RN 0.86) + `@testing-library/jest-dom` para los asserts de cliente puro

**Checklist**
☑ Feature análoga leída completa (webui: client, hooks, types, App; backend: tareas + auth controllers, entity, DTOs, main) | ☑ TODOS los artefactos identificados (contrato API + config Expo + design system + AGENTS.md) | ☑ Respeta arquitectura (solo consumidor HTTP; sin tocar backend; capas cliente→hook→componentes) | ☑ Inventario de reutilización hecho | ☑ Casos Alta de `qa.md` cubiertos por tests (QA-01..QA-11, QA-13, QA-14) — los restantes son manuales en el arranque del demo (verificación T16)

---

## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-10-01

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| `tareas-webapi` (backend) | Se consume (no se modifica) | Contrato HTTP/JSON + Bearer JWT + `POST /auth/token` pública |
| `tareas-mobileui/` (plantilla Expo) | Se reutiliza (ya inicializada) | Scaffold, Expo Router, design system, theme y safe-area listos |
| `ThemedText`/`ThemedView`/`Spacing`/`useTheme` | Se reutilizan | Design system de la plantilla para todos los componentes nuevos |
| `src/config/api-config.ts` | Se crea | `EXPO_PUBLIC_API_BASE_URL` (defecto `http://localhost:3000`) — la webui usa `VITE_*` (Vite), Expo inyecta `process.env.EXPO_PUBLIC_*` |
| `src/api/tareas.client.ts` + `auth.client.ts` | Se crean | Adaptados de `tareas-webui/src/api/*` al contexto RN (mismo `ApiError`/`mapearError`) |
| `src/hooks/use-tareas.ts` | Se crea | Fusión de `use-tareas` + `use-usuario` de webui + auth automática (emitir al montar, re-emitir ante 401) |
| `src/components/tarea-form.tsx`, `tarea-item.tsx`, `mensajes.tsx` | Se crean | Equivalente móvil de `tarea-form`/`tarea-item`/`mensajes` de webui, con el design system de la plantilla |
| Stack de tests (Vitest + jsdom + react-test-renderer) | Se crea | `tareas-mobileui` no tiene tests; RTL soportado no aplica a RN 0.86/SDK 57 |
| Pestañas de la plantilla (`app-tabs`, `explore`) | Se eliminan | La HU declara una única vista; el layout pasa a `Stack` con `index` |

### Tareas de Implementación

#### Fase 1 — Layout de una sola vista
- [ ] **T1: Layout en Stack + borrar navegación por pestañas** — `src/app/_layout.tsx` (Base: plantilla Expo Router + `AGENTS.md`) → `Stack` con la sola pantalla `index`; eliminar `src/app/explore.tsx` y `src/components/app-tabs.tsx`/`.web.tsx` (sus referencias); conservar `SafeAreaProvider`/`ThemeProvider`/splash

#### Fase 2 — Config, tipos y cliente
- [ ] **T2: Config de entorno** — `src/config/api-config.ts` + `.env.example` en `tareas-mobileui/` (Base: `tareas-webui/src/config/api-config.ts`) → `API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000'`; `.env.example` documenta la variable
- [ ] **T3: Tipos de dominio** — `src/types/tarea.ts` (Base: `tareas-webui/src/types/tarea.ts` + `tarea.entity.ts`) → `EstadoTarea`, `Tarea`, `CrearTareaDto`, `ActualizarTareaDto`
- [ ] **T4: Cliente HTTP de tareas + auth** — `src/api/tareas.client.ts` + `src/api/auth.client.ts` (Base: `tareas-webui/src/api/*`) → `listar/crear/actualizar/eliminar` con `fetch` + `Bearer`; `ApiError` + `mapearError(status|'red')` (400/401/5xx/red; sin 404 por tarea: la app no hace `GET /:id`); `emitirToken(usuario)` contra `POST /api/auth/token`; `async/await`, sin tragar errores

#### Fase 3 — Estado (custom hook)
- [ ] **T5: `useTareas` con auth automática** — `src/hooks/use-tareas.ts` (Base: `tareas-webui/src/hooks/use-tareas.ts` + `use-usuario.ts`) → al montar: `emitiendo` → `emitirToken('demo')` → carga listado; si falla la emisión: estado `error` con acción `reintentar`; ante `401` en cualquier petición: re-emite el token una vez y repite la acción; acciones `crear/actualizar/cambiarEstado/eliminar` con validación de título **antes** de llamar a la API (AC7) y mensajes de éxito/validación/error; expone `{ tareas, cargando, accionEnCurso, autenticando, mensaje, authError, acciones, reintentar }`

#### Fase 4 — Componentes de UI
- [ ] **T6: `Mensajes`** — `src/components/mensajes.tsx` (Base: `tareas-webui/src/components/mensajes.tsx`) → banner temado por tipo (exito/validación/error) sobre `ThemedText`/`ThemedView`
- [ ] **T7: `TareaForm`** — `src/components/tarea-form.tsx` (Base: `tareas-webui/src/components/tarea-form.tsx`, `guia-react-mobile.md` §2) → modo crear/editar con `TextInput` título (obligatorio) y descripción (multilinea, opcional); `Pressable` Enviar (deshabilitado en vuelo) + Cancelar (solo editar); validación de título sin llamar a la API; limpieza del formulario tras crear
- [ ] **T8: `TareaItem`** — `src/components/tarea-item.tsx` (Base: `tareas-webui/src/components/tarea-item.tsx`) → tarjeta temada: título + badge de estado, descripción en medio, acciones abajo (editar / cambiar estado / eliminar) con `Pressable`
- [ ] **T9: Pantalla `index`** — `src/app/index.tsx` (Base: `tareas-webui/src/App.tsx`) → composición: cabecera, `Mensajes`, estado de autenticación (spinner `emitiendo` / error con botón Reintentar), `ScrollView` con `TareaForm` + listado de `TareaItem` (o estado vacío "No hay tareas"); reemplaza la pantalla de bienvenida de la plantilla

#### Fase 5 — Tests (Vitest + react-test-renderer, fetch mockeado)
- [ ] **T10: Setup de tests** — `vitest.config.mts` + `src/test/setup.ts` + script `test` en `package.json` (Base: `tareas-webui/vitest.config.ts`) → `npx expo install -- --save-dev vitest jsdom @testing-library/jest-dom react-test-renderer @types/react-test-renderer` (versión compatible con RN 0.86/React 19 vía `expo install`); alias `@/*` → `src/*`; setup con `jest-dom`
- [ ] **T11: `tareas.client.test.ts`** — `src/api/tareas.client.test.ts` (cubre: QA-11 400, QA-12 5xx, QA-13 red, QA-14 URL por env + default, contrato de `POST /auth/token`) — referencia: `tareas-webui/src/api/auth.client.test.ts` + `tareas.client.test.ts`
- [ ] **T12: `use-tareas.test.ts`** — `src/hooks/use-tareas.test.ts` (cubre: QA-01 emisión automática + listado, QA-02 vacío, QA-03 crear con/sin descripción, QA-04 actualizar, QA-05 cambiar estado en ambas transiciones, QA-06 eliminar, QA-07/08 validación de título sin llamar a la API, QA-09 error de red con reintento, QA-10 re-emisión ante 401 y repetición de la acción) — referencia: `tareas-webui/src/hooks/use-tareas.test.ts`

#### Fase 6 — Verificación
- [ ] **T13: Lint + typecheck + tests** — `npm run lint` + `npx tsc --noEmit` + `npm run test` en `tareas-mobileui` (0 errores, 0 type errors, 100% de tests pasando) — referencia: `AGENTS.md` §Commands
- [ ] **T14: Verificación manual del demo (QA restantes)** — `npx expo start` contra la API viva (Postgres WSL + `tareas-webapi start:dev`) → recorrer QA-01..QA-14 en la vista web del demo (`npx expo start --web`): listado, CRUD completo, validación, errores (API caída con `EXPO_PUBLIC_API_BASE_URL` apuntando a un puerto muerto) y cambio de puerto por env (QA-14 paso 2 con `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000`)
