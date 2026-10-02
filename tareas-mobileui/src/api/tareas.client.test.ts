import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { respuestaJson } from '../test/test-utils';

const TOKEN = 'token-demo';

function tareaFixture(id = 1) {
  return {
    id,
    titulo: 'Comprar leche',
    descripcion: 'Dos litros',
    estado: 'pendiente',
    creadaEn: '2026-10-01T00:00:00.000Z',
  };
}

describe('tareas.client — mapearError (AC8)', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('mapea 400 a mensaje de datos no válidos (QA-11)', async () => {
    const { mapearError } = await import('./tareas.client');
    expect(mapearError(400)).toMatch(/no son válidos/);
  });

  it('mapea 401 a mensaje de autenticación', async () => {
    const { mapearError } = await import('./tareas.client');
    expect(mapearError(401)).toMatch(/autenticar/);
  });

  it('mapea 404 a mensaje de tarea inexistente', async () => {
    const { mapearError } = await import('./tareas.client');
    expect(mapearError(404)).toMatch(/no existe/);
  });

  it('mapea 5xx a mensaje genérico de servidor (QA-12)', async () => {
    const { mapearError } = await import('./tareas.client');
    expect(mapearError(500)).toMatch(/servidor/);
    expect(mapearError(503)).toMatch(/servidor/);
  });

  it('mapea el fallo de red a mensaje de conectividad (QA-13)', async () => {
    const { mapearError } = await import('./tareas.client');
    expect(mapearError('red')).toMatch(/conectar al servidor/);
  });
});

describe('tareas.client — peticiones CRUD', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('listarTareas hace GET /api/tareas con Bearer y devuelve el listado', async () => {
    fetchMock.mockResolvedValueOnce(respuestaJson([tareaFixture()]));
    const { listarTareas } = await import('./tareas.client');

    const tareas = await listarTareas(TOKEN);

    expect(tareas).toHaveLength(1);
    expect(tareas[0].titulo).toBe('Comprar leche');
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas');
    expect(opciones.headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` });
  });

  it('crearTarea hace POST con el payload y devuelve la tarea creada (201)', async () => {
    fetchMock.mockResolvedValueOnce(respuestaJson(tareaFixture(2), 201));
    const { crearTarea } = await import('./tareas.client');

    const creada = await crearTarea(TOKEN, { titulo: 'Leer libro', descripcion: 'Capítulo 5' });

    expect(creada.id).toBe(2);
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body as string)).toEqual({
      titulo: 'Leer libro',
      descripcion: 'Capítulo 5',
    });
  });

  it('actualizarTarea hace PUT /api/tareas/:id con el payload', async () => {
    fetchMock.mockResolvedValueOnce(respuestaJson({ ...tareaFixture(), titulo: 'Nuevo título' }));
    const { actualizarTarea } = await import('./tareas.client');

    const actualizada = await actualizarTarea(TOKEN, 1, { titulo: 'Nuevo título' });

    expect(actualizada.titulo).toBe('Nuevo título');
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas/1');
    expect(opciones.method).toBe('PUT');
  });

  it('eliminarTarea hace DELETE /api/tareas/:id y resuelve undefined con 204', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { eliminarTarea } = await import('./tareas.client');

    const resultado = await eliminarTarea(TOKEN, 1);

    expect(resultado).toBeUndefined();
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas/1');
    expect(opciones.method).toBe('DELETE');
  });

  it('lanza ApiError con el código HTTP cuando la API responde 401', async () => {
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 401 }));
    const { listarTareas } = await import('./tareas.client');

    const error = await listarTareas(TOKEN).catch((e) => e);
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe(401);
  });

  it('lanza ApiError de red cuando no hay conexión (QA-13)', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down'));
    const { listarTareas } = await import('./tareas.client');

    const error = await listarTareas(TOKEN).catch((e) => e);
    // Comprobar por propiedades (no instanceof): tras vi.resetModules() el módulo
    // dinámico instancia una clase ApiError distinta a la importada estáticamente.
    expect(error.name).toBe('ApiError');
    expect(error.status).toBe('red');
  });
});

describe('tareas.client — URL base por variable de entorno (QA-14)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetModules();
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('usa EXPO_PUBLIC_API_BASE_URL para TODAS las peticiones cuando está definida', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', 'http://localhost:4000');
    fetchMock.mockResolvedValueOnce(respuestaJson([tareaFixture()]));
    const { listarTareas } = await import('./tareas.client');

    await listarTareas(TOKEN);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('http://localhost:4000/api/tareas');
  });

  it('usa http://localhost:3000 por defecto cuando la variable no está definida', async () => {
    vi.stubEnv('EXPO_PUBLIC_API_BASE_URL', undefined);
    fetchMock.mockResolvedValueOnce(respuestaJson([tareaFixture()]));
    const { listarTareas } = await import('./tareas.client');

    await listarTareas(TOKEN);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('http://localhost:3000/api/tareas');
  });
});
