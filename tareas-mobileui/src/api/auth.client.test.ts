import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { respuestaJson } from '../test/test-utils';

const TOKEN_API = 'token-emitido-por-api';

describe('auth.client — emitirToken (POST /api/auth/token, sin Bearer)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('hace POST a {API_BASE}/api/auth/token con el usuario y devuelve el token', async () => {
    fetchMock.mockResolvedValueOnce(respuestaJson({ token: TOKEN_API }));
    const { emitirToken } = await import('./auth.client');

    const token = await emitirToken('demo');

    expect(token).toBe(TOKEN_API);
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/auth/token');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body as string)).toEqual({ usuario: 'demo' });
    // Es una ruta pública: NO lleva cabecera Authorization.
    expect((opciones.headers as Record<string, string>).Authorization).toBeUndefined();
  });

  it('usa la URL base configurada por EXPO_PUBLIC_API_BASE_URL (QA-14)', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:4000');
    fetchMock.mockResolvedValueOnce(respuestaJson({ token: TOKEN_API }));
    const { emitirToken } = await import('./auth.client');

    await emitirToken('demo');

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('http://localhost:4000/api/auth/token');
  });

  it('lanza ApiError con el código HTTP cuando el backend rechaza (400)', async () => {
    fetchMock.mockResolvedValueOnce(respuestaJson({ message: 'usuario no debe estar vacío' }, 400));
    const { emitirToken } = await import('./auth.client');

    await expect(emitirToken('  ')).rejects.toMatchObject({ status: 400, name: 'ApiError' });
  });

  it('lanza ApiError de red cuando no hay conexión', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down'));
    const { emitirToken } = await import('./auth.client');

    const error = await emitirToken('demo').catch((e) => e);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe('red');
  });
});
