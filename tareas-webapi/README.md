# tareas-webapi — API REST de gestión de tareas (HU #1)

API REST construida con **NestJS 12 + TypeScript + TypeORM + PostgreSQL 16**. Arquitectura **hexagonal + CQRS + DDD táctico**: el dominio no depende de frameworks; la persistencia es un adaptador plugueado con DI por token.

| | |
|---|---|
| **Stack** | Node.js (dev: 24), TypeScript 6, NestJS 12, TypeORM, PostgreSQL 16, Jest 30 |
| **Lint / Format** | oxlint (`lint`) + Prettier (`singleQuote: true, trailingComma: all`) |
| **Endpoints** | `/api/tareas` (CRUD, JWT Bearer) · `/api/auth/token` (emisión por usuario) · Swagger en `/docs` |
| **Infra local** | Docker vía **WSL Ubuntu** (no usar Rancher Desktop) |

> Guía completa del stack (backend + frontend): [README raíz](../README.md). Este README cubre solo la API.

## Puesta en marcha

### 1. Base de datos (Docker en WSL Ubuntu)

> Preferencia del proyecto: usar **siempre** el Docker del WSL Ubuntu. El daemon corre como servicio y no requiere arranque manual.

```powershell
# Subir Postgres (desde PowerShell de Windows)
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d'

# Verificar healthy (~5-10s tras el arranque)
wsl -d Ubuntu -- bash -lc 'docker ps --filter name=tareas-postgres'

# Bajar (agregar -v para borrar datos)
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose down'
```

⚠️ **Comillas**: usa **comillas simples** para comandos bash embebidos en PowerShell si contienen `$`, `{{}}` o redirects — con dobles, PowerShell los expande y corrompe el comando. Detalle completo en [`memories/guia-wsl-docker.md`](../memories/guia-wsl-docker.md).

### 2. API

```powershell
cd tareas-webapi
npm install               # la primera vez
copy .env.example .env    # si no existe (Windows; o: cp .env.example .env)
npm run start:dev         # http://localhost:3000 — Swagger en /docs
```

### 3. Token JWT (autenticación por nombre de usuario)

Basta un **nombre de usuario**: el módulo auth (`modules/auth/`) emite el token con su `JWT_SECRET` (vive en el backend, nunca en el cliente). La ruta es pública y devuelve `{ "token": "..." }`:

```powershell
# 200 -> { "token": "eyJ..." }
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/token" -Method POST -ContentType "application/json" -Body '{"usuario":"gerson.sanchez"}'
```

- El token se valida igual que antes en `/tareas` (`JwtAuthGuard`); el claim `sub` es el nombre de usuario.
- **REST Client:** usa `POST {{baseUrl}}/auth/token` de [`http/tareas-api.http`](http/tareas-api.http) para obtenerlo y pegarlo en `@token`.
- **UI:** solo pide el usuario; la app llama a esta ruta y guarda el token en `localStorage`.

> Todavía no hay registro/login: cualquier usuario no vacío emite un token. En producción sustituir por un flujo con credenciales.

## Variables de entorno

`.env` (crear desde `.env.example`; el `.env` está en `.gitignore`):

| Variable | Default | Descripción |
|---|---|---|
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | PostgreSQL |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `postgres` / `postgres` / `tareas_db` | Credenciales BD |
| `DB_SYNCHRONIZE` | `true` | Solo desarrollo; en producción usar migraciones |
| `JWT_SECRET` | — | **Obligatorio cambiar en producción**; firma y verifica tokens |
| `JWT_EXPIRES_IN` | `1h` | Vigencia del token emitido por `/auth/token` |

## Endpoints

Base: `http://localhost:3000/api`. La ruta `/auth/token` es **pública**; el resto requieren `Authorization: Bearer <token>`.

| Método | Ruta | Éxito | Errores |
|---|---|---|---|
| `POST` | `/auth/token` | `200` + `{ token }` (pública) | `400` usuario vacío |
| `POST` | `/tareas` | `201` + tarea creada | `400` título ausente, `401` token |
| `GET` | `/tareas` | `200` + lista | `401` |
| `GET` | `/tareas/:id` | `200` + tarea | `404`, `401` |
| `PUT` | `/tareas/:id` | `200` + tarea actualizada | `400` estado inválido, `404`, `401` |
| `DELETE` | `/tareas/:id` | `204` | `404`, `401` |

**Modelo `Tarea`:** `{ id, titulo, descripcion (nullable), estado: "pendiente" | "completada", creadaEn }`

Documentación interactiva: <http://localhost:3000/docs> (Swagger, con `addBearerAuth` ya configurado).

## Pruebas

```bash
npm test                  # Unitarios + integración (Jest 30) — 40/40 (35 tareas + 5 auth)
npm run test:cov          # Con cobertura
node smoke-hu1.js         # Smoke 14/14 contra API + Postgres vivos
```

**Pruebas manuales (REST Client):** abrir `http/tareas-api.http` en VS Code con la extensión **REST Client** (`humao.rest-client`) y ejecutar cada bloque con el CodeLens *Send Request* (o `Ctrl+Alt+R`). El caso `03` (`# @name crearTarea`) es el ancla del flujo encadenado: ejecutarlo primero.

## Comandos del proyecto

| Comando | Descripción |
|---|---|
| `npm run start:dev` | Desarrollo con watch |
| `npm run start:debug` | Desarrollo con debugger (`--inspect-brk`) |
| `npm run build` | Compila a `dist/` |
| `npm run start:prod` | Ejecuta `dist/main` |
| `npm run lint` | `oxlint --type-aware src/` |
| `npm run format` | Prettier sobre `src/` |

## Producción

- `npm run build` → `dist/`; `npm run start:prod` ejecuta `node dist/main`.
- `DB_SYNCHRONIZE=false` y esquema gestionado con migraciones; `JWT_SECRET` con valor real.

## Decisión de arquitectura destacada: DI por token

La interfaz `TareaRepository` (en `domain/tarea-repository.port.ts`) es un tipo de TypeScript que se borra en runtime, por lo que NestJS no puede resolverla por nombre. Se inyecta con un `unique symbol`:

```typescript
export const TAREA_REPOSITORY = Symbol('TAREA_REPOSITORY');
// handler:  constructor(@Inject(TAREA_REPOSITORY) private readonly repo: TareaRepository) {}
// módulo:   { provide: TAREA_REPOSITORY, useValue: TareaRepositoryImpl }
```

Así el dominio nunca importa TypeORM: el adaptador vive en `infrastructure/` y se pluguea en el módulo de persistencia.

## Estado

- **HU #1** (CRUD de tareas): cerrada — 40/40 tests, smoke 14/14, flujo `.http` 14/14. Ver [`docs/stories/1-gestion-tareas-api/`](../docs/stories/1-gestion-tareas-api/).
- **Auth de desarrollo:** `POST /auth/token` emite el token con un nombre de usuario (cambió la forma de autenticar; el secret vive en el backend).
- **Pendiente:** registro/login real (hoy cualquier usuario no vacío emite un token).

---

*Framework: [NestJS](https://docs.nestjs.com) (MIT).*
