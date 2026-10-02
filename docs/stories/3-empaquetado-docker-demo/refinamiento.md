## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-10-01

### Resumen de la solución

Imagen Docker **única** de demostración académica que integra los 3 componentes ya entregados (front `tareas-webui` [HU #2], back `tareas-webapi` [HU #1], BD PostgreSQL) en un solo contenedor.

- **Base:** `postgres:16` (BD embebida, **no expuesta**) + `nginx` (front, **:80**) + `node 22` (API, **:8080**).
- **Front→Back:** el front se compila con `VITE_API_BASE_URL=http://localhost:8080` y llama directo al back usando el CORS ya habilitado en la API (`enableCors()` sin opciones → todos los orígenes).
- **BD:** **efímera** (sin volumen). El entrypoint reutiliza el `docker-entrypoint.sh` oficial de `postgres:16` (initdb + arranque), espera con `pg_isready`, y la BD solo escucha en `localhost` (no expuesta al host).
- **Arranque:** `docker/entrypoint.sh` levanta postgres (background) → espera a que esté lista → API (background, :8080) → nginx (foreground, :80, mantiene vivo el contenedor).

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| `tareas-webapi/` (API NestJS completa) | Se reutiliza | Se compila tal cual en un stage; no se toca la lógica (HU #1 + auth) |
| `tareas-webui/` (SPA React) | Se reutiliza | Se compila con Vite; solo se inyecta `VITE_API_BASE_URL` (build-time) |
| `app.module.ts` (ConfigService → env `DB_*`, `JWT_*`) | Se reutiliza | Ya lee todo por variables de entorno → la imagen solo las aporta |
| `main.ts` (`enableCors()`, prefix `api`, Swagger `/docs`, `PORT`) | Se reutiliza | CORS permite el front; `PORT=8080` se fija por env |
| `tareas-webapi/docker-compose.yml` (dev) | No se toca | Es la infra de desarrollo; la demo tiene su propio compose en la raíz |
| `Dockerfile` (raíz) | Se crea | No existe empaquetado en el workspace |
| `.dockerignore` (raíz) | Se crea | Controla el build context (excluye `node_modules`/`dist`/`.env`/docs) |
| `docker/nginx.conf` | Se crea | Servidor :80 del front (no existe en el proyecto) |
| `docker/entrypoint.sh` | Se crea | Supervisor de los 3 procesos (no existe en el proyecto) |
| `docker/.env` | Se crea | Credenciales demo de runtime (BD + JWT) |
| `docker-compose.demo.yml` (raíz) | Se crea | Arranque de conveniencia con 1 comando |
| `docker/README.md` | Se crea | Documentación de arranque (no entra en la imagen) |

### Tareas de Implementación

#### Fase 1 — Build context y variables de demo
- [x] **T1: `.dockerignore` (raíz)** — `.dockerignore` — excluye `**/node_modules`, `**/dist`, `**/coverage`, `*.tsbuildinfo`, `**/.env`, `docs/`, `memories/`, `tareas-mobileui/`, `.git` y VCS/editor
- [x] **T2: `docker/.env`** — `docker/.env` — `POSTGRES_USER/PASSWORD/DB`, `DB_HOST=localhost`, `DB_PORT`, `DB_USER/PASSWORD/NAME`, `DB_SYNCHRONIZE=true`, `JWT_SECRET`, `JWT_EXPIRES_IN`, `PORT=8080` (credenciales demo)

#### Fase 2 — Dockerfile multi-stage
- [x] **T3: `Dockerfile` (raíz)** — `Dockerfile` — stages: `ui-build` (node:22 → `npm ci` + `vite build`, `ARG VITE_API_BASE_URL=http://localhost:8080`), `api-build` (node:22 → `npm ci` + `nest build`), `api-prod` (node:22 → `npm ci --omit=dev` + copia `dist`), runtime (`postgres:16` → `apt nginx`, copia el binario `node` de `api-prod`, copia front a `/usr/share/nginx/html`, API a `/opt/api`, `nginx.conf`, `entrypoint.sh`, `ENV` demo, `EXPOSE 80 8080`, `ENTRYPOINT`)

#### Fase 3 — Orquestación del contenedor
- [x] **T4: `docker/nginx.conf`** — `docker/nginx.conf` — `server` :80, `root /usr/share/nginx/html`, fallback SPA `try_files`, cache `/assets/`, gzip
- [x] **T5: `docker/entrypoint.sh`** — `docker/entrypoint.sh` — `docker-entrypoint.sh postgres &` → espera `pg_isready` (máx 60s) → `cd /opt/api && PORT=8080 node dist/main.js &` → `nginx -g 'daemon off;'` (LF)

#### Fase 4 — Arranque de conveniencia
- [x] **T6: `docker-compose.demo.yml` (raíz)** — `docker-compose.demo.yml` — 1 servicio `tareas-demo` (build raíz, `env_file: docker/.env`, `ports: 80:80, 8080:8080`, **sin volumen** → BD efímera)

#### Fase 5 — Verificación (tests = casos QA)
- [x] **T7: Build de la imagen** — `QA-01` ✅ (1er intento falló por bug latente del front: `afterEach` sin importar en `use-usuario.test.ts` → TS2304 bajo `tsc -b`; corregido importándolo de `vitest`; 2º intento: `Image tareas-demo:latest Built`)
- [x] **T8: Arranque + puertos + BD no expuesta** — `QA-02` ✅ (200 + `id="root"` en :80, SPA cargada en navegador), `QA-03` ✅ (401 sin token), `QA-04` ✅ (/docs 200), `QA-05` ✅ (`docker port` → solo 80 y 8080; 5432 sin mapeo) (1er arranque falló: el entrypoint de postgres vive en `/usr/local/bin/docker-entrypoint.sh`, no en `/`; corregido)
- [x] **T9: CRUD extremo a extremo** — `QA-06` ✅ (UI: crear → actualizar título+desc → estado completada → eliminar; la BD confirmó el borrado), `QA-07` ✅ (API crea → persistida → visible en la UI), `QA-10` ✅ (token inválido → mensaje exacto de 401)
- [x] **T10: Persistencia efímera** — `QA-08` ✅ (`docker rm -f` + `compose up` → listado `[]`)
- [x] **T11: Compose de conveniencia** — `QA-09` ✅ (`docker compose -f docker-compose.demo.yml up` → UI 200 en :80, API 200 en :8080)

#### Fase 6 — Cierre y documentación
- [x] **T12: `docker/README.md`** — `docker/README.md` — instrucciones: build, up, URLs (front `http://localhost`, API `http://localhost:8080/docs`), cómo obtener token (`POST /api/auth/token`), limitación demo (BD efímera, sin init system formal)

> **Nota de ejecución:** T7–T11 (Fase 5) son verificaciones (tests de integración contra el
> contenedor vivo) y se ejecutan en `step-02c-tests`, no en `step-02-implement`.

### Checklist de validación (step-01-plan §4)

☑ Feature análoga leída completa (back NestJS + front Vite + compose existente)
☑ TODOS los artefactos identificados (Dockerfile, .dockerignore, nginx.conf, entrypoint, .env, compose, docs)
☑ Respeta arquitectura (no toca front/back; solo orquesta; credenciales por env — GPS §Seguridad)
☑ Inventario de reutilización hecho
☑ Todo caso QA de prioridad Alta cubierto y automatizable: QA-01(T7), QA-02(T8), QA-03(T8), QA-05(T8), QA-06(T9), QA-09(T11) — vía `docker build` + `curl` + `docker port`

### Notas de riesgo / decisiones

- **Node 22 sobre base `postgres:16`:** se copia el binario `node` del stage `node:22` (debian bookworm, glibc) → compatible con la base `postgres:16` (también debian bookworm). Requisito efectivo del back: node ≥ 22.
- **Front→Back por CORS:** decisión del usuario. El back ya tiene `enableCors()` (todos los orígenes) → el navegador en :80 llama a :8080 sin proxy.
- **Signal handling:** el entrypoint es un supervisor simple (postgres+node en background, nginx foreground). Adecuado para una demo; no es un init system formal (tini/dumb-init). Documentado como limitación.
- **Red para el build:** requiere red para pull de `node:22`/`postgres:16` y `npm ci` (lockfiles comprometidos). Se ejecuta vía WSL Ubuntu (preferencia del usuario).
