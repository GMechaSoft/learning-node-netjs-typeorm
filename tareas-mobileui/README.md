# tareas-mobileui — Demo móvil de gestión de tareas (HU #4)

App móvil de una sola vista construida con **React Native + Expo (SDK 57) + TypeScript** que consume la API REST de tareas (HU #1, [`tareas-webapi`](../tareas-webapi)). Ofrece **CRUD completo** — listar, crear, editar, cambiar estado (`pendiente`/`completada`) y eliminar — con **autenticación JWT automática**: la app emite su propio token al iniciar con el usuario de demostración `demo`; **no se pide login**.

| | |
|---|---|
| **Stack** | Expo SDK 57, React Native 0.86, React 19, TypeScript 6, expo-router |
| **Tests** | Vitest + jsdom + `react-test-renderer` — 28 tests, cubre QA-01..QA-14 |
| **API base** | `EXPO_PUBLIC_API_BASE_URL` (default `http://localhost:3000`) |

> Guía completa del stack (backend + frontend): [README raíz](../README.md). Este README cubre solo la app móvil.

## Puesta en marcha

### 1. Precondición: la API debe estar levantada

La app no hace nada sin el backend. Levanta primero (ver [README de la API](../tareas-webapi/README.md)):

```powershell
# Postgres (WSL Ubuntu) + API en http://localhost:3000
wsl -d Ubuntu -- bash -lc 'cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d'
cd tareas-webapi
copy .env.example .env    # si no existe
npm run start:dev
```

### 2. App móvil

```powershell
cd tareas-mobileui
npm install                      # la primera vez
copy .env.example .env.local     # si no existe (default: http://localhost:3000)
npx expo start                   # muestra el QR
```

La app está **dirigida al entorno móvil**: abre **Expo Go** (Android/iOS) en el teléfono y escanea el QR. La app se descarga y corre en el dispositivo.

> **Red:** el teléfono y la máquina con la API deben estar en la **misma red WiFi**, y `EXPO_PUBLIC_API_BASE_URL` debe apuntar a la **IP local** de esa máquina (p. ej. `http://192.168.1.10:3000`), no a `localhost` — en el teléfono, `localhost` es el propio teléfono.
>
> **Conveniencia de desarrollo:** también corre en el navegador con `npx expo start --web` (http://localhost:8081), útil para probar sin teléfono.

### 3. Usar la app

1. Al abrir, la app **autentica sola**: emite el token JWT (`POST /api/auth/token` con el usuario `demo`) y carga el listado. Si un 401 aparece después (token expirado), re-emite una vez y reintenta.
2. Listado, crear (título obligatorio, descripción opcional), editar, cambiar estado y eliminar funcionan contra la API.
3. Los errores se muestran con mensajes genéricos por código de respuesta (mismo criterio que la webui).

> La autenticación es de demostración (sin usuario ni contraseña): el **backend firma el JWT con su `JWT_SECRET`**, que vive en el servidor — la app nunca maneja el secret.

## Variables de entorno

`.env` / `.env.local` (crear desde `.env.example`; ambos están en `.gitignore`):

| Variable | Default | Descripción |
|---|---|---|
| `EXPO_PUBLIC_API_BASE_URL` | `http://localhost:3000` | URL base de la API de tareas (dirección **y puerto**) |

> **Expo inyecta `EXPO_PUBLIC_*` en el bundle en tiempo de build** (no existe `import.meta.env` como en Vite). Para apuntar a otra instancia de la API (otra máquina, otro puerto), define la variable y **reinicia `expo start`**: los cambios no se aplican en caliente.

## Estructura

```
src/
├── app/
│   ├── _layout.tsx               # Stack de expo-router (vista única)
│   └── index.tsx                 # La vista: formulario + listado + mensajes
├── config/
│   └── api-config.ts             # API_BASE_URL desde EXPO_PUBLIC_API_BASE_URL + usuario demo
├── types/
│   └── tarea.ts                  # Tarea + EstadoTarea (redefinidos leyendo el backend = frontera)
├── api/
│   ├── tareas.client.ts          # fetch + Bearer + ApiError con mensaje genérico por código (400/401/404/5xx/red)
│   └── auth.client.ts            # emitirToken: POST /api/auth/token (sin Bearer)
├── hooks/
│   └── use-tareas.ts             # Hook CRUD + autenticación automática (emite token en mount; re-emite 1 vez en 401)
├── components/
│   ├── tarea-form.tsx            # Formulario crear/editar (título obligatorio, descripción opcional)
│   ├── tarea-item.tsx            # Fila: título, descripción, selector de estado, editar, eliminar
│   └── mensajes.tsx              # Mensajes de éxito y error genéricos
│   # + componentes de la plantilla Expo (themed-text, themed-view, ui/collapsible, etc.)
└── test/
    ├── setup.ts                  # Setup Vitest (jsdom + jest-dom)
    └── test-utils.tsx            # renderHook (react-test-renderer: RTL no soporta RN 0.86 / SDK 57)
```

**Flujo de datos:** componente → `use-tareas` (estado + validación + auth) → `tareas.client` (HTTP) → API. El token viaja como header `Authorization: Bearer`.

## Comandos

| Comando | Descripción |
|---|---|
| `npx expo start` | Servidor de desarrollo (Expo) — QR para **Expo Go** (Android/iOS, el entorno dirigido) |
| `npx expo start --web` | Solo la vista web (conveniencia de desarrollo, :8081) |
| `npx tsc --noEmit` | Type-check (obligatorio antes de dar por hecho un cambio) |
| `npx expo lint` | ESLint sobre el proyecto (obligatorio) |
| `npm test` | Suite completa (Vitest) — 28 tests |
| `npm run test:watch` | Vitest en modo watch |

> Al agregar paquetes usa siempre `npx expo install <pkg>` (resuelve las versiones compatibles con el SDK), no `npm install`.

## Reglas de negocio implementadas (ver `historia.md`/`qa.md` de la HU #4)

- **Título obligatorio** (trim): vacío o solo espacios no envía petición a la API.
- **Descripción opcional**; **estado inicial** `pendiente`.
- **API configurable** por `EXPO_PUBLIC_API_BASE_URL` (dirección y puerto; verificado en vivo contra un puerto distinto, :4000).
- **Autenticación JWT automática** con usuario `demo`: emite el token al iniciar; ante un 401 re-emite **una** vez y reintenta.
- **Errores genéricos por código** (no se exponen detalles): `400` datos inválidos, `401` token ausente/inválido, `404` tarea inexistente, `5xx` error del servidor, `red` no se puede conectar.

---

## Nota sobre el template de Expo

Este proyecto partió del template oficial de [`create-expo-app`](https://www.npmjs.com/package/create-expo-app) (blank + expo-router). Se mantuvieron los componentes temáticos de la plantilla (`themed-text`, `themed-view`, etc.); el código de la app vive en `src/app`, `src/api`, `src/hooks`, `src/components` y `src/config`. Para el stack de tests se eligió **Vitest + jsdom + `react-test-renderer`** (React Testing Library no soporta todavía RN 0.86 / Expo SDK 57), con mocks de `globalThis.fetch`.
