/**
 * Cliente HTTP fino de tareas contra la API de la HU #1 (`/api/tareas`).
 * Contrato: `tareas-webapi/src/modules/tareas/api/tareas.controller.ts`.
 * Adaptación móvil de `tareas-webui/src/api/tareas.client.ts`: fetch + async/await
 * (estándar §5), errores nunca se tragan: se mapean a `ApiError` con mensaje
 * genérico según el código de respuesta.
 */
import { API_BASE_URL } from '../config/api-config';
import type { ActualizarTareaDto, CrearTareaDto, Tarea } from '../types/tarea';

/** Construye los headers para una petición; adjunta Bearer solo si hay token. */
function cabeceras(token: string | null): Record<string, string> {
  const base: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) base.Authorization = `Bearer ${token}`;
  return base;
}

/** Error de API con el código de respuesta HTTP (o `'red'` si no hay conexión). */
export class ApiError extends Error {
  public readonly status: number | 'red';

  constructor(status: number | 'red', mensaje: string) {
    super(mensaje);
    this.name = 'ApiError';
    this.status = status;
  }
}

/** Mensaje genérico apropiado al tipo de error (AC8): por código HTTP o por fallo de red. */
export function mapearError(status: number | 'red'): string {
  switch (status) {
    case 400:
      return 'Los datos enviados no son válidos. Corrige el formulario e inténtalo de nuevo.';
    case 401:
      return 'No se pudo autenticar. Vuelve a abrir la app o reintenta la acción.';
    case 404:
      return 'La tarea solicitada no existe. Refresca el listado e inténtalo de nuevo.';
    default:
      if (status === 'red') {
        return 'No se puede conectar al servidor. Verifica que la API esté en marcha e inténtalo de nuevo.';
      }
      return 'Error del servidor. Inténtalo de nuevo más tarde.';
  }
}

async function pedir<T>(
  ruta: string,
  token: string | null,
  opciones: RequestInit = {},
): Promise<T> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}${ruta}`, { ...opciones, headers: cabeceras(token) });
  } catch {
    throw new ApiError('red', mapearError('red'));
  }
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, mapearError(respuesta.status));
  }
  if (respuesta.status === 204) return undefined as T;
  return (await respuesta.json()) as T;
}

/** Lista todas las tareas. `GET /api/tareas` → 200 `Tarea[]`. */
export async function listarTareas(token: string): Promise<Tarea[]> {
  return pedir<Tarea[]>('/api/tareas', token);
}

/** Crea una tarea. `POST /api/tareas` → 201 `Tarea`. */
export async function crearTarea(token: string, dto: CrearTareaDto): Promise<Tarea> {
  return pedir<Tarea>('/api/tareas', token, {
    method: 'POST',
    body: JSON.stringify(dto),
  });
}

/** Actualiza una tarea (título/descripción/estado). `PUT /api/tareas/:id` → 200 `Tarea`. */
export async function actualizarTarea(
  token: string,
  id: number,
  dto: ActualizarTareaDto,
): Promise<Tarea> {
  return pedir<Tarea>(`/api/tareas/${id}`, token, {
    method: 'PUT',
    body: JSON.stringify(dto),
  });
}

/** Elimina una tarea. `DELETE /api/tareas/:id` → 204. */
export async function eliminarTarea(token: string, id: number): Promise<void> {
  await pedir<void>(`/api/tareas/${id}`, token, { method: 'DELETE' });
}
