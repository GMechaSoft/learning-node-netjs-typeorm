import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { actualizarTarea, crearTarea, eliminarTarea, listarTareas } from '../api/tareas.client';
import type { Tarea } from '../types/tarea';
import { useTareas } from './use-tareas';

// Clase local idéntica a la real: la instancia rechazada tiene que ser de la MISMA
// clase que el hook compara con instanceof (la del módulo mockeado).
// vi.hoisted: disponible antes de que vi.mock (hoisted) ejecute su factory.
const { ApiErrorDePrueba } = vi.hoisted(() => {
  class ApiErrorDePruebaClase extends Error {
    status: number | 'red';
    constructor(status: number | 'red', mensaje: string) {
      super(mensaje);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return { ApiErrorDePrueba: ApiErrorDePruebaClase };
});

vi.mock('../api/tareas.client', () => ({
  listarTareas: vi.fn(),
  crearTarea: vi.fn(),
  actualizarTarea: vi.fn(),
  eliminarTarea: vi.fn(),
  mapearError: vi.fn(),
  ApiError: ApiErrorDePrueba,
}));

const TAREA_1: Tarea = { id: 1, titulo: 'Comprar leche', descripcion: 'Dos litros', estado: 'pendiente', creadaEn: '2026-10-01T00:00:00Z' };
const TAREA_2: Tarea = { id: 2, titulo: 'Preparar informe', descripcion: 'Informe T3', estado: 'completada', creadaEn: '2026-10-01T01:00:00Z' };
const TOKEN = 'token-de-prueba';

afterEach(() => {
  vi.clearAllMocks();
});

describe('useTareas — listado (QA-01, QA-02, QA-16)', () => {
  it('carga el listado de tareas al montar (QA-01)', async () => {
    vi.mocked(listarTareas).mockResolvedValue([TAREA_1, TAREA_2]);
    const { result } = renderHook(() => useTareas(TOKEN));

    await act(async () => {
      await result.current.cargar();
    });

    expect(result.current.tareas).toHaveLength(2);
    expect(result.current.tareas[0].titulo).toBe('Comprar leche');
  });

  it('muestra el listado vacío cuando la API no tiene tareas (QA-02)', async () => {
    vi.mocked(listarTareas).mockResolvedValue([]);
    const { result } = renderHook(() => useTareas(TOKEN));

    await act(async () => {
      await result.current.cargar();
    });

    expect(result.current.tareas).toHaveLength(0);
  });

  it('muestra el indicador de carga mientras la petición está en vuelo (QA-16)', async () => {
    let resolver: (v: typeof TAREA_1[]) => void;
    vi.mocked(listarTareas).mockReturnValue(
      new Promise((r) => (resolver = r)),
    ) as never;
    const { result } = renderHook(() => useTareas(TOKEN));

    act(() => {
      void result.current.cargar();
    });
    expect(result.current.cargando).toBe(true);

    await act(async () => {
      resolver!([TAREA_1]);
    });
    await waitFor(() => expect(result.current.cargando).toBe(false));
    expect(result.current.tareas).toHaveLength(1);
  });
});

describe('useTareas — crear (QA-03, QA-09)', () => {
  it('crea una tarea con descripción y la añade al listado (QA-03 A)', async () => {
    vi.mocked(crearTarea).mockResolvedValue({ ...TAREA_1, id: 3, titulo: 'Leer libro' });
    const { result } = renderHook(() => useTareas(TOKEN));

    let ok = false;
    await act(async () => {
      ok = await result.current.crear({ titulo: 'Leer libro', descripcion: 'Capítulo 5' });
    });

    expect(ok).toBe(true);
    expect(crearTarea).toHaveBeenCalledWith(TOKEN, { titulo: 'Leer libro', descripcion: 'Capítulo 5' });
    expect(result.current.tareas.at(-1)?.titulo).toBe('Leer libro');
    expect(result.current.mensaje).toMatchObject({ tipo: 'exito' });
  });

  it('crea una tarea sin descripción (QA-03 B)', async () => {
    vi.mocked(crearTarea).mockResolvedValue({ ...TAREA_1, id: 4, titulo: 'Comprar pan' });
    const { result } = renderHook(() => useTareas(TOKEN));

    await act(async () => {
      await result.current.crear({ titulo: 'Comprar pan', descripcion: '' });
    });

    expect(crearTarea).toHaveBeenCalledWith(TOKEN, { titulo: 'Comprar pan' });
  });

  it('no llama a la API cuando el título está vacío y avisa (QA-09 A)', async () => {
    const { result } = renderHook(() => useTareas(TOKEN));

    let ok = true;
    await act(async () => {
      ok = await result.current.crear({ titulo: '', descripcion: 'cualquier cosa' });
    });

    expect(ok).toBe(false);
    expect(crearTarea).not.toHaveBeenCalled();
    expect(result.current.mensaje).toMatchObject({ tipo: 'validacion' });
  });

  it('no llama a la API cuando el título solo tiene espacios (QA-09 B)', async () => {
    const { result } = renderHook(() => useTareas(TOKEN));

    await act(async () => {
      await result.current.crear({ titulo: '    ' });
    });

    expect(crearTarea).not.toHaveBeenCalled();
    expect(result.current.mensaje).toMatchObject({ tipo: 'validacion' });
  });
});

describe('useTareas — actualizar y estado (QA-04, QA-05, QA-10)', () => {
  it('actualiza el título de una tarea (QA-04)', async () => {
    const actualizada = { ...TAREA_1, titulo: 'Comprar leche de almendras' };
    vi.mocked(actualizarTarea).mockResolvedValue(actualizada);
    vi.mocked(listarTareas).mockResolvedValue([TAREA_1]);
    const { result } = renderHook(() => useTareas(TOKEN));
    await act(async () => {
      await result.current.cargar();
    });

    await act(async () => {
      await result.current.actualizar(1, {
        titulo: 'Comprar leche de almendras',
        descripcion: 'Dos litros',
        estado: 'pendiente',
      });
    });

    expect(actualizarTarea).toHaveBeenCalledWith(TOKEN, 1, {
      titulo: 'Comprar leche de almendras',
      descripcion: 'Dos litros',
      estado: 'pendiente',
    });
    expect(result.current.tareas[0].titulo).toBe('Comprar leche de almendras');
  });

  it('no llama a la API al actualizar con título vacío (QA-10)', async () => {
    const { result } = renderHook(() => useTareas(TOKEN));

    await act(async () => {
      await result.current.actualizar(1, { titulo: '', descripcion: 'Dos litros', estado: 'pendiente' });
    });

    expect(actualizarTarea).not.toHaveBeenCalled();
    expect(result.current.mensaje).toMatchObject({ tipo: 'validacion' });
  });

  it('cambia el estado de una tarea (QA-05)', async () => {
    const completada = { ...TAREA_1, estado: 'completada' as const };
    vi.mocked(actualizarTarea).mockResolvedValue(completada);
    vi.mocked(listarTareas).mockResolvedValue([TAREA_1]);
    const { result } = renderHook(() => useTareas(TOKEN));
    await act(async () => {
      await result.current.cargar();
    });

    await act(async () => {
      await result.current.cambiarEstado(1, 'completada');
    });

    expect(actualizarTarea).toHaveBeenCalledWith(TOKEN, 1, { estado: 'completada' });
    expect(result.current.tareas[0].estado).toBe('completada');
  });
});

describe('useTareas — eliminar y errores (QA-06, QA-11..15)', () => {
  it('elimina una tarea y la retira del listado (QA-06)', async () => {
    vi.mocked(eliminarTarea).mockResolvedValue(undefined);
    vi.mocked(listarTareas).mockResolvedValue([TAREA_1, TAREA_2]);
    const { result } = renderHook(() => useTareas(TOKEN));
    await act(async () => {
      await result.current.cargar();
    });

    await act(async () => {
      await result.current.eliminar(2);
    });

    expect(eliminarTarea).toHaveBeenCalledWith(TOKEN, 2);
    expect(result.current.tareas).toHaveLength(1);
    expect(result.current.tareas[0].id).toBe(1);
  });

  it('muestra el error 401 sin bloquear (QA-11)', async () => {
    vi.mocked(listarTareas).mockRejectedValue(
      new ApiErrorDePrueba(401, 'Token ausente o inválido. Verifica tu token en el campo de autenticación.'),
    );
    const { result } = renderHook(() => useTareas('token-invalido-prueba'));

    await act(async () => {
      await result.current.cargar();
    });

    expect(result.current.mensaje).toMatchObject({ tipo: 'error' });
    expect(result.current.mensaje?.texto).toMatch(/token/i);
  });

  it('muestra el error de red sin bloquear (QA-14)', async () => {
    vi.mocked(listarTareas).mockRejectedValue(
      new ApiErrorDePrueba('red', 'No se puede conectar al servidor. Verifica que la API esté en marcha e inténtalo de nuevo.'),
    );
    const { result } = renderHook(() => useTareas(TOKEN));

    await act(async () => {
      await result.current.cargar();
    });

    expect(result.current.mensaje).toMatchObject({ tipo: 'error' });
    expect(result.current.mensaje?.texto).toMatch(/no se puede conectar/i);
  });

  it('ante un 404 al eliminar, refresca el listado (QA-12)', async () => {
    vi.mocked(eliminarTarea).mockRejectedValue(
      new ApiErrorDePrueba(404, 'La tarea solicitada no existe. Refresca el listado e inténtalo de nuevo.'),
    );
    vi.mocked(listarTareas)
      .mockResolvedValueOnce([TAREA_1, TAREA_2])
      .mockResolvedValueOnce([TAREA_1]);
    const { result } = renderHook(() => useTareas(TOKEN));
    await act(async () => {
      await result.current.cargar();
    });

    await act(async () => {
      await result.current.eliminar(2);
    });

    expect(result.current.mensaje).toMatchObject({ tipo: 'error' });
    expect(result.current.mensaje?.texto).toMatch(/no existe/i);
    expect(result.current.tareas).toHaveLength(1);
    expect(result.current.tareas[0].id).toBe(1);
  });
});
