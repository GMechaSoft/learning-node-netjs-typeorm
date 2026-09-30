## Refinamiento Técnico (Developer)
**Autor**: Gerson Sanchez | **Fecha**: 2026-09-29

### Contexto

- **Proyecto greenfield**: no existe `package.json` ni `src/` — no hay feature análoga implementada que leer (verificado: el workspace solo contiene `docs/`, `guia.md`, `handoff.md`). Las referencias de cada tarea son el GPS (`docs/architecture/index.md`) y los estándares (`docs/architecture/coding-standards.md`), que son proyecciones a calibrar con este primer código.
- **Ubicación del proyecto** (decisión del usuario): el código se aloja en **`tareas-webapi/`** en la raíz del workspace, con su `tareas-webapi/src/` correspondiente. Todo el proyecto (package.json, src, docker-compose, .env) vive ahí; `docs/` queda en la raíz del workspace.
- **Arquitectura objetivo**: hexagonal + CQRS + DDD táctico (GPS) — borde API (controller + guard JWT), aplicación CQRS (handlers de comando/query), dominio (entidad `Tarea` sin imports de framework), infraestructura (TypeORM/PostgreSQL implementa el puerto).
- **Precondición operativa de la HU**: el módulo de registro/login (emisión de tokens) queda fuera de alcance del GPS; para poder probar los 7 ACs (todos requieren token JWT válido) se implementa un **guard JWT verificable** con secret por variable de entorno. La emisión de tokens se documenta como HU futura (el handoff la listaba ya como paso pendiente #4).
- **PostgreSQL**: no corre localmente (puerto 5432 cerrado) y Docker sí está disponible (v29.5.3) → se resuelve la decisión pendiente del GPS con `docker-compose.yml`.
- **Medición COSMIC/PNF**: no existe `measurement-strategy.json` APPROVED → se mide al cierre (step-03b).

### Reutilización

| Componente | Decisión | Motivo |
|------------|----------|--------|
| Scaffolding NestJS (`nest new`: `tsconfig.json`, `.eslintrc.js`, `.prettierrc`, `jest.config` en `package.json`) | Se reutiliza | Es el default del CLI (guia.md §2); los estándares lo proyectan como base y se recalibran contra estos archivos reales |
| `ValidationPipe({ whitelist: true })` global | Se reutiliza | Ya exigido por estándares §4 y guia.md §6; cubre los 400/422 del AC6 sin código propio |
| `main.ts`, `app.module.ts`, `nest-cli.json` del CLI | Se reutiliza y se modifica | Se les añade Swagger, CORS, pipes y registro de módulos (T3, T4) |
| `JwtAuthGuard` | Se crea | No existe equivalente (greenfield); es el único mecanismo para el AC7 |
| Entidad de dominio `Tarea` + puerto `TareaRepository` | Se crea | No existe equivalente; invariante del DDD (dominio sin framework) |
| Handlers CQRS (3 comandos + 2 queries) | Se crean | No existen equivalentes; separación escritura/lectura exigida por el GPS |
| Entidad TypeORM `TareaEntity` + `TareaRepositoryImpl` | Se crean | Adaptador de infraestructura; mapea ↔ dominio |
| `TareasController` + DTOs (crear/actualizar) | Se crean | Borde API con Swagger |
| `docker-compose.yml` + `.env.example` | Se crean | Sin DB local activa; corrige el gap de credenciales hardcoded de `guia.md` §3 |

### Tareas de Implementación

#### Fase 1: Base del proyecto (greenfield)
- [x] **T1: Inicializar proyecto NestJS** — `nest new tareas-webapi --package-manager npm` en la raíz del workspace + `npm i typeorm pg reflect-metadata @nestjs/typeorm class-validator class-transformer @nestjs/swagger @nestjs/config` dentro de `tareas-webapi/` (Base: guia.md §2-3)
- [x] **T2: Base de datos y entorno** — `tareas-webapi/docker-compose.yml` (postgres:16, healthcheck, volume) + `tareas-webapi/.env.example` (`DB_HOST/PORT/USER/PASS/NAME`, `JWT_SECRET`, `JWT_EXPIRES_IN`) + `tareas-webapi/.env` local gitignored (Base: GPS §Seguridad — credenciales solo vía env)
- [x] **T3: Punto de entrada** — `tareas-webapi/src/main.ts`: `reflect-metadata` primero, `ValidationPipe({ whitelist: true, transform: true })`, Swagger en `/docs`, CORS (Base: coding-standards §1-2, guia.md §6/§8)
- [x] **T4: Módulo raíz + config de BD** — `tareas-webapi/src/app.module.ts` con `ConfigModule.forRoot` + `TypeOrmModule.forRootAsync` leyendo env (nunca hardcoded) (Base: coding-standards §4)

#### Fase 2: Borde de seguridad (precondición JWT)
- [x] **T5: Guard JWT** — `tareas-webapi/src/shared/guards/jwt-auth.guard.ts` extendiendo `AuthGuard` de `@nestjs/jwt` (secret de env), aplicado en `/tareas` (Base: coding-standards §4 "autenticación en el borde")

#### Fase 3: Módulo tareas (hexagonal + CQRS)
- [x] **T6: Dominio** — `tareas-webapi/src/modules/tareas/domain/estado-tarea.ts`, `domain/tarea.ts` (invariantes: título no vacío, estado `pendiente`|`completada`, default `pendiente`, `createdAt`), `domain/tarea-repository.port.ts` (interfaz, **sin imports de framework**) (Base: coding-standards §4 ejemplo)
- [x] **T7: Handlers de comando (CQRS)** — `tareas-webapi/src/modules/tareas/application/commands/crear-tarea.handler.ts`, `actualizar-tarea.handler.ts` (404 si no existe, muta vía dominio), `eliminar-tarea.handler.ts` (Base: coding-standards §5)
- [x] **T8: Handlers de query (CQRS)** — `tareas-webapi/src/modules/tareas/application/queries/listar-tareas.handler.ts`, `obtener-tarea.handler.ts` (404 si no existe) (Base: coding-standards §5)
- [x] **T9: Infraestructura** — `tareas-webapi/src/modules/tareas/infrastructure/tarea.entity.ts` (TypeORM), `tarea-repository.impl.ts` (implementa el puerto, mapeo ↔ dominio), `tareas-persistence.module.ts` (Base: coding-standards §1 estructura)
- [x] **T10: Borde API** — `tareas-webapi/src/modules/tareas/api/dto/crear-tarea.dto.ts` (`titulo` IsString/IsNotEmpty, `descripcion` IsOptional), `api/dto/actualizar-tarea.dto.ts` (todo opcional + `@IsIn` para estado), `api/tareas.controller.ts` (delgado: `@Param("id", ParseIntPipe)`, Swagger `@ApiTags/@ApiOperation/@ApiResponse`, `@UseGuards(JwtAuthGuard)`), `tareas.module.ts` (Base: guia.md §6/§8, coding-standards §2)

#### Fase 4: Tests (Jest, 3A, dobles de puertos — coding-standards §7)
- [x] **T11: Tests del dominio** — `tareas-webapi/src/modules/tareas/domain/tarea.spec.ts`: título vacío/espacios → lanza; estado inválido → lanza; default `pendiente`
- [x] **T12: Tests de guard** — `tareas-webapi/src/shared/guards/jwt-auth.guard.spec.ts`: token válido → true; ausente/inválido → 401
- [x] **T13: Tests de handlers (comandos)** — dobles del puerto `TareaRepository` con `jest.fn()`: crear (persiste y devuelve con id + `pendiente`), actualizar inexistente → `NotFoundException`, eliminar inexistente → `NotFoundException`
- [x] **T14: Tests de handlers (queries)** — `listar` devuelve colección; `obtener` inexistente → `NotFoundException`
- [x] **T15: Test de integración del módulo** — `tareas-webapi/src/modules/tareas/tareas.controller.spec.ts` (NestJS `Test.createTestingModule`, dobles de handlers + guard): 201/200/204/404/400 por endpoint (supertest contra el testing module, sin BD real)
- [x] **T16: Verificación final** — `npm run lint` sin errores, `npm run test` 100% passing, `npm run build` OK; smoke manual contra la API con Docker (crear → listar → obtener → actualizar → eliminar, sin token → 401)

### Decisión registrada (decisión pendiente del GPS)

- **`synchronize: true`** solo en desarrollo (vía env `DB_SYNCHRONIZE=true` en `.env` local y docker-compose); las migraciones TypeORM quedan como evolución (ya listada en coding-standards §Evolución). La HU #1 no requiere migraciones.

---

> **Método Ceiba dev-rapido (step-01-plan)** | Usuario: Gerson Sanchez | Fecha: 2026-09-29
