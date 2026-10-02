# Historia de Usuario

**Como** usuario final de la aplicación de tareas,
**Quiero** gestionar mis tareas (ver el listado, crear, actualizar, cambiar el estado y eliminar) desde una única vista web,
**Para** trabajar con practicidad y usabilidad sin necesidad de usar herramientas de API.

## Descripción

Esta historia define la primera interfaz de usuario web de la aplicación de tareas: una aplicación React (TypeScript, JSX) alojada en `/tareas-webui` (código fuente en `/tareas-webui/src`). La UI cubre el CRUD completo de tareas consumiendo la API REST existente (`tareas-webapi`, entregada en la HU #1): listar, crear, obtener, actualizar y eliminar, en una sola vista con formulario inline.

La autenticación es básica: un campo para ingresar el token JWT (el módulo de registro/login es una HU futura); el token se persiste entre recargas. La UI interpreta los códigos de respuesta de la API y muestra mensajes de error genéricos. La URL base de la API se configura por variables de entorno. El estilo es mínimo, con CSS propio separado por componente (sin librerías de UI).

Una tarea tiene tres campos: título (obligatorio), descripción (opcional) y estado ("pendiente" o "completada").

---

## Criterios de Aceptación

### Escenario 1: Listado de tareas al cargar

- **Dado** que la UI está abierta en el navegador con un token JWT válido ya configurado y existe al menos una tarea en la API
- **Cuando** la aplicación se carga
- **Entonces** la UI muestra el listado de tareas devuelto por la API (título, descripción y estado de cada una)

### Escenario 2: Crear una tarea

- **Dado** que la UI está cargada mostrando el listado de tareas
- **Cuando** el usuario completa el formulario con título (obligatorio) y descripción (opcional) y envía
- **Entonces** la UI crea la tarea vía la API, la lista se actualiza mostrando la nueva tarea con estado "pendiente" y el formulario queda limpio para la siguiente creación

### Escenario 3: Actualizar una tarea

- **Dado** que existe una tarea en el listado
- **Cuando** el usuario modifica su título y/o descripción y guarda los cambios
- **Entonces** la UI actualiza la tarea vía la API y el listado refleja los nuevos valores

### Escenario 4: Cambiar el estado de una tarea

- **Dado** que existe una tarea en el listado con estado "pendiente" (o "completada")
- **Cuando** el usuario cambia su estado al otro valor
- **Entonces** la UI persiste el cambio vía la API y el listado refleja el nuevo estado

### Escenario 5: Eliminar una tarea

- **Dado** que existe una tarea en el listado
- **Cuando** el usuario solicita eliminarla
- **Entonces** la UI elimina la tarea vía la API y la tarea ya no aparece en el listado

### Escenario 6: Autenticación básica con token persistente

- **Dado** que la UI no tiene un token guardado
- **Cuando** el usuario pega un token JWT en el campo de autenticación y lo guarda
- **Entonces** la UI lo persiste (sobrevive a la recarga de la página) y lo adjunta a todas las peticiones a la API; si el token cambia, se usa el nuevo

### Escenario 7: Validación de datos al crear/actualizar

- **Dado** que el formulario de crear o actualizar tiene el título vacío (o solo espacios)
- **Cuando** el usuario intenta enviar el formulario
- **Entonces** la UI no envía la petición a la API y muestra un mensaje de validación indicando que el título es obligatorio

### Escenario 8: Errores de la API con mensaje genérico

- **Dado** que una petición a la API retorna `400` (datos inválidos), `401` (token ausente o inválido), `404` (tarea inexistente) o `5xx` (error del servidor), o la API no está accesible
- **Cuando** la UI recibe la respuesta de error
- **Entonces** muestra un mensaje genérico apropiado al tipo de error (sin bloquear la aplicación; el usuario puede reintentar la acción)

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** usuario final de la aplicación de tareas (sin roles; cualquier usuario con token válido gestiona todas las tareas)
- **Permisos requeridos:** token JWT válido (ingresado a mano; el registro/login es una HU futura)
- **Valor de negocio:** practicidad y usabilidad — gestionar tareas desde una pantalla web en lugar de consumir la API con herramientas de API (Swagger/REST Client)

### Reglas de Negocio

- El título es obligatorio y no puede estar vacío; la descripción es opcional.
- Estados permitidos: "pendiente" (valor inicial al crear) y "completada".
- El listado muestra todas las tareas (sin filtros ni paginación — fuera del alcance de esta historia).
- La UI muestra un mensaje de error genérico según el código de respuesta de la API (400, 401, 404, 5xx) o de conectividad (API inaccesible).
- El token JWT se persiste en el navegador entre recargas.
- La URL base de la API es configurable mediante variables de entorno.

### Interfaz

Una única vista (SPA) que contiene:

- Campo de autenticación para el token JWT (guardado persistente).
- Formulario de tarea (título, descripción, estado) con modo crear y modo actualizar.
- Listado de tareas con acciones de actualizar, cambiar estado y eliminar.
- Zona de mensajes de estado (éxito/validación/error).

#### Detalle de Interfaz de Usuario

- **Diseño general:** una sola vista (SPA), desktop-first (sin breakpoints — fuera de alcance ser responsive a móvil/tablet); sin navegación entre pantallas; formulario y listado coexisten en la misma pantalla.
- **Estados de carga:** indicador simple durante las peticiones en vuelo (texto "Cargando…" en el listado y botón enviar deshabilitado mientras la acción está pendiente); sin esqueletos ni transiciones complejas.
- **Campos y controles:**
  - Token JWT: campo de texto + acción de guardar (persistente entre recargas).
  - Formulario de tarea: título (texto, obligatorio), descripción (texto multilínea, opcional), estado (selector: pendiente/completada, solo relevante en modo actualizar/creación), botones Enviar y Cancelar.
  - Listado: una fila por tarea con título, descripción, estado y acciones (editar, cambiar estado, eliminar).
- **Flujo de navegación visual:** carga de la app → listado (o mensaje de vacío) → crear con el formulario o actuar sobre una fila existente (editar / cambiar estado / eliminar) → listado actualizado.
- **Mensajes y feedback:** mensajes genéricos de éxito y de error interpretados por código HTTP (400/401/404/5xx) o por inaccesibilidad de la API; mensaje de validación de título obligatorio sin llamar a la API.

### Sistemas Externos

- API REST de tareas (`tareas-webapi`, HTTP/JSON + Bearer JWT) — backend del mismo proyecto, ya existente (HU #1); la UI solo lo consume.

### Disparadores

- El usuario abre la aplicación de tareas en el navegador
- El usuario envía el formulario para crear una tarea (se puede relanzar con cada nueva creación)
- El usuario guarda los cambios de una tarea existente (se puede relanzar con cada edición)
- El usuario cambia el estado de una tarea (se puede relanzar con cada cambio)
- El usuario solicita eliminar una tarea
- El usuario ingresa o actualiza su token JWT (se puede relanzar si el token cambia o expira)
- La API responde con un error a cualquiera de las peticiones (se puede relanzar con un nuevo intento de la acción)

### Entidades del Dominio

- Tarea

### Alcance y Continuidad

Esta historia extiende la HU #1 (API de gestión de tareas — CRUD completo, ya desarrollada y verificada): la UI es el primer consumidor con interfaz de ese backend, que se consume únicamente vía HTTP/JSON con token JWT (sin modificar su código). Es la primera interfaz de usuario del proyecto: no existe UI previa, manual ni parcial que esta historia extienda o reemplace.

Quedan fuera del alcance: el módulo de registro/login (HU futura — hoy el token se ingresa a mano), filtros u ordenamiento del listado, y cualquier cambio al backend. El listado muestra todas las tareas, sin filtros ni paginación.

### Preview de Interfaz

**Preview:** [2.preview.md](2.preview.md) | **Formato:** mermaid

---

## Contexto y Referencias

**Arquitectura:** `docs/architecture/index.md` (GPS: sistema de gestión de tareas — backend NestJS; esta HU añade el contenedor de UI que consume la API) + `docs/architecture/coding-standards.md`
**Historias relacionadas:** HU #1 `1-gestion-tareas-api` (API REST de tareas — precondición, ya desarrollada)
**Lecciones aprendidas:** ninguna

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente
- [ ] Mensajes implementados
