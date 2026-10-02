import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { mapearError } from './tareas.client';

const TOKEN = 'token-de-prueba';

function fixtureTarea(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    titulo: 'Comprar leche',
    descripcion: 'Dos litros',
    estado: 'pendiente',
    creadaEn: '2026-10-01T00:00:00Z',
    ...overrides,
  };
}

function respuestaJson(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('mapearError — mensajes genéricos por código (AC8)', () => {
  it('400 → datos inválidos (QA-15)', () => {
    expect(mapearError(400)).toMatch(/no son válidos/i);
  });

  it('401 → token ausente o inválido (QA-11)', () => {
    expect(mapearError(401)).toMatch(/token/i);
  });

  it('404 → tarea inexistente (QA-12)', () => {
    expect(mapearError(404)).toMatch(/no existe/i);
  });

  it('red → no se puede conectar al servidor (QA-14)', () => {
    expect(mapearError('red')).toMatch(/no se puede conectar/i);
  });

  it('5xx → error del servidor (QA-13)', () => {
    expect(mapearError(500)).toMatch(/servidor/i);
    expect(mapearError(503)).toMatch(/servidor/i);
  });
});

describe('tareas.client — fetch + Bearer + códigos HTTP', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.resetModules();
  });

  it('listarTareas hace GET a {API_BASE}/api/tareas con Bearer y parsea el JSON (QA-16, URL default)', async () => {
    fetchMock.mockResolvedValue(respuestaJson([fixtureTarea()]));
    const { listarTareas } = await import('./tareas.client');

    const tareas = await listarTareas(TOKEN);

    expect(tareas[0].titulo).toBe('Comprar leche');
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas');
    expect(opciones.headers).toMatchObject({ Authorization: `Bearer ${TOKEN}` });
  });

  it('usa la URL base configurada por variable de entorno (QA-16)', async () => {
    vi.stubEnv('VITE_API_BASE_URL', 'http://mi-instancia:4000');
    fetchMock.mockResolvedValue(respuestaJson([]));
    const { listarTareas } = await import('./tareas.client');

    await listarTareas(TOKEN);

    const [url] = fetchMock.mock.calls[0] as [string];
    expect(url).toBe('http://mi-instancia:4000/api/tareas');
  });

  it('crearTarea hace POST con el payload (QA-03)', async () => {
    fetchMock.mockResolvedValue(respuestaJson(fixtureTarea({ titulo: 'Leer libro' }), 201));
    const { crearTarea } = await import('./tareas.client');

    const creada = await crearTarea(TOKEN, { titulo: 'Leer libro', descripcion: 'Capítulo 5' });

    expect(creada.titulo).toBe('Leer libro');
    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas');
    expect(opciones.method).toBe('POST');
    expect(JSON.parse(opciones.body as string)).toEqual({ titulo: 'Leer libro', descripcion: 'Capítulo 5' });
  });

  it('actualizarTarea hace PUT a /api/tareas/:id (QA-04)', async () => {
    fetchMock.mockResolvedValue(respuestaJson(fixtureTarea({ titulo: 'Nuevo' }), 200));
    const { actualizarTarea } = await import('./tareas.client');

    await actualizarTarea(TOKEN, 7, { titulo: 'Nuevo' });

    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas/7');
    expect(opciones.method).toBe('PUT');
  });

  it('eliminarTarea hace DELETE a /api/tareas/:id y devuelve vacío en 204 (QA-06)', async () => {
    fetchMock.mockResolvedValue(new Response(null, { status: 204 }));
    const { eliminarTarea } = await import('./tareas.client');

    const resultado = await eliminarTarea(TOKEN, 3);

    const [url, opciones] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas/3');
    expect(opciones.method).toBe('DELETE');
    expect(resultado).toBeUndefined();
  });

  it('lanza ApiError con el código 404 cuando la tarea no existe (QA-12)', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ message: 'no encontrada' }, 404));
    const { eliminarTarea } = await import('./tareas.client');

    await expect(eliminarTarea(TOKEN, 999)).rejects.toMatchObject({ status: 404 });
    await expect(eliminarTarea(TOKEN, 999)).rejects.toThrow(/no existe/i);
  });

  it('lanza ApiError(401) con mensaje genérico cuando el token es inválido (QA-11)', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ message: 'Unauthorized' }, 401));
    const { listarTareas } = await import('./tareas.client');

    const promesa = listarTareas('token-invalido-prueba');
    await expect(promesa).rejects.toMatchObject({ status: 401 });
    await expect(promesa).rejects.toThrow(/token/i);
  });

  it('lanza ApiError(500) para errores del servidor (QA-13)', async () => {
    fetchMock.mockResolvedValue(respuestaJson({ message: 'boom' }, 500));
    const { crearTarea } = await import('./tareas.client');

    await expect(crearTarea(TOKEN, { titulo: 'x' })).rejects.toMatchObject({ status: 500 });
  });

  it('lanza ApiError(red) cuando la API no está accesible (QA-14)', async () => {
    fetchMock.mockRejectedValue(new TypeError('Failed to fetch'));
    const { listarTareas } = await import('./tareas.client');

    const promesa = listarTareas(TOKEN);
    await expect(promesa).rejects.toMatchObject({ status: 'red' });
    await expect(promesa).rejects.toThrow(/no se puede conectar/i);
  });
});
