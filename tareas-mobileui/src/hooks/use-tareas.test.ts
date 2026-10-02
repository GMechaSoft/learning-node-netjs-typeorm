import { act } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { renderHook, respuestaJson } from '../test/test-utils';
import { useTareas } from './use-tareas';

const fetchOriginal = globalThis.fetch;

function tareaFixture(id: number, overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id,
    titulo: 'Tarea de prueba',
    descripcion: null,
    estado: 'pendiente',
    creadaEn: '2026-10-01T00:00:00.000Z',
    ...overrides,
  };
}

/** Mock de fetch: emite token y devuelve el listado de tareas (flujo de montaje OK). */
function mockearAuthOk(fetchMock: ReturnType<typeof vi.fn>, tareas: unknown[] = []) {
  fetchMock
    .mockResolvedValueOnce(respuestaJson({ token: 'token-1' }))
    .mockResolvedValueOnce(respuestaJson(tareas));
}

describe('useTareas — autenticación automática (AC1, AC9)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  // Sin EXPO_PUBLIC_API_BASE_URL → api-config usa el default http://localhost:3000.
  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('QA-01: al montar emite el token con usuario "demo" (sin login) y carga el listado', async () => {
    mockearAuthOk(fetchMock, [tareaFixture(1, { titulo: 'Comprar leche' }), tareaFixture(2, { titulo: 'Preparar informe' })]);
    const { result, unmount } = await renderHook(() => useTareas());

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const [urlToken, opcionesToken] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(urlToken).toBe('http://localhost:3000/api/auth/token');
    expect(opcionesToken.method).toBe('POST');
    expect(JSON.parse(opcionesToken.body as string)).toEqual({ usuario: 'demo' });
    expect((opcionesToken.headers as Record<string, string>).Authorization).toBeUndefined();

    const [urlLista, opcionesLista] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(urlLista).toBe('http://localhost:3000/api/tareas');
    expect(opcionesLista.headers).toMatchObject({ Authorization: 'Bearer token-1' });

    expect(result.current.autenticando).toBe(false);
    expect(result.current.authError).toBe(false);
    expect(result.current.tareas).toHaveLength(2);
    unmount();
  });

  it('QA-02: con la API sin tareas muestra el listado vacío', async () => {
    mockearAuthOk(fetchMock, []);
    const { result, unmount } = await renderHook(() => useTareas());

    expect(result.current.tareas).toHaveLength(0);
    unmount();
  });

  it('QA-09: con la API caída, estado de error con mensaje genérico y reintento recupera', async () => {
    fetchMock.mockRejectedValueOnce(new TypeError('network down'));
    const { result, unmount } = await renderHook(() => useTareas());

    expect(result.current.authError).toBe(true);
    expect(result.current.autenticando).toBe(false);
    expect(result.current.mensaje).toMatchObject({
      tipo: 'error',
      texto: expect.stringMatching(/conectar al servidor/),
    });

    // Reintentar: ahora la API responde.
    fetchMock.mockReset();
    fetchMock
      .mockResolvedValueOnce(respuestaJson({ token: 'token-1' }))
      .mockResolvedValueOnce(respuestaJson([tareaFixture(1)]));
    await act(async () => {
      await result.current.autenticar();
    });

    expect(result.current.authError).toBe(false);
    expect(result.current.tareas).toHaveLength(1);
    unmount();
  });
});

describe('useTareas — CRUD (AC2-AC6)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('QA-03: crear con descripción → POST y la tarea aparece con estado pendiente', async () => {
    mockearAuthOk(fetchMock, []);
    const nueva = tareaFixture(3, { titulo: 'Leer libro', descripcion: 'Capítulo 5' });
    fetchMock.mockResolvedValueOnce(respuestaJson(nueva, 201));
    const { result, unmount } = await renderHook(() => useTareas());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.crear({ titulo: 'Leer libro', descripcion: 'Capítulo 5' });
    });

    expect(ok).toBe(true);
    expect(result.current.tareas).toHaveLength(1);
    expect(result.current.tareas[0]).toMatchObject({ id: 3, titulo: 'Leer libro', estado: 'pendiente' });
    expect(result.current.mensaje).toMatchObject({ tipo: 'exito' });
    const [url, opciones] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas');
    expect(opciones.method).toBe('POST');
    unmount();
  });

  it('QA-03 (variante B): crear sin descripción → el payload omite el campo', async () => {
    mockearAuthOk(fetchMock, []);
    fetchMock.mockResolvedValueOnce(respuestaJson(tareaFixture(4, { titulo: 'Comprar pan' }), 201));
    const { result, unmount } = await renderHook(() => useTareas());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.crear({ titulo: 'Comprar pan' });
    });

    expect(ok).toBe(true);
    const [, opciones] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(JSON.parse(opciones.body as string)).toEqual({ titulo: 'Comprar pan' });
    unmount();
  });

  it('QA-04: actualizar → PUT y el listado refleja los nuevos valores', async () => {
    mockearAuthOk(fetchMock, [tareaFixture(1, { titulo: 'Comprar leche' })]);
    fetchMock.mockResolvedValueOnce(
      respuestaJson(tareaFixture(1, { titulo: 'Comprar leche de almendras', descripcion: 'Dos litros' })),
    );
    const { result, unmount } = await renderHook(() => useTareas());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.actualizar(1, { titulo: 'Comprar leche de almendras' });
    });

    expect(ok).toBe(true);
    expect(result.current.tareas[0].titulo).toBe('Comprar leche de almendras');
    const [url, opciones] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas/1');
    expect(opciones.method).toBe('PUT');
    unmount();
  });

  it('QA-05: cambiar estado en ambas transiciones (pendiente↔completada)', async () => {
    mockearAuthOk(fetchMock, [
      tareaFixture(1, { estado: 'pendiente' }),
      tareaFixture(2, { estado: 'completada' }),
    ]);
    fetchMock
      .mockResolvedValueOnce(respuestaJson(tareaFixture(1, { estado: 'completada' })))
      .mockResolvedValueOnce(respuestaJson(tareaFixture(2, { estado: 'pendiente' })));
    const { result, unmount } = await renderHook(() => useTareas());

    let ok1: boolean | undefined;
    await act(async () => {
      ok1 = await result.current.cambiarEstado(1, 'completada');
    });
    let ok2: boolean | undefined;
    await act(async () => {
      ok2 = await result.current.cambiarEstado(2, 'pendiente');
    });

    expect(ok1).toBe(true);
    expect(ok2).toBe(true);
    expect(result.current.tareas[0].estado).toBe('completada');
    expect(result.current.tareas[1].estado).toBe('pendiente');
    const [url2, opciones2] = fetchMock.mock.calls[3] as [string, RequestInit];
    expect(url2).toBe('http://localhost:3000/api/tareas/2');
    expect(JSON.parse(opciones2.body as string)).toEqual({ estado: 'pendiente' });
    unmount();
  });

  it('QA-06: eliminar → DELETE y la tarea desaparece del listado', async () => {
    mockearAuthOk(fetchMock, [tareaFixture(1), tareaFixture(2)]);
    fetchMock.mockResolvedValueOnce(new Response(null, { status: 204 }));
    const { result, unmount } = await renderHook(() => useTareas());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.eliminar(1);
    });

    expect(ok).toBe(true);
    expect(result.current.tareas).toHaveLength(1);
    expect(result.current.tareas[0].id).toBe(2);
    const [url, opciones] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect(url).toBe('http://localhost:3000/api/tareas/1');
    expect(opciones.method).toBe('DELETE');
    unmount();
  });
});

describe('useTareas — validación de título sin llamar a la API (AC7)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('QA-07: crear con título vacío o solo espacios no envía petición', async () => {
    mockearAuthOk(fetchMock, []);
    const { result, unmount } = await renderHook(() => useTareas());

    let okA: boolean | undefined;
    await act(async () => {
      okA = await result.current.crear({ titulo: '' });
    });
    let okB: boolean | undefined;
    await act(async () => {
      okB = await result.current.crear({ titulo: '   ' });
    });

    expect(okA).toBe(false);
    expect(okB).toBe(false);
    // Solo las 2 peticiones del montaje (token + listado): ninguna POST de creación.
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.mensaje).toMatchObject({
      tipo: 'validacion',
      texto: expect.stringMatching(/título es obligatorio/),
    });
    unmount();
  });

  it('QA-08: actualizar con título vacío o solo espacios no envía petición', async () => {
    mockearAuthOk(fetchMock, [tareaFixture(1)]);
    const { result, unmount } = await renderHook(() => useTareas());

    let okA: boolean | undefined;
    await act(async () => {
      okA = await result.current.actualizar(1, { titulo: '' });
    });
    let okB: boolean | undefined;
    await act(async () => {
      okB = await result.current.actualizar(1, { titulo: '  ' });
    });

    expect(okA).toBe(false);
    expect(okB).toBe(false);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(result.current.mensaje).toMatchObject({ tipo: 'validacion' });
    unmount();
  });
});

describe('useTareas — re-emisión de token ante 401 (QA-10)', () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    globalThis.fetch = fetchOriginal;
  });

  it('re-emite el token una vez y repite la acción sin intervención del usuario', async () => {
    // Montaje: token t1 + listado.
    fetchMock
      .mockResolvedValueOnce(respuestaJson({ token: 't1' }))
      .mockResolvedValueOnce(respuestaJson([tareaFixture(1)]))
      // Acción: la API rechaza el token t1 (401)…
      .mockResolvedValueOnce(new Response(null, { status: 401 }))
      // …se re-emite el token (t2) y se repite la creación con éxito.
      .mockResolvedValueOnce(respuestaJson({ token: 't2' }))
      .mockResolvedValueOnce(respuestaJson(tareaFixture(5, { titulo: 'Nueva' }), 201));
    const { result, unmount } = await renderHook(() => useTareas());

    let ok: boolean | undefined;
    await act(async () => {
      ok = await result.current.crear({ titulo: 'Nueva' });
    });

    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(5);
    // La 4ª petición es la re-emisión del token, después del 401.
    const [urlToken2] = fetchMock.mock.calls[3] as [string];
    expect(urlToken2).toBe('http://localhost:3000/api/auth/token');
    // La creación se repitió con el token nuevo.
    const [urlCrear, opcionesCrear] = fetchMock.mock.calls[4] as [string, RequestInit];
    expect(urlCrear).toBe('http://localhost:3000/api/tareas');
    expect(opcionesCrear.headers).toMatchObject({ Authorization: 'Bearer t2' });
    expect(result.current.tareas).toHaveLength(2);
    unmount();
  });
});
