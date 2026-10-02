# Historia de Usuario

**Como** usuario final de la aplicación de tareas,
**Quiero** gestionar mis tareas (ver el listado, crear, actualizar, cambiar el estado y eliminar) desde una aplicación móvil,
**Para** trabajar desde el teléfono sin dependencias de navegador ni herramientas de API, con autenticación transparente.

## Descripción

Esta historia define un **demo** de la interfaz móvil de la aplicación de tareas: una app React Native + Expo + TypeScript (Expo Router) en `/tareas-mobileui` (código fuente en `/tareas-mobileui/src`), que cubre el CRUD completo de tareas consumiendo la API REST existente (`tareas-webapi`, HU #1): listar, crear, obtener, actualizar y eliminar.

La autenticación es **automática y transparente**: al abrir la app, el cliente solicita un token JWT al endpoint público de desarrollo `POST /api/auth/token` con el nombre de usuario fijo `demo` (no hay pantalla de login ni campo de usuario) y adjunta el token a todas las peticiones a la API. Si la emisión falla (API caída o error), la app muestra un mensaje de error genérico y permite reintentar; no hay persistencia de credenciales en el dispositivo.

La URL base de la API es **configurable mediante variable de entorno** (`EXPO_PUBLIC_API_BASE_URL`, valor por defecto `http://localhost:3000`), lo que permite apuntar el demo a un puerto de API distinto sin modificar código.

El estilo reutiliza el design system de la plantilla Expo (componentes temados `ThemedText`/`ThemedView` de la plantilla); no se introducen librerías de UI externas.

Una tarea tiene tres campos: título (obligatorio), descripción (opcional) y estado ("pendiente" o "completada").

---

## Criterios de Aceptación

### Escenario 1: Autenticación automática al abrir la app

- **Dado** que la app móvil se abre y la API está accesible
- **Cuando** la app completa su carga inicial
- **Entonces** el cliente ha emitido un token JWT vía `POST /api/auth/token` con el usuario `demo` (sin que el usuario ingrese nada) y el listado de tareas se muestra autenticado

### Escenario 2: Listado de tareas al cargar

- **Dado** que la app está cargada con autenticación automática completada y existe al menos una tarea en la API
- **Cuando** la aplicación se carga
- **Entonces** la app muestra el listado de tareas devuelto por la API (título, descripción y estado de cada una)

### Escenario 3: Crear una tarea

- **Dado** que la app está cargada mostrando el listado de tareas
- **Cuando** el usuario completa el formulario con título (obligatorio) y descripción (opcional) y envía
- **Entonces** la app crea la tarea vía la API, el listado se actualiza mostrando la nueva tarea con estado "pendiente" y el formulario queda limpio para la siguiente creación

### Escenario 4: Actualizar una tarea

- **Dado** que existe una tarea en el listado
- **Cuando** el usuario modifica su título y/o descripción y guarda los cambios
- **Entonces** la app actualiza la tarea vía la API y el listado refleja los nuevos valores

### Escenario 5: Cambiar el estado de una tarea

- **Dado** que existe una tarea en el listado con estado "pendiente" (o "completada")
- **Cuando** el usuario cambia su estado al otro valor
- **Entonces** la app persiste el cambio vía la API y el listado refleja el nuevo estado

### Escenario 6: Eliminar una tarea

- **Dado** que existe una tarea en el listado
- **Cuando** el usuario solicita eliminarla
- **Entonces** la app elimina la tarea vía la API y la tarea ya no aparece en el listado

### Escenario 7: Validación de datos al crear/actualizar

- **Dado** que el formulario de crear o actualizar tiene el título vacío (o solo espacios)
- **Cuando** el usuario intenta enviar el formulario
- **Entonces** la app no envía la petición a la API y muestra un mensaje de validación indicando que el título es obligatorio

### Escenario 8: Errores de la API con mensaje genérico

- **Dado** que una petición a la API retorna `400` (datos inválidos), `401` (token inválido) o `5xx` (error del servidor), o la API no está accesible en el host/puerto configurado
- **Cuando** la app recibe la respuesta de error
- **Entonces** muestra un mensaje genérico apropiado al tipo de error (sin bloquear la aplicación; el usuario puede reintentar la acción o la recarga del listado)

### Escenario 9: Puerto de la API configurable por variable de entorno

- **Dado** que la app se ejecuta con `EXPO_PUBLIC_API_BASE_URL` definida a un host/puerto distinto del por defecto
- **Cuando** la app hace peticiones a la API
- **Entonces** todas las peticiones usan el host/puerto configurado; sin la variable, usa `http://localhost:3000`

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** usuario final de la aplicación de tareas (sin roles; cualquier usuario autenticado gestiona todas las tareas)
- **Permisos requeridos:** ninguno — la autenticación es automática (token emitido con el usuario fijo `demo`; sin pantalla de login)
- **Valor de negocio:** demo funcional de la app en dispositivo móvil que consume el backend existente, demostrando la misma experiencia CRUD que la web (HU #2) y la configuración remota del endpoint de la API

### Reglas de Negocio

- El título es obligatorio y no puede estar vacío (o solo espacios); la descripción es opcional.
- Estados permitidos: "pendiente" (valor inicial al crear) y "completada".
- El listado muestra todas las tareas (sin filtros ni paginación — fuera del alcance).
- Autenticación automática: el usuario fijo es `demo`; el token se emite al arrancar la app, no se persiste en el dispositivo y se re-emite si la sesión lo requiere ante un `401`.
- La URL base de la API se configura con la variable de entorno `EXPO_PUBLIC_API_BASE_URL` (defecto `http://localhost:3000`).
- La app muestra un mensaje de error genérico según el código de respuesta de la API (400, 401, 5xx) o de conectividad (API inaccesible en el endpoint configurado).

### Interfaz

Una única vista principal (SPA móvil, Expo Router) que contiene:

- Formulario de tarea (título, descripción) con modo crear y modo actualizar.
- Listado de tareas con acciones de actualizar, cambiar estado y eliminar.
- Zona de mensajes de estado (éxito/validación/error) y estado de autenticación automática (emitiendo / listo / error con reintento).

#### Detalle de Interfaz de Usuario

- **Diseño general:** una sola vista móvil (reemplaza la pantalla de bienvenida de la plantilla Expo); sin navegación entre pantallas; formulario y listado coexisten en la misma pantalla, scroll vertical; usa el design system de la plantilla (ThemedText/ThemedView, safe area, dark mode).
- **Estados de carga:** spinner nativo (`ActivityIndicator`) durante la emisión del token, el listado y las acciones en vuelo; botón enviar deshabilitado mientras la acción está pendiente.
- **Campos y controles:**
  - Formulario de tarea: título (texto, obligatorio), descripción (texto multilínea, opcional), botones Enviar y Cancelar (solo en modo actualizar).
  - Listado: una tarjeta por tarea con título, descripción, estado y acciones (editar, cambiar estado, eliminar).
- **Flujo de navegación visual:** carga de la app → autenticación automática (breve) → listado (o mensaje de vacío) → crear con el formulario o actuar sobre una tarjeta existente (editar / cambiar estado / eliminar) → listado actualizado.
- **Mensajes y feedback:** mensajes genéricos de éxito y de error interpretados por código HTTP (400/401/5xx) o por inaccesibilidad de la API; mensaje de validación de título obligatorio sin llamar a la API.

### Sistemas Externos

- API REST de tareas (`tareas-webapi`, HTTP/JSON + Bearer JWT) — backend del mismo proyecto, ya existente (HU #1 + auth de desarrollo); la app solo lo consume, sin modificar su código.

### Disparadores

- El usuario abre la aplicación (se dispara la autenticación automática y la carga del listado)
- El usuario envía el formulario para crear una tarea (se puede relanzar con cada nueva creación)
- El usuario guarda los cambios de una tarea existente (se puede relanzar con cada edición)
- El usuario cambia el estado de una tarea (se puede relanzar con cada cambio)
- El usuario solicita eliminar una tarea
- La API responde `401` a una petición (se re-emite el token automáticamente una vez)
- La API responde con un error a cualquiera de las peticiones (se puede relanzar con un nuevo intento de la acción o recargando el listado)

### Entidades del Dominio

- Tarea

### Alcance y Continuidad

Esta historia extiende la HU #1 (API de gestión de tareas — CRUD completo, desarrollada) y replica en móvil el alcance de la HU #2 (UI web de tareas), como **demo**: plantilla Expo ya inicializada (`tareas-mobileui`), sin empaquetado nativo ni E2E (quedan fuera: build de iOS/Android, CI, notificaciones, offline/sincronización, persistencia de credenciales en el dispositivo, filtros/paginación y cualquier cambio al backend). La autenticación automática consume el endpoint público de desarrollo `POST /api/auth/token` (ya existente tras el cambio de autenticación por usuario); no se crea registro/login.

Quedan fuera del alcance: el módulo de registro/login real (HU futura), configuración por UI de la URL de la API (solo variable de entorno de build), soporte multiusuario y paridad completa con la web (p. ej. copiar token).

### Preview de Interfaz

N/A — demo sobre el design system de la plantilla Expo (sin insumos de diseño propios).

---

## Contexto y Referencias

**Arquitectura:** `docs/architecture/index.md` (GPS: sistema de gestión de tareas — backend NestJS; esta HU añade un contenedor de UI móvil de demo que consume la API) + `docs/architecture/coding-standards.md`
**Historias relacionadas:** HU #1 `1-gestion-tareas-api` (API REST de tareas — precondición, desarrollada); HU #2 `2-gestion-tareas-web-ui` (UI web — referente de alcance y de cliente HTTP); auth de desarrollo `POST /auth/token` (cambio de autenticación por usuario, commit `d45ed9b`)
**Lecciones aprendidas:** la webui usa cliente HTTP fino con `fetch` + `async/await` y mapeo de errores por código (`tareas.client.ts`) — se replica la misma estructura de cliente en el demo móvil

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente
- [ ] Mensajes implementados
