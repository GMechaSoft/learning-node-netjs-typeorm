## Dev Agent Record — Dev-Rápido

### Debug Log

| # | Tipo | Descripción | Resolución |
|---|------|-------------|------------|
| 1 | build | `JwtModule.registerAsync`: `expiresIn` como `string` no assignable a `number \| StringValue` (ms) | Cast explícito `as JwtSignOptions["expiresIn"]` con return type `JwtModuleOptions` en el factory |
| 2 | test | `expect(date).toBeGreaterThanOrEqual(date)` inválido en Jest (exige number) | Aserción sobre `creadaEn.getTime()` |
| 3 | test | Spec inicial del controller: importaba `TareasModule` (requiere conexión TypeORM real en test unitario) y usaba token ficticio que no pasaría verificación JWT real | Reescrito: testing module con `TareasController` + `JwtAuthGuard` real + `JwtService` real (`JwtModule.register` con secret de prueba) y token firmado; dobles solo de handlers |
| 4 | entorno | Daemon Docker detenido (pipe no disponible) — el proyecto usa Rancher Desktop, no Docker Desktop | Arrancar `Rancher Desktop.exe`; daemon OK (v29.5.3); `docker compose up -d` y smoke |
| 5 | tooling | `npm run format` falló: patrón `test/**/*.ts` sin archivos (e2e scaffolding eliminado) | Scripts de `package.json` ajustados a `src/` (format, lint); scripts `deploy`/`test:e2e` eliminados |
| 6 | DI | Interfaz `TareaRepository` no existe en runtime: inyección por design-time metadata fallaría | Token `unique symbol` `TAREA_REPOSITORY` colocalizado en el puerto del dominio + `@Inject(TAREA_REPOSITORY)` en los 5 handlers |

### Completion Notes

- ⚡ Dev-Rápido: CRUD completo de tareas (HU #1, 7 ACs) en NestJS v12 + TypeORM + PostgreSQL — arquitectura hexagonal + CQRS + DDD táctico: dominio sin framework, handlers CQRS, adaptador TypeORM, guard JWT en el borde, Swagger, ValidationPipe global whitelist. 16/16 tareas, 35/35 tests, smoke 14/14 contra PostgreSQL real.
- Desviaciones documentadas en `cambios.md`: guard implementa `CanActivate` propio (no extiende `AuthGuard`); T15 en `api/tareas.controller.spec.ts`; global prefix `api` (rutas `/api/tareas`).
- Recalibración de `coding-standards.md` pendiente (nota greenfield): el stack real es NestJS v12 con `oxlint` (no ESLint), TS 6, Prettier `singleQuote` — los ejemplos-proyección del estándar usan ESLint y doble comilla.

### File List

| Acción | Archivo | Descripción |
|--------|---------|-------------|
| Creado | `tareas-webapi/` (scaffold `nest new`) | Proyecto NestJS v12 CJS + Jest; `package.json`, `tsconfig.json`, `.oxlintrc.json`, `.prettierrc`, `jest.config.ts`, `nest-cli.json` |
| Modificado | `tareas-webapi/package.json` | Dependencias (`typeorm pg @nestjs/typeorm class-validator class-transformer @nestjs/swagger @nestjs/config @nestjs/jwt`); scripts corregidos (sin `test/`/`deploy`) |
| Creado | `tareas-webapi/docker-compose.yml` | PostgreSQL 16 (healthcheck, volume) — decisión pendiente del GPS resuelta |
| Creado | `tareas-webapi/.env.example` | Plantilla: `DB_*`, `DB_SYNCHRONIZE`, `JWT_SECRET`, `JWT_EXPIRES_IN` |
| Creado | `tareas-webapi/.env` | Valores locales (gitignored) |
| Creado | `tareas-webapi/.gitignore` | `node_modules`, `dist`, `coverage`, `.env` |
| Modificado | `tareas-webapi/src/main.ts` | `reflect-metadata`, `ValidationPipe({whitelist,transform})`, Swagger `/docs`, CORS, prefix `api` |
| Modificado | `tareas-webapi/src/app.module.ts` | `ConfigModule` global, `TypeOrmModule.forRootAsync` (env), `JwtModule` global (env), `TareasModule` |
| Creado | `tareas-webapi/src/shared/guards/jwt-auth.guard.ts` | Guard JWT (`CanActivate`, 401 sin/inválido) — precondición operativa AC7 |
| Creado | `tareas-webapi/src/shared/guards/jwt-auth.guard.spec.ts` | T12: 4 tests del guard |
| Creado | `tareas-webapi/src/modules/tareas/domain/estado-tarea.ts` | Tipo `EstadoTarea` + constante de estados |
| Creado | `tareas-webapi/src/modules/tareas/domain/tarea.ts` | Entidad de dominio: invariantes (título, estado, default pendiente), `crear`/`reconstruir`/`actualizar` inmutable |
| Creado | `tareas-webapi/src/modules/tareas/domain/tarea-repository.port.ts` | Puerto `TareaRepository` + token DI `TAREA_REPOSITORY` (sin framework) |
| Creado | `tareas-webapi/src/modules/tareas/domain/tarea.spec.ts` | T11: 11 tests del dominio |
| Creado | `tareas-webapi/src/modules/tareas/application/commands/crear-tarea.handler.ts` | Comando: crear |
| Creado | `tareas-webapi/src/modules/tareas/application/commands/actualizar-tarea.handler.ts` | Comando: actualizar (404 si no existe) |
| Creado | `tareas-webapi/src/modules/tareas/application/commands/eliminar-tarea.handler.ts` | Comando: eliminar (404 si no existe) |
| Creado | `tareas-webapi/src/modules/tareas/application/commands/handlers-comando.spec.ts` | T13: 7 tests de comandos + inyección por token |
| Creado | `tareas-webapi/src/modules/tareas/application/queries/listar-tareas.handler.ts` | Query: listar |
| Creado | `tareas-webapi/src/modules/tareas/application/queries/obtener-tarea.handler.ts` | Query: obtener por ID (404 si no existe) |
| Creado | `tareas-webapi/src/modules/tareas/application/queries/handlers-query.spec.ts` | T14: 5 tests de queries + inyección por token |
| Creado | `tareas-webapi/src/modules/tareas/infrastructure/tarea.entity.ts` | Entidad TypeORM `tareas` |
| Creado | `tareas-webapi/src/modules/tareas/infrastructure/tarea-repository.impl.ts` | Implementación del puerto (mapeo ↔ dominio) |
| Creado | `tareas-webapi/src/modules/tareas/infrastructure/tareas-persistence.module.ts` | Módulo de persistencia (feature TypeORM, token del puerto) |
| Creado | `tareas-webapi/src/modules/tareas/api/dto/crear-tarea.dto.ts` | DTO crear (`titulo` obligatorio, `descripcion` opcional) + Swagger |
| Creado | `tareas-webapi/src/modules/tareas/api/dto/actualizar-tarea.dto.ts` | DTO actualizar (todo opcional, `@IsIn` estados) + Swagger |
| Creado | `tareas-webapi/src/modules/tareas/api/tareas.controller.ts` | Controller delgado: 5 endpoints, `ParseIntPipe`, guard JWT, Swagger |
| Creado | `tareas-webapi/src/modules/tareas/api/tareas.controller.spec.ts` | T15: 9 tests HTTP (201/200/204/400/404/401) supertest + guard real |
| Creado | `tareas-webapi/src/modules/tareas/tareas.module.ts` | Módulo de agregación del feature |
| Creado | `tareas-webapi/smoke-hu1.js` | T16: smoke CRUD completo 14/14 contra PostgreSQL real |
| Eliminado | `tareas-webapi/src/app.controller.ts`, `app.service.ts`, `app.controller.spec.ts` | Scaffolding del CLI sin usar |
| Eliminado | `tareas-webapi/test/app.e2e-spec.ts`, `test/jest-e2e.json` | Scaffolding e2e del CLI (sin e2e en esta HU) |

### Métricas Dev-Rápido

- Tiempo sesión IA: 1061 min
- Tareas manuales DoD: 0 min
- Tiempo total: 1061 min
