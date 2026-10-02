## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-10-01

## Plan

**Arquitectura:** SPA de una sola vista (React + TypeScript + JSX) sobre Vite, patrón "cliente fino + custom hook de estado + componentes presentacionales". Mantiene las convenciones del proyecto: archivos kebab-case, componentes/clases PascalCase, comillas simples (`singleQuote`), `async/await` end-to-end, sin librería de UI (CSS propio por componente). La UI solo consume el contrato HTTP de la API ya entregada (HU #1); NO toca el código del backend.

**Contrato de API consumido** (extraído de `tareas-webapi/src/modules/tareas/api/tareas.controller.ts` + `tarea.entity.ts` + DTOs):
- Base: `{VITE_API_BASE_URL}/api/tareas` (prefix global `api`, CORS habilitado en `main.ts`)
- `GET /` → `200 Tarea[]` | `POST /` → `201 Tarea` | `GET /:id` → `200 Tarea` | `PUT /:id` → `200 Tarea` | `DELETE /:id` → `204`
- Errores: `400` (datos inválidos) · `401` (token ausente/inválido) · `404` (tarea inexistente) · `5xx` (servidor) · red (API inaccesible)
- `Tarea = { id: number; titulo: string; descripcion: string | null; estado: 'pendiente' | 'completada'; creadaEn: string }`
- `CrearTareaDto = { titulo: string; descripcion?: string }` · `ActualizarTareaDto = { titulo?: string; descripcion?: string; estado?: EstadoTarea }`
- Header: `Authorization: Bearer {token}` en todas las peticiones

**Pasos**
1. Scaffold del proyecto `tareas-webui` (Vite + React + TS) — capa: raíz — referencia: `guia-react-web.md` §1 (Vite, `index.html` en raíz, `createRoot` + `StrictMode`)
2. Tipos de dominio y config de entorno — capa: `src/types`, `src/config` — referencia: contrato API de `tareas-webapi`
3. Cliente HTTP fino de tareas (fetch + mapeo de errores genéricos por código) — capa: `src/api` — referencia: `tareas.controller.ts` (códigos) + `coding-standards` §5 (async/await)
4. Custom hook `useTareas` (listado + crear/actualizar/cambiar-estado/eliminar) + `useToken` (persistencia en `localStorage`) — capa: `src/hooks` — referencia: `guia-react-web.md` §5 (useEffect) §8 (custom hooks) §7 (controlado)
5. Componentes presentacionales: `TokenAuth`, `TareaForm`, `TareaList`, `TareaItem`, `Mensajes` + `App` — capa: `src/components` — referencia: `2.preview.md` (wireframe) + `guia-react-web.md` §2-4, §9
6. Tests (Vitest + Testing Library) mockeando el cliente — capa: `src/**/**.test.tsx` — referencia: `qa.md` QA-01..QA-16 — cubre: QA-01..QA-16

**Archivos relevantes**
- `tareas-webapi/src/modules/tareas/api/tareas.controller.ts` — referencia: códigos HTTP por verbo (201/200/204/400/401/404), guard JWT
- `tareas-webapi/src/modules/tareas/infrastructure/tarea.entity.ts` — referencia: forma exacta de `Tarea` (id, titulo, descripcion nullable, estado, creadaEn)
- `tareas-webapi/src/modules/tareas/api/dto/crear-tarea.dto.ts` y `actualizar-tarea.dto.ts` — referencia: campos obligatorios vs opcionales del payload
- `tareas-webapi/guia-react-web.md` — referencia: stack elegido (Vite/React/hooks/formularios controlados/contexto), reglas JSX y de hooks
- `docs/stories/2-gestion-tareas-web-ui/2.preview.md` — referencia: wireframe de la única vista (bloques, flujo, mensajes)
- `docs/architecture/coding-standards.md` — referencia: nomenclatura, async/await, convención de tests

**Reutilización**
- `tareas-webapi` (backend) — se **consume** (no se modifica): contrato HTTP/JSON + token JWT; decisión `frontier:tareas-webapi` (interno, solo consumo HTTP)
- `tareas-webui/` — se **crea**: no existe en el workspace (primera UI del proyecto, sin equivalente a reutilizar)
- Contrato `Tarea` / DTOs / códigos — se **reutiliza** leyendo `tareas-webapi` (fuente única de verdad del dominio), sin redefinir el backend
- Convenciones (kebab-case, PascalCase, singleQuote, async/await) — se **reutilizan** de `coding-standards.md` y del código de `tareas-webapi`
- Framework de tests — se **crea** (Vitest + @testing-library/react): el proyecto frontend no existe aún; `tareas-webapi` usa Jest pero es un stack CJS de Node, no aplica a un Vite/ESM

**Checklist**
☑ Feature análoga leída completa (backend `tareas-webapi`: controller, entity, DTOs, main) | ☑ TODOS los artefactos identificados (contrato API + configs + tests de referencia) | ☑ Respeta arquitectura (solo consumidor HTTP; sin tocar backend; capas cliente→hook→componentes) | ☑ Inventario de reutilización hecho

---

## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-10-01

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| `tareas-webapi` (backend) | Se consume (no se modifica) | Contrato HTTP/JSON + Bearer JWT; `frontier:tareas-webapi` = solo consumo HTTP |
| `tareas-webui/` (proyecto Vite) | Se crea | No existe en el workspace; primera UI del proyecto |
| Tipos `Tarea`/`CrearTareaDto`/`ActualizarTareaDto`/`EstadoTarea` | Se redefinen en cliente leyendo el backend | Mismo contrato, lado consumidor (no se importa Node) |
| Códigos de error (400/401/404/5xx/red) | Se reutilizan de `tareas.controller.ts` | Fuente única de verdad del contrato |
| Convenciones (nomenclatura, singleQuote, async/await) | Se reutilizan | `coding-standards.md` + código de `tareas-webapi` |
| Framework de tests (Vitest + Testing Library) | Se crea | El proyecto frontend no existe; Jest/CJS de Node no aplica a Vite/ESM |

### Tareas de Implementación

#### Fase 1 — Scaffold del proyecto
- [ ] **T1: Inicializar `tareas-webui` con Vite + React + TypeScript** — `tareas-webui/` (Base: `guia-react-web.md` §1) → `package.json`, `vite.config.ts`, `tsconfig.json`/`tsconfig.node.json`, `index.html`, `src/main.tsx` (`createRoot` + `StrictMode`), `src/vite-env.d.ts`, `.gitignore`, `.prettierrc` (singleQuote)
- [ ] **T2: Variables de entorno y config** — `tareas-webui/.env.example` + `src/config/api-config.ts` (Base: contrato `main.ts` del backend) → `VITE_API_BASE_URL` (default `http://localhost:3000`), exporta `API_BASE`

#### Fase 2 — Dominio cliente y API
- [ ] **T3: Tipos de dominio** — `src/types/tarea.ts` (Base: `tarea.entity.ts` + DTOs) → `EstadoTarea = 'pendiente'|'completada'`, `Tarea`, `CrearTareaDto`, `ActualizarTareaDto`
- [ ] **T4: Cliente HTTP fino + mapeo de errores** — `src/api/tareas.client.ts` (Base: `tareas.controller.ts` + `coding-standards` §5) → `listar/crear/actualizar/eliminar` con `fetch` + `Authorization: Bearer`; función pura `mapearError(status|red)` → mensaje genérico (400/401/404/5xx/red); `async/await`, sin tragar errores

#### Fase 3 — Estado (custom hooks)
- [ ] **T5: `useTareas`** — `src/hooks/use-tareas.ts` (Base: `guia-react-web.md` §5/§8) → estado `[tareas, cargando, mensaje]`; acciones `crear/actualizar/cambiarEstado/eliminar`; valida título en cliente **antes** de llamar a la API (AC7); aplica mensaje de éxito/error; actualiza la lista tras cada mutación
- [ ] **T6: `useToken` (persistencia)** — `src/hooks/use-token.ts` (Base: AC6) → token en `localStorage`, `guardarToken`/`limpiarToken`; sobrevive a la recarga; expone `token` + `guardarToken`

#### Fase 4 — Componentes de UI
- [ ] **T7: `Mensajes`** — `src/components/mensajes.tsx` + `.css` (Base: `2.preview.md` "zona de mensajes") → zona única de feedback (éxito/validación/error)
- [ ] **T8: `TokenAuth`** — `src/components/token-auth.tsx` + `.css` (Base: AC6) → campo de texto + botón guardar; rellena con el token guardado
- [ ] **T9: `TareaForm`** — `src/components/tarea-form.tsx` + `.css` (Base: `guia-react-web.md` §7, AC2/3/7) → modo crear y modo editar; campos controlados título/descripción/estado; valida título (vacío/espacios) sin llamar a la API; Cancelar; botón Enviar deshabilitado en vuelo
- [ ] **T10: `TareaItem` + `TareaList`** — `src/components/tarea-item.tsx`/`tarea-list.tsx` + `.css` (Base: `2.preview.md`, AC1/4/5) → fila por tarea (título, descripción, estado) con acciones editar/cambiar estado/eliminar; estado vacío "No hay tareas"; indicador "Cargando…"
- [ ] **T11: `App`** — `src/App.tsx` + `src/App.css` (Base: `2.preview.md`) → composición de la única vista; carga el listado al montar si hay token (useEffect); enlaza hooks y componentes

#### Fase 5 — Tests (Vitest + Testing Library)
- [ ] **T12: Setup de tests** — `vitest.config.ts` (o en `vite.config.ts`), `src/test/setup.ts`, `@testing-library/react` + `jest-dom` + `user-event` (Base: `qa.md`) → scripts `test`/`test:cov`
- [ ] **T13: `tareas.client.test.ts`** — mapeo de errores (cubre: QA-11 401, QA-12 404, QA-13 5xx, QA-14 red, QA-15 400) + URL base por env (QA-16) — referencia: `tareas.controller.ts`
- [ ] **T14: `use-tareas.test.ts`** — hook: listado (QA-01, QA-02), crear con/sin descripción (QA-03), actualizar (QA-04), cambiar estado (QA-05), eliminar (QA-06), validación título sin llamar API (QA-09, QA-10), indicador de carga (QA-16)
- [ ] **T15: `use-token.test.ts`** — persistencia en `localStorage` (QA-07), reemplazo de token (QA-08)
- [ ] **T16: `App.test.tsx` (render)** — integración render: muestra listado cargado, estados de carga, mensajes de error sin bloquear (QA-01, QA-11, QA-14, QA-16)

#### Fase 6 — Verificación
- [ ] **T17: Lint + build + tests** — `npm run lint` / `npm run build` / `npm run test` (0 errores, build OK, 100% de tests pasando)
