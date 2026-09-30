# 🚀 Development Handoff: HU #1 Gestión de Tareas API (Dev-Rápido) + Pruebas REST Client + Guía WSL

**Date:** 2026-09-30 14:00  
**Repository Branch:** master

---

## 🎯 1. Objective
- Entregar la HU #1 (CRUD REST de tareas) del proyecto `tareas-webapi` (NestJS v12 + TypeORM + PostgreSQL) ejecutando el flujo **Dev-Rápido** del Método Ceiba (hu → plan → implement → close), y en sesiones posteriores: pruebas manuales `.http` para la extensión REST Client, guía WSL en la memoria del proyecto (`memories/`) e ignorar el artefacto `tsconfig.build.tsbuildinfo` en git.

## 📊 2. Current Status
- **Status:** Ready for Testing
- API CRUD completa y verificada: 35/35 tests unitarios/integración (Jest), smoke 14/14 contra PostgreSQL real, flujo `.http` 14/14 validado contra la API viva. Lint (oxlint) 0 errores, build OK. **Todo el trabajo está staged en git pero SIN commit** (working tree limpio vs índice). HEAD local `8ad1364 planificación` va 1 commit por delante de `origin/master` (`8e43076 guia`).

## 🗂️ 3. Files in Progress
**Infraestructura API (todo nuevo, staged):**
- `tareas-webapi/docker-compose.yml`, `tareas-webapi/.env.example`, `tareas-webapi/package.json`, `tareas-webapi/.gitignore`, `tareas-webapi/.oxlintrc.json`, `tareas-webapi/.prettierrc`, `tareas-webapi/jest.config.ts`, `tareas-webapi/nest-cli.json`, `tareas-webapi/tsconfig.json`, `tareas-webapi/tsconfig.build.json`, `tareas-webapi/package-lock.json`
- `tareas-webapi/src/main.ts`, `tareas-webapi/src/app.module.ts`
- `tareas-webapi/src/modules/tareas/domain/` — `tarea.ts`, `estado-tarea.ts`, `tarea-repository.port.ts` (token DI `TAREA_REPOSITORY`), `tarea.spec.ts`
- `tareas-webapi/src/modules/tareas/application/commands/` — `crear-tarea.handler.ts`, `actualizar-tarea.handler.ts`, `eliminar-tarea.handler.ts`, `handlers-comando.spec.ts`
- `tareas-webapi/src/modules/tareas/application/queries/` — `listar-tareas.handler.ts`, `obtener-tarea.handler.ts`, `handlers-query.spec.ts`
- `tareas-webapi/src/modules/tareas/infrastructure/` — `tarea.entity.ts`, `tarea-repository.impl.ts`, `tareas-persistence.module.ts`
- `tareas-webapi/src/modules/tareas/api/` — `tareas.controller.ts`, `tareas.controller.spec.ts`, `dto/crear-tarea.dto.ts`, `dto/actualizar-tarea.dto.ts`
- `tareas-webapi/src/modules/tareas/tareas.module.ts`
- `tareas-webapi/src/shared/guards/` — `jwt-auth.guard.ts`, `jwt-auth.guard.spec.ts`
- `tareas-webapi/smoke-hu1.js`

**Pruebas y documentación (nuevos esta sesión):**
- `tareas-webapi/http/tareas-api.http` — 14 casos REST Client (14/14 validados)
- `memories/guia-wsl-docker.md` — guía WSL/Docker (memoria del proyecto en el repo)
- `docs/stories/1-gestion-tareas-api/` — `index.md` (M), `cambios.md` (M), `refinamiento.md` (16/16 `[x]`), `dev-record.md` (nuevo), `.medicion/attempts/*` (4 intentos HALT)
- `tareas-webapi/.gitignore` — regla `*.tsbuildinfo` agregada (el fichero fue des-tracked con `git rm -f --cached`)

## 🛠️ 4. Changes Made
- **API CRUD `/api/tareas`** (POST 201 / GET 200 / GET :id / PUT :id / DELETE :id 204) con arquitectura hexagonal + CQRS + DDD táctico; guard JWT Bearer (`JwtAuthGuard`, `CanActivate` propio con `JwtService`), `ValidationPipe` global (whitelist+transform), prefix global `api`, Swagger en `/docs` con `addBearerAuth`.
- **DI por token:** la interfaz `TareaRepository` se borra en runtime → inyección con `@Inject(TAREA_REPOSITORY)` (unique symbol en el port) y `{ provide: TAREA_REPOSITORY, useValue: TareaRepositoryImpl }` en el módulo de persistencia.
- **Postgres vía WSL Ubuntu** (preferencia explícita del usuario, NO Rancher Desktop): `wsl -d Ubuntu -- bash -lc "cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d"`.
- **Pruebas REST Client** `http/tareas-api.http`: variables de archivo `@baseUrl`/`@token` (token dev 7 días; comando de regeneración en el header), 2 casos 401, CRUD 201/200/204, validación 400, 404s, flujo encadenado real vía `# @name crearTarea` + `{{crearTarea.response.body.$.id}}` (ejecutar el caso 03 primero); cada bloque documenta su resultado esperado.
- **Memoria del proyecto:** `memories/guia-wsl-docker.md` (estado del sistema WSL, mapa de rutas Windows↔WSL, trampa de comillas PowerShell, espera de healthy, checklist de puesta en marcha). Preferencia registrada: "memoria del proyecto" = carpeta `memories/` del repo, NO la memoria interna del agente.
- **Git:** `*.tsbuildinfo` en `tareas-webapi/.gitignore` + `git rm -f --cached tsconfig.build.tsbuildinfo` (verificado con `git check-ignore`).

## ⚠️ 5. Attempts and Failures
- **Docker vía Rancher Desktop (Start-Process + espera de daemon)**
  - *Result:* Cancelado por el usuario (prefiere WSL). El daemon del WSL Ubuntu (Docker 29.6.1) ya estaba activo como servicio; todo pasó a WSL. Nota: en una sesión previa "Docker v29.5.3 disponible" se refería al cliente de Rancher, no al daemon.
- **Bash embebido con comillas dobles en PowerShell** (`wsl -d Ubuntu -- bash -lc "for i in $(seq 1 30)... 2>/dev/null"`)
  - *Result:* Falló: PowerShell expandió `$(seq 1 30)` antes de pasar a WSL (error `seq: El término "seq" no se reconoce...`), redirigió stderr a `D:\dev\null` y rompió los Go-templates `{{...}}`. Causa: PS expande `$(...)`, `${}` y `2>` en strings dobles. Corrección: **comillas simples** para el comando bash (documentado en `memories/guia-wsl-docker.md`).
- **Espera de healthcheck con `docker inspect --format "{{.State.Health.Status}}"`**
  - *Result:* Devolvió string vacío en ~30s de reintentos aunque el contenedor ya era healthy (el estado aparece con ~5-10s de retraso tras el arranque). Verificación efectiva: `docker ps --filter "name=tareas-postgres"` → `Up ... (healthy)`.
- **`git rm --cached tsconfig.build.tsbuildinfo` sin `-f`**
  - *Result:* `error: the following file has staged content different from both the file and the HEAD`. El fichero estaba staged (`AM`). Corrección: `git rm -f --cached` (nunca había sido commitado); verificado con `git check-ignore -v` → `tareas-webapi/.gitignore:6:*.tsbuildinfo`.
- **CLI de medición con ruta relativa desde `tareas-webapi/`**
  - *Result:* `MODULE_NOT_FOUND`. Corrección: siempre `Set-Location` a la raíz del workspace antes de invocar `node ".ceiba-metodo\metodo-ceiba\medicion\preparar-medicion-cli.mjs"`.
- **Medición COSMIC/PNF (prelude)**
  - *Result:* `HALT exit 3 / PENDING_STRATEGY / STRATEGY_NOT_APPROVED` ("No existe measurement-strategy.json") en 4 intentos — compuerta legítima del método, no un defecto. Última attempt: `docs/stories/1-gestion-tareas-api/.medicion/attempts/20260930175616-4439a91f`. Totales oficiales intactos (`SIN_MEDICION`).

## 🔮 6. Next Steps (Pending Tasks)
1. Commit del trabajo staged en `master` (los commits los hace el usuario; `origin/master` queda en `8e43076 guia`).
2. Medición de la HU #1: `/ceiba-generar-strategy` (crear/aprobar `docs/cosmic/measurement-strategy.json`) y luego `/ceiba-medir-historia` (story_id 1, dir `docs/stories/1-gestion-tareas-api/`) — el prelude debería pasar `PREPARED_PRELUDE` al existir la estrategia.
3. Cerrar la infra si ya no se usa: API `start:dev` (terminal background de la sesión anterior, si sigue viva) y Postgres `wsl -d Ubuntu -- bash -lc "cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose down"`.
4. Definir la HU siguiente: módulo auth JWT (registro/login — hoy el token se genera a mano con `jsonwebtoken`; es la precondición operativa pendiente) y/o recalibrar `docs/architecture/coding-standards.md` contra el código real (oxlint vs ESLint, singleQuote) — follow-up greenfield anotado en `dev-record.md` y `cambios.md`.
