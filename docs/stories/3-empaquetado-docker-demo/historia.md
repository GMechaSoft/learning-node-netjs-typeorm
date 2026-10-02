# Historia de Usuario

**Como** usuario que necesita demostrar el proyecto (demostración académica),
**Quiero** empaquetar el frontend, el backend y la base de datos en una única imagen Docker,
**Para** poder arrancar el sistema completo (UI + API + BD) con un solo contenedor y mostrarlo sin montar infraestructura aparte.

## Descripción

Esta historia define el **empaquetado contenedor** del sistema de gestión de tareas como una única imagen Docker de demostración académica. La imagen integra los tres componentes ya entregados:

- **Frontend** (`tareas-webui`): SPA React + TypeScript (entregada en la HU #2).
- **Backend** (`tareas-webapi`): API REST NestJS + TypeORM (entregada en la HU #1), que ya incluye el módulo de auth JWT.
- **Base de datos**: PostgreSQL 16.

Exposición de puertos de la imagen (requisito explícito):

- **Frontend** → expuesto por el puerto **80**.
- **Backend** → expuesto por el puerto **8080**.
- **Base de datos** → **no se expone** (no publica el puerto 5432 al host).

Conexión front→back: el frontend llama al backend en `http://localhost:8080` (el navegador del usuario es el "localhost"), usando el CORS ya habilitado en la API. La URL base se inyecta en el build del front (`VITE_API_BASE_URL`).

Persistencia: **efímera** — la base de datos se crea en el arranque del contenedor y sus datos se pierden al eliminarlo (sin volumen).

Entregables del empaquetado (ubicados en la raíz del workspace, con carpeta de apoyo `docker/`):

- `Dockerfile` (build multi-stage de front + back + imagen base con PostgreSQL).
- `.dockerignore`.
- `docker/` — configuración de apoyo: `nginx.conf`, `entrypoint.sh`, `.env` (variables de runtime) y script de arranque.
- `docker-compose.demo.yml` — arranque de conveniencia (un servicio = la única imagen, publicando 80 y 8080).

La historia **no modifica** la lógica de negocio del front ni del back: reutiliza el código entregado tal cual; solo lo orquesta dentro de un contenedor.

---

## Criterios de Aceptación

### Escenario 1: Construcción de la imagen

- **Dado** el workspace con `tareas-webui`, `tareas-webapi` y la configuración de empaquetado (`Dockerfile`, `.dockerignore`, `docker/`)
- **Cuando** se ejecuta la construcción de la imagen (vía `docker build` o `docker compose -f docker-compose.demo.yml build`)
- **Entonces** la imagen se construye sin errores y contiene el frontend compilado, el backend compilado y el binario de PostgreSQL

### Escenario 2: Frontend expuesto en el puerto 80

- **Dado** el contenedor de la demo en ejecución
- **Cuando** se accede al puerto 80 del contenedor desde el navegador
- **Entonces** se sirve la SPA de tareas (se carga la aplicación y se muestra la vista de listado)

### Escenario 3: Backend expuesto en el puerto 8080

- **Dado** el contenedor de la demo en ejecución
- **Cuando** se envía una petición a la API en el puerto 8080 (p. ej. `GET /api/tareas` sin token, o `GET /docs`)
- **Entonces** la API responde correctamente (`401` para rutas protegidas sin token; `200` y el documento Swagger en `/docs`)

### Escenario 4: Base de datos no expuesta

- **Dado** el contenedor de la demo en ejecución
- **Cuando** se inspeccionan los puertos publicados del contenedor (p. ej. `docker port` / `docker inspect`)
- **Entonces** solo están publicados los puertos 80 y 8080; el puerto 5432 de PostgreSQL **no** está expuesto al host

### Escenario 5: CRUD de extremo a extremo (front → back → BD)

- **Dado** el contenedor en ejecución, la UI cargada en `http://localhost/` (puerto 80) y un token JWT válido en el campo de autenticación
- **Cuando** el usuario crea, lista, actualiza, cambia el estado y elimina una tarea desde la UI
- **Entonces** cada operación viaja del front al back en `http://localhost:8080/api/tareas`, se persiste en PostgreSQL y el listado refleja el cambio de extremo a extremo

### Escenario 6: Persistencia efímera

- **Dado** el contenedor en ejecución con tareas creadas
- **Cuando** se elimina el contenedor (`docker rm -f`) y se vuelve a crear y arrancar
- **Entonces** la base de datos se re-crea vacía (no queda ningún dato de la instancia anterior), porque la demo no monta volumen

### Escenario 7: Arranque de conveniencia

- **Dado** el archivo `docker-compose.demo.yml` en la raíz del workspace
- **Cuando** se ejecuta `docker compose -f docker-compose.demo.yml up`
- **Entonces** el sistema completo (front, back, BD) arranca y es accesible en `http://localhost` (80) y `http://localhost:8080` (API)

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** Usuario final / instructor que debe demostrar el proyecto; persona que consume la demo.
- **Permisos requeridos:** Ninguno (la demo arranca con credenciales internas fijas en `docker/.env`; el acceso a la UI requiere un token JWT como en la HU #2).
- **Valor de negocio:** Mostrar el sistema completo (UI + API + BD) como una sola pieza autocontenida, sin montar PostgreSQL ni la API por separado — adecuado para una demostración académica.

### Reglas de Negocio

- Puertos de la imagen: front=80, back=8080, BD=NO expuesta.
- El front llama al back en `http://localhost:8080` (CORS ya habilitado en la API).
- La BD es efímera (sin volumen); los datos no sobreviven a `docker rm`.
- No se modifica la lógica de negocio del front ni del back: solo se orquestan en un contenedor.
- Las credenciales de BD y el secret JWT provienen de `docker/.env` (variables de runtime), nunca hardcoded en el código (GPS §Seguridad).

### Interfaz

No introduce interfaz nueva: reutiliza la UI de la HU #2 sin cambios. El único cambio de comportamiento perceptible es que la base de la URL de la API pasa a ser `http://localhost:8080` en lugar de `http://localhost:3000`.

### Sistemas Externos

- **PostgreSQL 16** (motor de persistencia) — embebido en la misma imagen.
- **Nginx** (servidor web ligero) — sirve el front estático en el puerto 80.

### Disparadores

- "Se construye la imagen del sistema (docker build / compose build)"
- "Se arranca el contenedor de la demo (docker run / compose up)"
- "El usuario gestiona una tarea desde la UI (crear/listar/actualizar/eliminar)"
- "Se elimina el contenedor (docker rm) y se re-crea"

### Entidades del Dominio

- **Tarea** (entidad del dominio ya definida en la HU #1; aquí solo se transporta y persiste, no se modifica su modelo)

### Alcance y Continuidad

- **Dentro:** empaquetado de los 3 componentes en una imagen; exposición de puertos 80/8080; BD efímera; `docker-compose.demo.yml`; documentación mínima de arranque.
- **Fuera:** auth de registro/login (ya existe el módulo en el back; no se toca); migraciones de BD (se mantiene `DB_SYNCHRONIZE` como en desarrollo); despliegue a cloud; persistencia en volumen; pruebas del front/back (ya cubiertas en HU #1 y #2).

### Preview de Interfaz

Ninguno (no hay cambio de UI).

---

## Contexto y Referencias

**Arquitectura:** `docs/architecture/index.md` (GPS) + `docs/architecture/coding-standards.md`
**Historias relacionadas:** #1 (Gestión de Tareas API), #2 (Gestión de Tareas Web-UI)
**Lecciones aprendidas:** WSL/Docker en este proyecto (`memories/guia-wsl-docker.md`); la BD se levanta con `docker compose` desde `tareas-webapi/`.

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente
- [ ] Mensajes implementados
- [ ] Imagen construida y el contenedor arranca publicando solo 80 y 8080
- [ ] CRUD de extremo a extremo verificado desde la UI
- [ ] BD confirmada no expuesta al host
- [ ] `docker-compose.demo.yml` arranca el sistema con 1 comando
- [ ] Documentación de arranque (cómo build + up + URLs) incluida
