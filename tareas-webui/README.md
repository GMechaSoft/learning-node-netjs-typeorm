# tareas-webui — UI web de gestión de tareas (HU #2)

SPA de **una sola vista** construida con **Vite + React 19 + TypeScript**. Consume la API REST de tareas (HU #1, [`tareas-webapi`](../tareas-webapi)) y ofrece CRUD completo: listado, crear, actualizar, cambiar estado y eliminar, con autenticación por **nombre de usuario** (emite un token JWT persistente en `localStorage`) y mensajes genéricos de error por código de respuesta.

| | |
|---|---|
| **Stack** | Vite 8, React 19, TypeScript ~6, ESLint (flat config) |
| **Tests** | Vitest + jsdom + Testing Library — 50 tests, cubre QA-01..QA-16 |
| **API base** | `VITE_API_BASE_URL` (default `http://localhost:3000`) |

> Guía completa del stack (backend + frontend): [README raíz](../README.md). Este README cubre solo el frontend.

## Puesta en marcha

### 1. Precondición: la API debe estar levantada

La UI no hace nada sin el backend. Levanta primero (ver [README de la API](../tareas-webapi/README.md)):

```powershell
# Postgres (WSL Ubuntu) + API en http://localhost:3000
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d'
cd tareas-webapi
copy .env.example .env    # si no existe
npm run start:dev
```

### 2. Frontend

```powershell
cd tareas-webui
npm install              # la primera vez
copy .env.example .env   # si no existe (default: http://localhost:3000)
npm run dev              # http://localhost:5173
```

### 3. Usar la UI

1. Abre <http://localhost:5173>.
2. Escribe tu **nombre de usuario** en el campo de autenticación y pulsa **Entrar**. La app solicita el token al backend (`POST /api/auth/token`) y lo guarda en `localStorage` (sobrevive a recargas; cambiar el usuario re-emite). Con *Ver token* lo puedes ver/copiar.
3. Listado, crear, editar, cambiar estado (`pendiente`/`completada`) y eliminar funcionan contra la API.

> La autenticación es por usuario (sin contraseña): el **backend firma el JWT con su `JWT_SECRET`**, que vive en el servidor — el navegador nunca maneja el secret. Todavía no hay registro/login (HU siguiente).

## Variables de entorno

`.env` (crear desde `.env.example`; el `.env` está en `.gitignore`):

| Variable | Default | Descripción |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:3000` | URL base de la API de tareas |

> Para apuntar a otra instancia de la API (otra máquina, otro puerto), crea un `.env` local con esa URL y reinicia `npm run dev`.

## Estructura

```
src/
├── main.tsx                  # Punto de entrada React
├── App.tsx / App.css         # Composición de la vista única
├── config/
│   └── api-config.ts         # API_BASE_URL desde VITE_API_BASE_URL
├── types/
│   └── tarea.ts              # Tarea + EstadoTarea (redefinidos leyendo el backend = frontera)
├── api/
│   ├── tareas.client.ts      # fetch + Bearer + ApiError con mensaje genérico por código (400/401/404/5xx/red)
│   └── auth.client.ts        # emitirToken: POST /api/auth/token (sin Bearer)
├── hooks/
│   ├── use-tareas.ts         # Hook CRUD: lista, crear, actualizar, estado, eliminar, validación, mensajes
│   └── use-usuario.ts        # Login por usuario + token emitido (persistencia localStorage)
├── components/
│   ├── usuario-auth.tsx      # Campo de autenticación: usuario → Entrar → ver/copiar token
│   ├── tarea-form.tsx        # Formulario crear/editar (título obligatorio, descripción opcional)
│   ├── tarea-list.tsx        # Listado: "Cargando…" / vacío / error / items
│   ├── tarea-item.tsx        # Fila: título, descripción, selector de estado, editar, eliminar
│   └── mensajes.tsx          # Mensajes de éxito y error genéricos
└── test/
    └── setup.ts              # Setup Vitest (jsdom + cleanup de Testing Library)
```

**Flujo de datos:** componente → `use-tareas` (estado + validación) → `tareas.client` (HTTP) → API. La autenticación vive en `use-usuario` (usuario + token emitido); el token viaja como header `Authorization: Bearer`.

## Comandos

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo (Vite, HMR) en :5173 |
| `npm run build` | Compila a `dist/` (con type-check de `tsc -b`) |
| `npm run preview` | Sirve el build de producción localmente |
| `npm run lint` | ESLint sobre el proyecto |
| `npm test` | Suite completa (Vitest) — 50 tests |
| `npm run test:watch` | Vitest en modo watch |
| `npm run test:cov` | Suite con cobertura (v8) |

## Reglas de negocio implementadas (ver `historia.md`/`qa.md` de la HU #2)

- **Título obligatorio** (trim): vacío o solo espacios no envía petición a la API.
- **Descripción opcional**; **estado inicial** `pendiente`.
- **URL base configurable** por `VITE_API_BASE_URL`.
- **Login por usuario + token persistente** en `localStorage`; cerrar sesión borra ambos.
- **Errores genéricos por código** (no se exponen detalles): `400` datos inválidos, `401` token ausente/inválido, `404` tarea inexistente, `5xx` error del servidor, `red` no se puede conectar.

---

## Nota sobre el template de Vite

Este proyecto partió del template oficial de Vite (React + TS). Se mantuvo `@vitejs/plugin-react` y la config de ESLint es una **flat config** (`eslint.config.js`) con `tseslint` recommended + `react-hooks` + `react-refresh`, más Vitest/Testing Library para los tests. El template original documenta cómo pasar a reglas type-aware (`tseslint.configs.recommendedTypeChecked`) o añadir `eslint-plugin-react-x`/`eslint-plugin-react-dom`; ver el historial de `eslint.config.js` si quieres esas opciones.
