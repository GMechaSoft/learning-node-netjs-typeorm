# 🚀 Development Handoff: Documentación de puesta en marcha + reorden de tarjeta de tarea + cambio de autenticación por nombre de usuario

**Date:** 2026-10-01 21:38  
**Repository Branch:** master

---

## 🎯 1. Objective
- Dejar documentada la puesta en marcha completa del sistema (backend + frontend) para que cualquiera pueda levantar los proyectos; reordenar la tarjeta de tarea de la UI (estado junto al título, descripción en medio, botones abajo); y **cambiar la forma de autenticar**: basta con ingresar un nombre de usuario para que el backend emita el token JWT (el `JWT_SECRET` vive en el servidor, nunca en el cliente).

## 📊 2. Current Status
- **Status:** Ready for Testing
- Todo implementado, commiteado Y pushado: HEAD `d45ed9b` = `origin/master` (worktree limpio, 0 pendientes). Verificado end-to-end en vivo antes de parar la infra: `POST /api/auth/token` → 200, el token emitido pasa `GET /api/tareas` → 200, usuario solo-espacios → 400. Tests: **backend 40/40** (35 tareas + 5 auth), **frontend 50/50**, lint 0 en ambos, build OK. **Toda la infra está DETENIDA al cierre de la sesión** (API, UI y Postgres caídos; contenedor `tareas-postgres` y red `tareas-webapi_default` eliminados con `docker compose down`).

## 🗂️ 3. Files in Progress
**Commit `9c4605d` (docs) — guías de puesta en marcha:**
- `README.md` (raíz) — reescrito: precondiciones, pasos de levantamiento (Postgres WSL + `start:dev` + dev UI), paso 3 de token, paso 4 Frontend, estado HUs
- `tareas-webapi/README.md` — reescrito (antes era boilerplate de NestJS): WSL, endpoints, token, variables, DI por token

**Commit `0817844` (feat webui) — tarjeta de tarea + tipado:**
- `tareas-webui/src/components/tarea-item.tsx` — cabecera (título + badge de estado), descripción en medio, acciones abajo
- `tareas-webui/src/components/tarea-item.css` — item a columna, `.tarea-item__cabecera` a fila; eliminadas clases `__contenido`/`__estado`
- `tareas-webui/src/vite-env.d.ts` — tipado de `ImportMetaEnv.VITE_API_BASE_URL`

**Commit `d45ed9b` (feat auth) — 21 archivos, +711/−263:**
- `tareas-webapi/src/modules/auth/api/auth.controller.ts` — `POST /auth/token` pública: firma JWT con `JWT_SECRET` (claim `sub` = usuario), `BadRequestException` si tras el trim queda vacío
- `tareas-webapi/src/modules/auth/api/dto/emitir-token.dto.ts` — `IsString`/`IsNotEmpty`/`MaxLength(120)`
- `tareas-webapi/src/modules/auth/api/auth.controller.spec.ts` — 5 tests (200 verificable con `JwtService.verify`, trim, 400 solo-espacios, 400 vacío, 400 sin usuario)
- `tareas-webapi/src/modules/auth/auth.module.ts` + `tareas-webapi/src/app.module.ts` — registro del módulo
- `tareas-webui/src/api/auth.client.ts` — `emitirToken(usuario)` (fetch POST, sin Bearer)
- `tareas-webui/src/api/auth.client.test.ts` — 4 tests (POST + payload + sin Authorization, URL por env, 400, red)
- `tareas-webui/src/hooks/use-usuario.ts` — `useUsuario()`: persiste `tareas-webui:usuario` + `tareas-webui:token` en localStorage, `iniciarSesion` (emite), `cerrarSesion`, `emitiendo`
- `tareas-webui/src/hooks/use-usuario.test.ts` — 7 tests
- `tareas-webui/src/components/usuario-auth.tsx` + `.css` — campo Usuario + Entrar/Salir + botones Ver/Copiar token
- `tareas-webui/src/App.tsx` + `App.test.tsx` — flujo de login por usuario (7 tests, incl. login interactivo con user-event)
- **Eliminados:** `tareas-webui/src/components/token-auth.tsx`/`.css`, `tareas-webui/src/hooks/use-token.ts`/`.test.ts`
- `tareas-webapi/http/tareas-api.http` — nuevo caso `00 · POST /auth/token`; `@token` vacío (se rellena con el 00); instrucciones actualizadas
- `README.md`, `tareas-webapi/README.md`, `tareas-webui/README.md` — auth por usuario en introducciones, pasos de uso, estructura y tablas de endpoints

## 🛠️ 4. Changes Made
- **Autenticación por usuario (cambio de forma de autenticar):** nueva ruta pública `POST /api/auth/token` en `modules/auth` (NestJS, DI de `JwtService` global). El backend firma el token con su `JWT_SECRET` del `.env` y devuelve `{ "token": "..." }`. La UI (`usuario-auth` + `use-usuario` + `auth.client`) pide el nombre de usuario, emite el token, lo persiste en `localStorage` y lo usa como `Authorization: Bearer` en `/tareas` (validado por `JwtAuthGuard`, sin cambios en el guard). El navegador nunca maneja el secret. Todavía no hay registro/login: cualquier usuario no vacío emite un token.
- **Tarjeta de tarea:** `tarea-item.tsx` reestructurado (cabecera título+estado / descripción / acciones abajo) + `vite-env.d.ts` tipando la variable de entorno.
- **Documentación:** 3 READMEs + `.http` alineados con la nueva auth (el comando manual de `jsonwebtoken` queda como nota histórica; el flujo canónico es `POST /auth/token`).
- **Infra al cierre:** los 3 servicios detenidos (API watch, Vite, Postgres) a petición del usuario.

## ⚠️ 5. Attempts and Failures
- **`IsNotEmpty` deja pasar `'   '` (solo espacios)**
  - *Result:* test 400 devolvió 200 (el pipe valida vacío literal, no trim). Corrección: chequeo explícito `if (usuario.length === 0) throw new BadRequestException` tras el `trim()` en `auth.controller.ts` (el DTO sigue con `IsNotEmpty` para el string vacío; 2 tests de 400, uno por camino).
- **`instanceof ApiError` tras `vi.resetModules()`**
  - *Result:* `expected ApiError ... to be an instance of ApiError` en `auth.client.test.ts`: el import dinámico post-reset instancia una clase `ApiError` distinta a la importada estáticamente. Corrección: comprobar por propiedades (`error.name === 'ApiError'`, `error.status === 'red'`) como hacen los tests existentes; se quitó el import estático.
- **`npx jest` sin flag ESM**
  - *Result:* `Must use import to load ES Module: .../@nestjs/common/index.js`. Corrección: usar siempre `npm run test` (el script lleva `node --experimental-vm-modules`).
- **`Set-Location` perdido al simplificarse el comando async**
  - *Result:* `npm run start:dev` corrió en la raíz del workspace → `ENOENT package.json`. Corrección: reenviar el comando con el `Set-Location` al mismo terminal.
- **HMR Vite `ReferenceError: TokenAuth is not defined`**
  - *Result:* error transitorio durante la edición (HMR capturó una versión intermedia de `App.tsx` con imports nuevos y JSX viejo al borrar `token-auth`). Se resolvió solo con la actualización HMR final; tests 50/50 lo confirman.
- **IDE: `Cannot find module './modules/tareas/tareas.module'` en `app.module.ts`**
  - *Result:* falso positivo del language server (cache). `npm run build` (nest build) compila en verde y el watch de la API arrancó el módulo sin problema.

## 🔮 6. Next Steps (Pending Tasks)
1. Levantar la infra si se va a seguir trabajando (ahora todo está caído): Postgres WSL (`wsl -d Ubuntu -- bash -lc 'cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d'`), API (`npm run start:dev` en `tareas-webapi`), UI (`npm run dev` en `tareas-webui`).
2. HU siguiente — registro/login real: hoy `POST /auth/token` emite el token con cualquier usuario no vacío; falta persistencia de usuarios, contraseña y verificación (precondición operativa pendiente que quedó cubierto su esqueleto con el módulo `auth`).
3. Medición COSMIC/PNF de HU #1 y HU #2 (ambas `SIN_MEDICION`): primero `/ceiba-generar-strategy` (crear/aprobar `docs/cosmic/measurement-strategy.json`) y luego `/ceiba-medir-historia` por historia.
4. Recalibrar `docs/architecture/coding-standards.md` contra el código real (follow-up greenfield anotado en `dev-record.md` y `cambios.md`).
