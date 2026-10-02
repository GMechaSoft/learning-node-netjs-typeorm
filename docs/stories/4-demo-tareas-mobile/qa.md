# Casos de Prueba — Historia #4: Demo móvil de tareas (React Native + Expo)

**Historia:** [historia.md](./historia.md) | **Autor:** Gerson Sanchez | **Fecha:** 2026-10-01

## Alcance de las Pruebas

Se prueba el comportamiento de la app móvil de una sola vista contra la API de tareas ya existente: autenticación automática al abrir la app (sin login), listado, crear, actualizar, cambiar estado, eliminar, validación del título, manejo de errores genéricos por código de respuesta y conectividad, y configuración del endpoint de la API por variable de entorno. Queda fuera de alcance: empaquetado nativo (builds de iOS/Android), E2E automatizado, offline/sincronización, filtros u ordenamiento del listado, persistencia de credenciales y cualquier cambio en el backend.

## Precondiciones y Datos Base

- La API de tareas (HU #1 + auth de desarrollo) está accesible en la URL base configurada (defecto `http://localhost:3000`, endpoints `/api/tareas` y `/api/auth/token`).
- **Usuario de demo**: `demo` (fijo en el cliente; la autenticación lo usa sin que el usuario ingrese nada).
- **Sin credenciales preconfiguradas**: la app emite su token sola al abrirse (no hay campo de token ni persistencia).
- **Tareas semilla** (creadas antes de iniciar cada bloque de casos):
  - T-1: título `Comprar leche`, descripción `Dos litros`, estado `pendiente`.
  - T-2: título `Preparar informe`, descripción `Informe del tercer trimestre`, estado `completada`.

## Matriz de Cobertura

| Criterio / Regla | Casos |
|------------------|-------|
| Escenario 1: Autenticación automática al abrir la app | QA-01, QA-09 |
| Escenario 2: Listado al cargar (con tareas) | QA-01 |
| Escenario 2 + detalle UI: estado vacío | QA-02 |
| Escenario 3: Crear una tarea | QA-03 |
| Escenario 4: Actualizar una tarea | QA-04 |
| Escenario 5: Cambiar el estado de una tarea | QA-05 |
| Escenario 6: Eliminar una tarea | QA-06 |
| Escenario 7: Validación de título (crear y actualizar) | QA-07, QA-08 |
| Escenario 8: API caída al abrir la app (error + reintento) | QA-09 |
| Escenario 8: Error 401 → re-emisión automática de token | QA-10 |
| Escenario 8: Error 400 (datos inválidos) | QA-11 |
| Escenario 8: Error 5xx (servidor) | QA-12 |
| Escenario 8: API inaccesible en el endpoint configurado | QA-13 |
| Escenario 9: Puerto/host de la API configurable por variable de entorno | QA-14 |
| Regla: título obligatorio; estados pendiente\|completada; descripción opcional | QA-03, QA-05, QA-07 |

---

## Casos de Prueba

### QA-01: Autenticación automática y listado al abrir la app

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 1 + Escenario 2
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Tareas en la API | T-1 y T-2 (semilla) | La API las devuelve |

- **Pasos:**
  1. Abrir la app móvil con la API accesible, sin haber configurado credenciales previas.
- **Resultado esperado:** La app emite sola el token JWT con el usuario `demo` (sin pantalla ni campo de login) y muestra el listado con las dos tareas: título, descripción y estado de cada una (`Comprar leche` pendiente, `Preparar informe` completada).

### QA-02: Listado vacío

- **Tipo:** Estado UI
- **Prioridad:** Media
- **Cubre:** Escenario 2 (variante sin tareas)
- **Precondiciones:** La API no contiene tareas (se eliminaron las semillas).
- **Pasos:**
  1. Abrir la app móvil.
- **Resultado esperado:** La app muestra el mensaje de estado vacío (no hay tareas) y el formulario de creación disponible.

### QA-03: Crear una tarea

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 3; regla "descripción opcional"; regla "estado inicial pendiente"
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
- **Cubre:** Escenario 4
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
- **Cubre:** Escenario 5; regla "estados permitidos"
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
- **Cubre:** Escenario 6
- **Precondiciones:** Listado cargado con T-1 y T-2.
- **Pasos:**
  1. Solicitar la eliminación de T-1.
- **Resultado esperado:** La tarea ya no aparece en el listado; T-2 permanece; mensaje de éxito.

### QA-07: Validación de título al crear (vacío o solo espacios)

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 7 (crear); regla "título obligatorio"
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Título | (vacío) | Variación A |
  | Título | `   ` (solo espacios) | Variación B |
  | Descripción | `Cualquier texto` | No impide la validación |

- **Pasos:**
  1. Completar el formulario con los valores de una variación y enviarlo.
- **Resultado esperado:** La app no envía la petición a la API y muestra un mensaje de validación indicando que el título es obligatorio. Repetir con la otra variación: mismo comportamiento.

### QA-08: Validación de título al actualizar (vacío o solo espacios)

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 7 (actualizar); regla "título obligatorio"
- **Precondiciones:** Listado cargado con T-1.
- **Datos de prueba:**

  | Campo | Valor | Nota |
  | ----- | ----- | ---- |
  | Título | (vacío) | Variación A |
  | Título | `  ` (solo espacios) | Variación B |

- **Pasos:**
  1. Editar T-1 y vaciar (o dejar solo espacios) su título.
  2. Intentar guardar.
- **Resultado esperado:** La app no envía la petición a la API, muestra el mensaje de validación de título obligatorio y el listado no cambia.

### QA-09: API caída al abrir la app (error genérico + reintento)

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 8 (API inaccesible en la carga inicial); disparador "abrir la app"
- **Precondiciones:** La API está detenida (o en un endpoint inalcanzable).
- **Pasos:**
  1. Abrir la app móvil.
  2. Levantar la API en el endpoint configurado.
  3. Reintentar la carga (o recargar la app).
- **Resultado esperado:** En el paso 1 la app muestra un mensaje genérico de que no se puede conectar al servidor (sin bloquearse ni crashear). En el paso 3 la autenticación automática se completa y el listado se muestra.

### QA-10: Error 401 durante la operación → re-emisión automática de token

- **Tipo:** Integración
- **Prioridad:** Alta
- **Cubre:** Escenario 8 (401); regla "re-emite el token si la sesión lo requiere ante un 401"
- **Precondiciones:** App abierta con token emitido; la API expira o rechaza ese token (ej. token devuelto por otra instancia con distinto secret).
- **Pasos:**
  1. Ejecutar una acción sobre el listado (crear o recargar).
  2. Observar el resultado sin intervención del usuario.
- **Resultado esperado:** La app re-emite el token automáticamente una vez vía `POST /api/auth/token` y repite la acción con el nuevo token; el usuario no ve pantalla de login ni debe reintentar manualmente.

### QA-11: Error 400 (datos inválidos)

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Escenario 8 (400)
- **Precondiciones:** App abierta con listado cargado.
- **Pasos:**
  1. Provocar una petición que la API rechace con `400` (p. ej. título que pasa la validación local pero falla en el servidor).
- **Resultado esperado:** La app muestra el mensaje genérico de datos no válidos y no se bloquea; el usuario puede reintentar la acción.

### QA-12: Error 5xx (error del servidor)

- **Tipo:** Negativo
- **Prioridad:** Media
- **Cubre:** Escenario 8 (5xx)
- **Precondiciones:** La API responde `5xx` a una petición (p. ej. sin base de datos conectada).
- **Pasos:**
  1. Ejecutar una acción sobre el listado (crear o recargar).
- **Resultado esperado:** La app muestra el mensaje genérico de error del servidor y no se bloquea; el usuario puede reintentar.

### QA-13: API inaccesible en el endpoint configurado

- **Tipo:** Negativo
- **Prioridad:** Alta
- **Cubre:** Escenario 8 (conectividad)
- **Precondiciones:** La app corre contra un host/puerto donde no hay API escuchando.
- **Pasos:**
  1. Abrir la app móvil.
- **Resultado esperado:** La app muestra el mensaje genérico de no se puede conectar al servidor (invita a verificar que la API esté en marcha) y no crashea.

### QA-14: Puerto de la API configurable por variable de entorno

- **Tipo:** Positivo
- **Prioridad:** Alta
- **Cubre:** Escenario 9; regla "URL base por `EXPO_PUBLIC_API_BASE_URL`"
- **Precondiciones:** Dos instancias de la API: una en el puerto por defecto `3000` y otra en un puerto distinto (p. ej. `4000`).
- **Pasos:**
  1. Ejecutar la app sin definir `EXPO_PUBLIC_API_BASE_URL` y verificar contra cuál endpoint emite la petición de token.
  2. Ejecutar la app con `EXPO_PUBLIC_API_BASE_URL=http://localhost:4000` y verificar contra cuál endpoint emite la petición de token.
- **Resultado esperado:** En el paso 1 usa `http://localhost:3000`. En el paso 2 usa `http://localhost:4000` para TODAS las peticiones (token y tareas) sin modificar código.

---

**Total de casos:** 14
