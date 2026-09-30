# Registro de Cambios — Historia #1

| Fecha | Fase | Descripción | Autor |
|-------|------|-------------|-------|
| 2026-09-29 | Creación | Historia creada | Gerson Sanchez (PO) |
| 2026-09-29 | Creación | Cierre de creación (INVEST 6/6, sin slicing, sin UI) | Gerson Sanchez (PO) |
| 2026-09-29 | Creación | Tracker: sin tablero (desarrollo directo) → tracker_status: ninguna | Gerson Sanchez (PO) |
| 2026-09-29 | Desarrollo | dev-rapido: registro de inicio de Desarrollo | Gerson Sanchez (dev-rapido) |
| 2026-09-29 | Desarrollo | refinamiento.md creado (16 tareas, 4 fases; greenfield — sin feature análoga; guard JWT como precondición; docker-compose; medición al cierre por falta de strategy APPROVED) | Gerson Sanchez (dev-rapido) |
| 2026-09-29 | Desarrollo | Ajuste de plan (usuario): el proyecto se aloja en `tareas-webapi/` (raíz del workspace) con su `src/`, no en la raíz del workspace | Gerson Sanchez (dev-rapido) |
| 2026-09-29 | Desarrollo | T1-T15 implementadas: NestJS v12 en `tareas-webapi/` (CJS+Jest, oxlint en lugar de ESLint, TS 6 — recalibración de los estándares-proyección); guard JWT propio (CanActivate + JwtService, secret por env); dominio Tarea sin framework + puerto DI por token; handlers CQRS (3 cmd + 2 qry); TypeORM (entidad + impl + módulo de persistencia); controller + DTOs con Swagger; ValidationPipe whitelist global; global prefix `api` | Gerson Sanchez (dev-rapido) |
| 2026-09-29 | Desarrollo | Tests: 35/35 passing en 5 suites (dominio, guard, handlers, controller con supertest + guard real y token firmado); lint y build limpios | Gerson Sanchez (dev-rapido) |
| 2026-09-29 | Desarrollo | Desviación menor: T15 en `tareas-webapi/src/modules/tareas/api/tareas.controller.spec.ts` (no `tareas/tareas.controller.spec.ts` como decía el refinamiento); guard no extiende AuthGuard (implementación CanActivate propia — más explícito y testeable) | Gerson Sanchez (dev-rapido) |
| 2026-09-29 | Desarrollo | T16 completada: smoke CRUD completo 14/14 contra PostgreSQL real (docker-compose postgres:16 + API en :3000, script `tareas-webapi/smoke-hu1.js`: 201/200/204/400/404/401 + persistencia verificada). Tareas 16/16 | Gerson Sanchez (dev-rapido) |
| 2026-09-30 | Dev-Rápido | ⚡ Implementado: CRUD de tareas (HU #1, 7 ACs) — NestJS v12 + TypeORM + PostgreSQL, hexagonal+CQRS+DDD, guard JWT, Swagger, 35/35 tests, smoke 14/14. Estado → Lista para Revisión. Responsable: gerson.sanchez | Gerson Sanchez |
| 2026-09-30 | Medición | ⚠️ Medición COSMIC/PNF HALT en la compuerta de strategy: `PENDING_STRATEGY/STRATEGY_NOT_APPROVED` (no existe `docs/cosmic/measurement-strategy.json`). Intento cerrado: `.medicion/attempts/20260930175616-4439a91f`. Totales oficiales intactos (SIN_MEDICION). Pendiente: `/ceiba-generar-strategy` y luego `/ceiba-medir-historia` | Gerson Sanchez (dev-rapido) |
