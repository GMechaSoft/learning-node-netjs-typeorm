import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const TOKEN_API = 'token-emitido-por-api';

function respuestaJson(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('auth.client — emitirToken (POST /api/auth/token, sin Bearer)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('hace POST a {API_BASE}/api/auth/token con el usuario y devuelve el token (QA-auth)', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ token: TOKEN_API }));
    const { emitirToken } = await import('./auth.client');

    const token = await emitirToken('gerson.sanchez');

    expect(token).toBe(TOKEN_API);
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/auth/token');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body as string)).toEqual({ usuario: 'gerson.sanchez' });
    expect(opciones.headers).toMatchObject({ 'Content-Type': 'application/json' });
    // Es una ruta pública: NO lleva cabecera Authorization.
    expect((opciones.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('usa la URL base configurada por variable de entorno', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://mi-instancia:4000');
    fetchMock.mockResolvedValue(respuestaJson({ token: TOKEN_API }));
    const { emitirToken } = await import('./auth.client');

    await emitirToken('ana');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('http://mi-instancia:4000/api/auth/token');
  });

  it('lanza ApiError con el código HTTP cuando el backend rechaza (400)', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ message: 'usuario no debe estar vacío' }, 400));
    const { emitirToken } = await import('./auth.client');

    await expect(emitirToken('  ')).rejects.toMatchObject({ status: 400, name: 'ApiError' });
  });

  it('lanza ApiError de red cuando no hay conexión', async () => {
    fetchMock.mockRejectedValue(new TypeError('network down'));
    const { emitirToken } = await import('./auth.client');

    const error = await emitirToken('ana').catch((e) => e);
    // Comprobar por propiedades (no instanceof): tras vi.resetModules() el módulo
    // dinámico instancia una clase ApiError distinta a la importada estáticamente.
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe('red');
  });
});
