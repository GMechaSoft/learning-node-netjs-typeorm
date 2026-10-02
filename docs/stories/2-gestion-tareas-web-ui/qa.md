# Casos de Prueba — Historia #2: UI web de gestión de tareas

**Historia:** [historia.md](./historia.md) | **Autor:** Gerson Sanchez | **Fecha:** 2026-10-01

## Alcance de las Pruebas

Se prueba el comportamiento de la UI de una sola vista contra la API de tareas ya existente: listado, crear, actualizar, cambiar estado, eliminar, autenticación básica con token persistente, validación del título y manejo de errores genéricos por código de respuesta. Queda fuera de alcance: el módulo de registro/login (HU futura), filtros u ordenamiento del listado, comportamiento en pantallas móviles (solo escritorio) y cualquier cambio en el backend.

## Precondiciones y Datos Base

- La API de tareas (HU #1) está accesible en la URL base configurada por variables de entorno (ej. `http://localhost:3000`, endpoints `/api/tareas`).
- **Token válido**: token JWT de desarrollo emitido para la API (no es una credencial real).
- **Token inválido**: cadena `token-invalido-prueba` que la API rechaza.
- **Tareas semilla** (creadas antes de iniciar cada bloque de casos):
  - T-1: título `Comprar leche`, descripción `Dos litros`, estado `pendiente`.
  - T-2: título `Preparar informe`, descripción `Informe del tercer trimestre`, estado `completada`.

## Matriz de Cobertura

| Criterio / Regla | Casos |
|------------------|-------|
| Escenario 1: Listado al cargar (con tareas) | QA-01, QA-16 |
| Escenario 1 + detalle UI: estado vacío y carga | QA-02, QA-16 |
| Escenario 2: Crear una tarea | QA-03 |
| Escenario 3: Actualizar una tarea | QA-04 |
| Escenario 4: Cambiar el estado | QA-05 |
| Escenario 5: Eliminar una tarea | QA-06 |
| Escenario 6: Token persistente (guardar, recargar, reemplazar) | QA-07, QA-08 |
| Escenario 7: Validación de título (crear y actualizar) | QA-09, QA-10 |
| Escenario 8: Error 401 (token inválido) | QA-11 |
| Escenario 8: Error 404 (tarea inexistente) | QA-12 |
| Escenario 8: Error 5xx (servidor) | QA-13 |
| Escenario 8: API inaccesible | QA-14 |
| Escenario 8: Error 400 (datos inválidos) | QA-15 |
| Regla: URL base configurable por variables de entorno | QA-16 |
| Detalle UI: estados de carga | QA-16 |

---

## Casos de Prueba

### QA-01: Listado de tareas al cargar

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 1
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Token | Token válido | Guardado antes de abrir la app |
  | Tareas en la API | T-1 y T-2 (semilla) | La API las devuelve |

- **Pasos:**
  1. Abrir la aplicación en el navegador con el token guardado.
- **Resultado esperado:** Aparece el listado con las dos tareas, mostrando título, descripción y estado de cada una (`Comprar leche` pendiente, `Preparar informe` completada).

### QA-02: Listado vacío

- **Tipo:** Estado UI
- **Prioridad:** Media
- **Cubre:** Escenario 1 (variante sin tareas)
- **Precondiciones:** La API no contiene tareas (se eliminaron las semillas).
- **Pasos:**
  1. Abrir la aplicación en el navegador con el token guardado.
- **Resultado esperado:** La UI muestra el mensaje de estado vacío (no hay tareas) y el formulario de creación disponible.

### QA-03: Crear una tarea

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 2; regla "descripción opcional"; regla "estado inicial pendiente"
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Título | `Leer libro` | Variación A: con descripción |
  | Descripción | `Capítulo 5` | Variación A |
  | Título | `Comprar pan` | Variación B: sin descripción |
  | Descripción | (vacío) | Variación B |

- **Pasos:**
  1. Completar el formulario con los valores de una variación y enviarlo.
- **Resultado esperado:** La tarea aparece en el listado con estado `pendiente`, el formulario queda limpio para la siguiente creación y se muestra un mensaje de éxito. Repetir con la otra variación: también se crea sin descripción.

### QA-04: Actualizar una tarea

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 3
- **Precondiciones:** Listado cargado con T-1.
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Título | `Comprar leche de almendras` | Nuevo título de T-1 |
  | Descripción | `Dos litros` | Sin cambios |

- **Pasos:**
  1. Seleccionar T-1 para editar.
  2. Cambiar el título al nuevo valor y guardar.
- **Resultado esperado:** El listado refleja el nuevo título de la tarea; descripción y estado conservados; mensaje de éxito.

### QA-05: Cambiar el estado de una tarea

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 4; regla "estados permitidos"
- **Precondiciones:** Listado cargado con T-1 (`pendiente`) y T-2 (`completada`).
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Tarea T-1 | `completada` | Transición pendiente → completada |
  | Tarea T-2 | `pendiente` | Transición completada → pendiente |

- **Pasos:**
  1. Cambiar el estado de T-1 a `completada`.
  2. Cambiar el estado de T-2 a `pendiente`.
- **Resultado esperado:** En ambos casos el listado refleja el nuevo estado y se muestra un mensaje de éxito.

### QA-06: Eliminar una tarea

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 5
- **Precondiciones:** Listado cargado con T-2.
- **Pasos:**
  1. Solicitar eliminar T-2.
- **Resultado esperado:** T-2 ya no aparece en el listado y se muestra un mensaje de éxito.

### QA-07: Guardar el token y persistencia entre recargas

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 6
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Token | Token válido | Pegado en el campo de autenticación |

- **Precondiciones:** La UI no tiene ningún token guardado.
- **Pasos:**
  1. Pegar el token en el campo de autenticación y guardarlo.
  2. Recargar la página.
  3. Observar el campo de autenticación y el listado.
- **Resultado esperado:** Tras la recarga el token sigue guardado (el usuario no tiene que volver a pegarlo) y el listado se carga correctamente usando el token.

### QA-08: Reemplazar un token ya guardado

- **Tipo:** Positivo
- **Prioridad:** Media
- **Cubre:** Escenario 6 ("si el token cambia, se usa el nuevo")
- **Precondiciones:** Hay un token guardado y el listado cargado.
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Token nuevo | Otro token válido emitido para la API | Sustituye al anterior |

- **Pasos:**
  1. Pegar el token nuevo en el campo de autenticación y guardarlo.
  2. Recargar la página.
- **Resultado esperado:** El listado se carga con el token nuevo; no queda rastro del token anterior.

### QA-09: Validación de título al crear (sin llamar a la API)

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 7; regla "título obligatorio"
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Título | (vacío) | Variación A |
  | Título | `    ` (solo espacios) | Variación B |
  | Descripción | `Cualquier texto` | No debe importar |

- **Pasos:**
  1. Completar el formulario de creación con una variación y enviarlo.
- **Resultado esperado:** La UI no envía ninguna petición a la API y muestra el mensaje de validación indicando que el título es obligatorio. Repetir con la otra variación: mismo comportamiento.

### QA-10: Validación de título al actualizar (sin llamar a la API)

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 7
- **Precondiciones:** T-1 seleccionada para editar.
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Título | (vacío) | Se borra el título existente |

- **Pasos:**
  1. Borrar el título del formulario y guardar.
- **Resultado esperado:** No se envía petición a la API; se muestra el mensaje de validación de título obligatorio; el listado conserva los valores anteriores de T-1.

### QA-11: Error 401 al cargar el listado (token inválido)

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 8; Escenario 6 (contexto)
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Token | `token-invalido-prueba` | La API responde 401 |

- **Pasos:**
  1. Guardar el token inválido en la UI.
  2. Cargar la aplicación.
- **Resultado esperado:** La UI muestra un mensaje genérico de token ausente o inválido, sin bloquearse; el usuario puede volver al campo de autenticación y guardar un token válido, tras lo cual el listado carga.

### QA-12: Error 404 al actuar sobre una tarea que ya no existe

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Escenario 8
- **Precondiciones:** El listado muestra T-2, pero T-2 fue eliminada directamente a través de la API (por otro cliente) tras cargar la UI.
- **Pasos:**
  1. Intentar eliminar T-2 desde la UI (o editarla).
- **Resultado esperado:** La UI muestra el mensaje genérico de que la tarea no existe, sin bloquearse; el usuario puede reintentar (ej. recargar el listado, donde T-2 ya no aparece).

### QA-13: Error 500 del servidor

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Escenario 8
- **Precondiciones:** La API responde `500` a la petición en curso (condición simulada en la API).
- **Pasos:**
  1. Enviar el formulario de creación con datos válidos.
- **Resultado esperado:** La UI muestra un mensaje genérico de error del servidor, la aplicación no se bloquea y el usuario puede reintentar la acción.

### QA-14: API inaccesible

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Escenario 8
- **Precondiciones:** La API no está en marcha.
- **Pasos:**
  1. Abrir la aplicación (o recargarla) con el token guardado.
  2. Realizar cualquier acción (ej. enviar el formulario de creación).
- **Resultado esperado:** La UI muestra un mensaje genérico de que no se puede conectar al servidor, sin bloquearse; cuando la API vuelve a estar disponible, el reintento de la acción funciona.

### QA-15: Error 400 por datos inválidos en la API

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Escenario 8; regla "mensaje genérico según código"
- **Precondiciones:** La API responde `400` a la petición (condición simulada: el backend rechaza los datos aunque la UI los consideró válidos).
- **Pasos:**
  1. Enviar el formulario de creación con datos que la API rechaza.
- **Resultado esperado:** La UI muestra un mensaje genérico de datos inválidos, sin bloquearse; el usuario puede corregir y reintentar.

### QA-16: URL base configurable por variables de entorno e indicador de carga

- **Tipo:** Integración
- **Prioridad:** Media
- **Cubre:** Regla "URL base configurable por variables de entorno"; detalle UI "estados de carga"
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | URL base (variable de entorno) | URL donde corre una instancia de la API | Diferente de la predeterminada |

- **Pasos:**
  1. Configurar la variable de entorno con la URL de la instancia y abrir la aplicación.
  2. Observar el comportamiento durante una petición (listado o envío del formulario).
- **Resultado esperado:** La aplicación se comunica con la URL configurada (el listado refleja las tareas de esa instancia). Durante las peticiones en vuelo se muestra el indicador "Cargando…" en el listado y el botón de enviar queda deshabilitado hasta que la respuesta llega.

---

**Total de casos:** 16

## Vacíos Detectados

Ninguno — todos los criterios de aceptación y reglas de negocio tienen resultado esperado documentado en `historia.md`.
