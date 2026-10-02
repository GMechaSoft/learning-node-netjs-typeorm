# Casos de Prueba — Historia #3: Empaquetado Docker Demo (Front + Back + BD)

**Historia:** [historia.md](./historia.md) | **Autor:** Gerson Sanchez | **Fecha:** 2026-10-01

## Alcance de las Pruebas

Se prueba que la imagen única del sistema construye, arranca y sirve los tres componentes con la exposición de puertos acordada (front=80, back=8080, BD no expuesta), y que el CRUD funciona de extremo a extremo a través de la contenerización. Queda fuera de alcance: la lógica de negocio de tareas (cubierta en la HU #1), el comportamiento detallado de la UI (cubierto en la HU #2), el módulo de registro/login y la persistencia en volumen.

## Precondiciones y Datos Base

- Workspace con `tareas-webui`, `tareas-webapi` y la configuración de empaquetado (`Dockerfile`, `.dockerignore`, `docker/`, `docker-compose.demo.yml`).
- Daemon Docker disponible en la máquina del evaluador.
- **Datos base:**
  - Token JWT válido de la API (se obtiene del endpoint de auth del back o se genera con el `JWT_SECRET` de `docker/.env`).
  - Tarea de prueba: título `"Tarea demo"`, descripción `"Creada para validar la demo"`, estado `pendiente`.
  - URL de la UI en la demo: `http://localhost` (puerto 80).
  - URL de la API en la demo: `http://localhost:8080`.

## Matriz de Cobertura

| Criterio / Regla | Casos |
| ---------------- | ----- |
| Escenario 1: Construcción de la imagen | QA-01 |
| Escenario 2: Frontend expuesto en el puerto 80 | QA-02 |
| Escenario 3: Backend expuesto en el puerto 8080 | QA-03, QA-04 |
| Regla: BD no expuesta (AC4) | QA-05 |
| Escenario 5: CRUD de extremo a extremo | QA-06, QA-07 |
| Escenario 6: Persistencia efímera | QA-08 |
| Escenario 7: Arranque de conveniencia | QA-09 |
| Regla: token inválido en la UI (continuidad HU #2) | QA-10 |

---

## Casos de Prueba

### QA-01: La imagen se construye sin errores

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 1
- **Pasos:**
  1. Desde la raíz del workspace, ejecutar la construcción de la imagen (`docker compose -f docker-compose.demo.yml build` o `docker build -t tareas-demo .`).
  2. Verificar el final de la salida del build.
- **Resultado esperado:** El build termina sin errores; la imagen queda lista (salida de éxito del build y listado de la imagen).

### QA-02: El frontend se sirve en el puerto 80

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 2
- **Precondiciones:** Contenedor de la demo en ejecución.
- **Pasos:**
  1. Abrir el navegador en `http://localhost` (puerto 80).
  2. Esperar a que la aplicación cargue.
- **Resultado esperado:** Se muestra la aplicación de tareas (vista de listado con el campo de autenticación), sin errores de carga.

### QA-03: La API responde en el puerto 8080 (ruta protegida sin token)

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 3
- **Precondiciones:** Contenedor de la demo en ejecución.
- **Pasos:**
  1. Enviar `GET http://localhost:8080/api/tareas` sin header de autorización.
- **Resultado esperado:** Respuesta `401 Unauthorized` (la API está viva en 8080 y protege la ruta).

### QA-04: El documento Swagger se sirve en el puerto 8080

- **Tipo:** Positivo
- **Prioridad:** Media
- **Cubre:** Escenario 3
- **Precondiciones:** Contenedor de la demo en ejecución.
- **Pasos:**
  1. Enviar `GET http://localhost:8080/docs`.
- **Resultado esperado:** Respuesta `200 OK` con el documento Swagger (OpenAPI) de la API.

### QA-05: La base de datos no está expuesta al host

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Regla "BD no expuesta" (Escenario 4)
- **Precondiciones:** Contenedor de la demo en ejecución.
- **Pasos:**
  1. Inspeccionar los puertos publicados del contenedor (equivalente a `docker port <contenedor>`).
  2. Revisar la lista resultante.
- **Resultado esperado:** Solo aparecen publicados los puertos 80 y 8080; el puerto 5432 **no** aparece en la lista.

### QA-06: CRUD completo de extremo a extremo desde la UI

- **Tipo:** Integración
- **Prioridad:** Alta
- **Cubre:** Escenario 5
- **Precondiciones:** Contenedor en ejecución; UI abierta en `http://localhost`; token JWT válido guardado en el campo de autenticación.
- **Datos de prueba:**

  | Operación | Campo | Valor | Nota |
  | --------- | ----- | ----- | ---- |
  | Crear | título | `Tarea demo` | obligatorio |
  | Crear | descripción | `Creada para validar la demo` | opcional |
  | Actualizar | título | `Tarea demo (editada)` | sobre la tarea creada |
  | Cambiar estado | estado | `completada` | sobre la tarea creada |
  | Eliminar | — | la tarea creada | última operación |

- **Pasos:**
  1. Crear la tarea con los datos de la tabla.
  2. Verificar que aparece en el listado con estado `pendiente`.
  3. Actualizar su título.
  4. Verificar que el listado muestra el nuevo título.
  5. Cambiar su estado a `completada`.
  6. Verificar que el listado muestra el estado `completada`.
  7. Eliminar la tarea.
  8. Verificar que la tarea ya no aparece en el listado.
- **Resultado esperado:** Cada operación se refleja en el listado sin errores; el último listado queda vacío (la tarea fue eliminada); las peticiones viajaron a `http://localhost:8080/api/tareas` (verificable en las herramientas de red del navegador).

### QA-07: La API refleja la persistencia en la BD (extremo a extremo)

- **Tipo:** Integración
- **Prioridad:** Media
- **Cubre:** Escenario 5
- **Precondiciones:** Contenedor en ejecución; token JWT válido.
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | título | `Tarea directa API` | creada vía API |
  | descripción | `Validación back a BD` | opcional |

- **Pasos:**
  1. Crear la tarea con `POST http://localhost:8080/api/tareas` (token en header).
  2. Listar con `GET http://localhost:8080/api/tareas` (token en header).
  3. Cargar la UI en `http://localhost` con el mismo token.
- **Resultado esperado:** `POST` responde `201` con la tarea; el listado de la API incluye la tarea creada; la UI también la muestra en su listado (mismo estado subyacente: la BD).

### QA-08: La persistencia es efímera al recrear el contenedor

- **Tipo:** Borde
- **Prioridad:** Media
- **Cubre:** Escenario 6
- **Precondiciones:** Contenedor en ejecución con al menos una tarea creada (datos base).
- **Pasos:**
  1. Verificar que la tarea existe (listado de la UI o de la API).
  2. Eliminar el contenedor (`docker rm -f`).
  3. Volver a crear y arrancar el contenedor.
  4. Listar las tareas (API o UI, con token válido).
- **Resultado esperado:** El listado queda vacío: la base de datos se re-creó sin los datos de la instancia anterior.

### QA-09: El sistema arranca con el compose de conveniencia

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 7
- **Precondiciones:** Workspace con `docker-compose.demo.yml`; sin contenedores previos de la demo.
- **Pasos:**
  1. Ejecutar `docker compose -f docker-compose.demo.yml up` desde la raíz del workspace.
  2. Esperar a que el sistema esté listo.
  3. Acceder a `http://localhost` y `http://localhost:8080/docs`.
- **Resultado esperado:** El comando arranca el sistema completo; la UI responde en `http://localhost` y la API (Swagger) en `http://localhost:8080/docs`.

### QA-10: Token inválido en la UI muestra el mensaje de autenticación

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Regla "token inválido en la UI" (continuidad HU #2, escenario 7 de esa historia)
- **Precondiciones:** Contenedor en ejecución; UI abierta en `http://localhost`.
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | token | `token-invalido.demo` | token no válido |

- **Pasos:**
  1. Guardar el token inválido en el campo de autenticación.
  2. Observar el comportamiento de la UI al intentar cargar el listado.
- **Resultado esperado:** La UI no muestra tareas y presenta el mensaje de error de token ausente o inválido (el back respondió `401` desde `http://localhost:8080`).

---

**Total de casos:** 10
