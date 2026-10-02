/**
 * Cliente HTTP fino de autenticación contra la API (HU #1 + auth de desarrollo).
 * Contrato: `tareas-webapi/src/modules/auth/api/auth.controller.ts`.
 * Sin librerías: `fetch` + `async/await` (estándar §5), errores nunca se tragan:
 * se mapean a un `ApiError` (reutiliza el del cliente de tareas).
 */
import { API_BASE_URL } from '../config/api-config';
import { ApiError, mapearError } from './tareas.client';

/**
 * Solicita un token JWT al backend a partir de un nombre de usuario.
 * `POST /api/auth/token` → 200 `{ token: string }`. Ruta pública: no lleva Bearer.
 */
export async function emitirToken(usuario: string): Promise<string> {
  let respuesta: Response;
  try {
    respuesta = await fetch(`${API_BASE_URL}/api/auth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario }),
    });
  } catch {
    throw new ApiError('red', mapearError('red'));
  }
  if (!respuesta.ok) {
    throw new ApiError(respuesta.status, mapearError(respuesta.status));
  }
  const datos = (await respuesta.json()) as { token: string };
  return datos.token;
}
