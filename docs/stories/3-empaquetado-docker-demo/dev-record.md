# HU #3 — Empaquetado Docker de demostración (front :80 + back :8080 + BD efímera)

## Dev Agent Record — Dev-Rápido

### Debug Log

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| 1 | Bug latente (front) | 1er `docker build`: `tsc -b` falló con `TS2304: Cannot find name 'afterEach'` en `tareas-webui/src/hooks/use-usuario.test.ts` — el archivo usaba `afterEach` sin importarlo (los otros 6 test files lo importan explícitamente; `vitest` con `globals: true` lo enmascaraba en runtime, pero `tsc` no). | Agregué `afterEach` al import de `vitest`. Suite verde: 50/50 tests. |
| 2 | Runtime (BD) | 1er `docker run`: postgres no arrancaba → la API daba `ECONNREFUSED 127.0.0.1:5432` y el contenedor quedaba unhealthy. Causa: el entrypoint llamaba a `/docker-entrypoint.sh`, que **no existe** en `postgres:16`; la ruta real es `/usr/local/bin/docker-entrypoint.sh` (los `ENV PATH` de esa imagen no aplican al `ENV PATH` heredado de node:22). | Corregí la ruta en `docker/entrypoint.sh` y rebuild (`--no-cache` del stage runtime). Verificado: BD lista en ~10 s, API 200 en :8080. |
| 3 | Entorno (operativo) | Los comandos bash complejos pasados a WSL desde PowerShell se corrompían (redirecciones y `$` mal interpretados). | Los scripts de verificación se escribieron como archivos `.sh` y se ejecutaron con `wsl -d Ubuntu -- bash /mnt/d/...`. Limpieza posterior de temporales. |

### Completion Notes

- ⚡ Dev-Rápido: Front + back + base de datos empaquetados en una única imagen Docker de demostración académica (`tareas-demo:latest`): UI React en `:80` (nginx + SPA build), API NestJS en `:8080`, PostgreSQL 16 **embebida y efímera** (no expuesta, recreada en cada arranque). Incluye `docker-compose.demo.yml` de conveniencia (1 service) y `docker/README.md` con guía de uso.
- 🧪 Cobertura QA: 10/10 (QA-01..QA-10 verificados contra el contenedor vivo: build, puertos, BD no expuesta, CRUD vía UI y API, persistencia efímera, compose).

### File List

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Creado | `Dockerfile` | Build multi-stage: `ui-build` (vite), `api-build` (nest), `api-prod` (deps de producción) y runtime sobre `postgres:16` + node:22 + nginx. `EXPOSE 80 8080`, HEALTHCHECK sobre `/docs`. |
| Creado | `.dockerignore` | Excluye `node_modules`, `dist`, `coverage`, `docs/`, `memories/`, `tareas-mobile-ui/`, `.env` y artefactos de VCS/editor del contexto de build. |
| Creado | `docker/entrypoint.sh` | Supervisa los 3 procesos: postgres (background, `initdb` efímero) → espera `pg_isready` → API `node dist/main.js` (PORT=8080, background) → nginx foreground. Con `trap` de limpieza. |
| Creado | `docker/nginx.conf` | Server `:80`, `root /usr/share/nginx/html`, fallback SPA (`try_files ... /index.html`), gzip y cache 30 días para `/assets/`. |
| Creado | `docker/.env` | Credenciales fijas de demo (`tareas/tareas/tareas_db`), `DB_SYNCHRONIZE=true`, `JWT_SECRET=demo-secret-academica`, `PORT=8080`. |
| Creado | `docker/README.md` | Instrucciones de build/arranque, URLs (`http://localhost`, `http://localhost:8080/docs`), cómo obtener el token, verificaciones y limitaciones. |
| Creado | `docker-compose.demo.yml` | Compose de conveniencia: 1 service `tareas-demo` (misma imagen), puertos 80/8080, sin volumes (BD efímera). |
| Modificado | `tareas-webui/src/hooks/use-usuario.test.ts` | Corregí import: `afterEach` faltaba en el import de `vitest` (bug latente TS2304 bajo `tsc -b`). |
| Creado | `docs/stories/3-empaquetado-docker-demo/historia.md` | HU con 7 AC (dado/cuando/entonces), suposiciones y out-of-scope. |
| Creado | `docs/stories/3-empaquetado-docker-demo/qa.md` | 10 casos de verificación (QA-01..QA-10) contra el contenedor vivo. |
| Creado | `docs/stories/3-empaquetado-docker-demo/index.md` | Tracker de la HU. |
| Creado | `docs/stories/3-empaquetado-docker-demo/refinamiento.md` | Plan de implementación: 12 tareas (T1..T12) en 6 fases, con mapping a QA. |
| Creado | `docs/stories/3-empaquetado-docker-demo/cambios.md` | Registro de cambios (artefactos + verificaciones). |

### Métricas Dev-Rápido

- Tiempo sesión IA: 29 min
- Tareas manuales DoD: 0 min
- Tiempo total: 29 min
