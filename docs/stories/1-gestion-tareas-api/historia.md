# Historia de Usuario

**Como** desarrollador backend (consumidor de la API),
**Quiero** crear, listar, obtener por ID, actualizar y eliminar tareas a través de la API REST del sistema de gestión de tareas,
**Para** poder persistir y gestionar los datos de tareas de forma escalable desde cualquier cliente.

## Descripción

Esta historia define el CRUD completo de la entidad **Tarea** mediante una API REST. La API expone los endpoints estándar para crear, listar, obtener por ID, actualizar y eliminar tareas. Todos los escenarios se ejecutan con un usuario ya autenticado (token JWT válido): la autenticación (registro/login) queda fuera del alcance de esta historia. Una tarea tiene tres campos: título (obligatorio), descripción (opcional) y estado ("pendiente" o "completada").

---

## Criterios de Aceptación

### Escenario 1: Crear una tarea (flujo principal)

- **Dado** que un usuario autenticado (token JWT válido)
- **Cuando** envía una petición `POST /tareas` con un cuerpo que incluye título (obligatorio) y descripción (opcional)
- **Entonces** la API responde `201 Created` y devuelve la tarea persistida con su ID generado, estado inicial "pendiente" y fecha de creación

### Escenario 2: Listar tareas

- **Dado** que existen tareas persistidas en la base de datos
- **Cuando** un usuario autenticado envía una petición `GET /tareas`
- **Entonces** la API responde `200 OK` y devuelve la colección de todas las tareas en formato JSON

### Escenario 3: Obtener una tarea por ID

- **Dado** que existe una tarea con un ID conocido en la base de datos
- **Cuando** un usuario autenticado envía una petición `GET /tareas/:id` con ese ID
- **Entonces** la API responde `200 OK` y devuelve los datos completos de esa tarea

### Escenario 4: Actualizar una tarea

- **Dado** que existe una tarea persistida en la base de datos
- **Cuando** un usuario autenticado envía una petición `PUT /tareas/:id` con nuevos valores válidos (título, descripción y/o estado)
- **Entonces** la API responde `200 OK`, devuelve la tarea actualizada y los cambios quedan persistidos en la base de datos

### Escenario 5: Eliminar una tarea

- **Dado** que existe una tarea persistida en la base de datos
- **Cuando** un usuario autenticado envía una petición `DELETE /tareas/:id` con el ID de esa tarea
- **Entonces** la API responde `204 No Content` y la tarea ya no aparece en el listado de tareas

### Escenario 6: Validación de datos y tarea inexistente

- **Dado** que una petición tiene datos inválidos (título ausente o vacío) o un ID que no existe en la base de datos
- **Cuando** se envía un `POST /tareas` sin título, o un `GET /tareas/:id` / `PUT /tareas/:id` / `DELETE /tareas/:id` con un ID inexistente
- **Entonces** la API responde `400 Bad Request` o `422 Unprocessable Entity` con un mensaje de error de validación, o `404 Not Found` con un mensaje indicando que la tarea no existe, en ambos casos sin modificar la base de datos

### Escenario 7: Solicitud no autenticada

- **Dado** que la petición no incluye un token JWT válido
- **Cuando** se envía cualquier petición a los endpoints de `/tareas`
- **Entonces** la API responde `401 Unauthorized` sin procesar la petición

---

## Información Recopilada

### Usuario y Contexto

- **Tipo de usuario:** desarrollador backend (consumidor de la API)
- **Permisos requeridos:** usuario autenticado (token JWT válido)
- **Valor de negocio:** persistir y gestionar los datos de tareas de forma escalable desde cualquier cliente, con una base verificable para el entregable del proyecto (REST API de un sistema de gestión de tareas)

### Reglas de Negocio

- El título es obligatorio y no puede estar vacío.
- La descripción es opcional.
- Estados permitidos: "pendiente" (valor inicial por defecto al crear) y "completada".
- El listado de tareas devuelve todas las tareas, sin filtros ni paginación.
- La autenticación JWT (registro/login) es una precondición y queda fuera del alcance de esta historia.

### Interfaz

API REST con formato de intercambio JSON:

- `POST /tareas` — crear una tarea
- `GET /tareas` — listar tareas
- `GET /tareas/:id` — obtener una tarea por ID
- `PUT /tareas/:id` — actualizar una tarea
- `DELETE /tareas/:id` — eliminar una tarea

Sin interfaz de usuario: esta historia cubre únicamente la API.

### Sistemas Externos

Ninguno.

### Disparadores

- Un usuario autenticado envía una petición para crear una tarea
- Un usuario autenticado solicita el listado de tareas
- Un usuario autenticado solicita el detalle de una tarea por su ID
- Un usuario autenticado envía cambios para actualizar una tarea
- Un usuario autenticado solicita la eliminación de una tarea
- Llega una petición sin token JWT válido (puede relanzarse si el cliente reintenta con token válido)

### Entidades del Dominio

- Tarea

### Alcance y Continuidad

Esta es la primera historia del proyecto: la gestión de tareas no existe aún en el sistema y no hay procesos manuales ni parciales que esta historia extienda o reemplace. El registro y login de usuarios (autenticación JWT) quedan fuera del alcance y se asumen como precondición: todos los escenarios se ejecutan con un usuario ya autenticado. El stack tecnológico (NestJS, PostgreSQL, TypeORM) y los patrones arquitectónicos (CQRS, inyección de dependencias, DDD, hexagonal) son contexto de proyecto que no modifica el alcance de negocio de esta historia.

### Preview de Interfaz

N/A — esta historia no tiene interfaz de usuario (API REST únicamente).

---

## Contexto y Referencias

**Arquitectura:** sin definir (`docs/architecture` no existe aún)
**Historias relacionadas:** ninguna (primera historia del proyecto)
**Lecciones aprendidas:** ninguna

---

## Definición de Terminado (Inicial)

- [ ] Funcionalidad implementada según criterios de aceptación
- [ ] Validaciones funcionando correctamente
- [ ] Mensajes implementados
