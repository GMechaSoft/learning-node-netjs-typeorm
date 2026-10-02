# learning-node-netjs-typeorm

Repositorio de aprendizaje y desarrollo del **Sistema de Gestión de Tareas**: una API REST con **NestJS v12 + TypeScript + TypeORM + PostgreSQL**, construida siguiendo el **Método Ceiba** (historias de usuario → plan → implementación → cierre con medición COSMIC/PNF).

| | |
|---|---|
| **Stack** | Node.js ≥18 (dev: 24), TypeScript 6, NestJS 12, TypeORM, PostgreSQL 16, Jest 30 |
| **Arquitectura** | Hexagonal + CQRS + DDD táctico (dominio sin dependencias de framework) |
| **Linter / Format** | oxlint (`lint`) + Prettier (`singleQuote: true, trailingComma: all`) |
| **Infra local** | Docker vía **WSL Ubuntu** (no usar Rancher Desktop) |

## Estructura del repositorio

```
.
├── tareas-webapi/              # API REST (NestJS) — código fuente del sistema
│   ├── src/
│   │   ├── main.ts             # Bootstrap: prefix /api, ValidationPipe global, Swagger /docs
│   │   ├── app.module.ts
│   │   ├── modules/tareas/
│   │   │   ├── domain/         # Entidad Tarea, estado, puerto TareaRepository (token DI)
│   │   │   ├── application/    # CQRS: commands (crear/actualizar/eliminar) + queries (listar/obtener)
│   │   │   ├── infrastructure/ # Adaptador TypeORM (entity, repository impl, módulo)
│   │   │   └── api/            # Borde: controller + DTOs (class-validator)
│   │   ├── modules/auth/       # Auth de desarrollo: emite token JWT por usuario (POST /auth/token)
│   │   └── shared/guards/      # JwtAuthGuard (CanActivate + JwtService)
│   ├── http/tareas-api.http    # 14 casos de prueba REST Client (ext. humao.rest-client)
│   ├── smoke-hu1.js            # Smoke test 14/14 contra la API viva
│   ├── docker-compose.yml      # PostgreSQL 16 con healthcheck
│   └── .env.example            # Variables de entorno de referencia
├── tareas-webui/               # UI web (SPA React) — HU #2
│   ├── src/
│   │   ├── main.tsx            # Punto de entrada React
│   │   ├── App.tsx             # Composición de la vista única
│   │   ├── config/             # api-config (VITE_API_BASE_URL)
│   │   ├── types/              # Tarea (redefinida leyendo el backend = frontera)
│   │   ├── api/                # tareas.client + auth.client (fetch + Bearer + ApiError por código)
│   │   ├── hooks/              # use-tareas (CRUD) + use-usuario (login + token en localStorage)
│   │   └── components/         # usuario-auth, tarea-form, tarea-list, tarea-item, mensajes
│   ├── vitest.config.ts        # Tests Vitest + jsdom + Testing Library
│   ├── .env.example            # VITE_API_BASE_URL
│   └── README.md               # Puesta en marcha del frontend
├── docs/
│   ├── architecture/           # GPS arquitectónico + coding-standards
│   └── stories/                # Historias de usuario (Método Ceiba), 1 por carpeta
├── memories/                   # Memoria del proyecto: guías de hallazgos (WSL/Docker, etc.)
├── .ceiba-metodo/              # Tooling del Método Ceiba (hu, plan, implement, medición)
├── guia.md                     # Guía de referencia NestJS + TypeORM + PostgreSQL
└── handoff.md                  # Snapshot de estado del desarrollo (handoff entre sesiones)
```

## Puesta en marcha

### 1. Base de datos (Docker en WSL Ubuntu)

> Preferencia del proyecto: usar **siempre** el Docker del WSL Ubuntu. El daemon corre como servicio y no requiere arranque manual.

```powershell
# Subir Postgres (desde PowerShell de Windows)
wsl -d Ubuntu -- bash -lc "cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d"

# Verificar healthy (~5-10s tras el arranque)
wsl -d Ubuntu -- bash -lc "docker ps --filter name=tareas-postgres"

# Bajar (agregar -v para borrar datos)
wsl -d Ubuntu -- bash -lc "cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose down"
```

⚠️ **Comillas**: usa **comillas simples** para comandos bash embebidos en PowerShell si contienen `$`, `{{}}` o redirects — con dobles, PowerShell los expande y corrompe el comando. Detalle completo en [`memories/guia-wsl-docker.md`](memories/guia-wsl-docker.md).

### 2. API

```bash
cd tareas-webapi
npm install
copy .env.example .env        # Windows (o: cp .env.example .env)
npm run start:dev             # http://localhost:3000 — Swagger en /docs
```

Variables de entorno (`.env`):

| Variable | Default | Descripción |
|---|---|---|
| `DB_HOST` / `DB_PORT` | `localhost` / `5432` | PostgreSQL |
| `DB_USER` / `DB_PASSWORD` / `DB_NAME` | `postgres` / `postgres` / `tareas_db` | Credenciales BD |
| `DB_SYNCHRONIZE` | `true` | Solo desarrollo; en producción usar migraciones |
| `JWT_SECRET` | — | **Obligatorio cambiar en producción** |
| `JWT_EXPIRES_IN` | `1h` | Vigencia del token |

### 3. Token JWT (autenticación por nombre de usuario)

Basta un **nombre de usuario**: la API emite el token JWT (firmado con su `JWT_SECRET`, que vive en el backend y nunca en el cliente). Es la ruta pública de autenticación de desarrollo:

```powershell
# Emite un token para un usuario (200 -> { "token": "..." })
Invoke-RestMethod -Uri "http://localhost:3000/api/auth/token" -Method POST -ContentType "application/json" -Body '{"usuario":"gerson.sanchez"}'
```

- **UI:** solo se pide el usuario en el campo de autenticación; la app llama a `POST /api/auth/token` y guarda el token en `localStorage`.
- **REST Client:** usa `POST {{baseUrl}}/auth/token` del [`.http`](tareas-webapi/http/tareas-api.http) para obtener el token y pegarlo en `@token`.

> Todavía no hay registro/login: cualquier usuario no vacío emite un token (el claim `sub` es el nombre). Ver tabla de endpoints.

### 4. Frontend (UI — HU #2)

```powershell
cd tareas-webui
npm install              # la primera vez
copy .env.example .env   # si no existe (default: http://localhost:3000)
npm run dev              # http://localhost:5173
```

Abre <http://localhost:5173>, escribe tu **nombre de usuario** en el campo de autenticación y pulsa **Entrar** (la app emite el token y lo guarda en `localStorage`). CRUD completo contra la API. Ver [`tareas-webui/README.md`](tareas-webui/README.md).

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
cd tareas-webapi
npm test                  # Unitarios + integración (Jest 30) — 35/35
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

## Decisión de arquitectura destacada: DI por token

La interfaz `TareaRepository` (en `domain/tarea-repository.port.ts`) es un tipo de TypeScript que se borra en runtime, por lo que NestJS no puede resolverla por nombre. Se inyecta con un `unique symbol`:

```typescript
export const TAREA_REPOSITORY = Symbol('TAREA_REPOSITORY');
// handlers:  constructor(@Inject(TAREA_REPOSITORY) private readonly repo: TareaRepository) {}
// módulo:    { provide: TAREA_REPOSITORY, useValue: TareaRepositoryImpl }
```

Así el dominio nunca importa TypeORM: el adaptador vive en `infrastructure/` y se pluguea en el módulo de persistencia.

## Estado del proyecto

- **HU #1** (CRUD de tareas, API): cerrada — 35/35 tests, smoke 14/14, flujo `.http` 14/14. Ver [`docs/stories/1-gestion-tareas-api/`](docs/stories/1-gestion-tareas-api/).
- **HU #2** (UI web de tareas): cerrada — 43 tests (Vitest), QA-01..QA-16 cubiertos, lint 0, build OK. Ver [`docs/stories/2-gestion-tareas-web-ui/`](docs/stories/2-gestion-tareas-web-ui/).
- **Pendiente:** módulo auth con registro/login real (hoy la autenticación de desarrollo emite el token con cualquier usuario vía `POST /auth/token`) y medición COSMIC/PNF de ambas HUs (requiere `docs/cosmic/measurement-strategy.json` aprobada; hoy `SIN_MEDICION`).
- Snapshot detallado de la última sesión: [`handoff.md`](handoff.md).
