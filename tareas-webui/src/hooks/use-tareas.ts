import { useCallback, useState } from 'react';
import {
  actualizarTarea as apiActualizarTarea,
  ApiError,
  crearTarea as apiCrearTarea,
  eliminarTarea as apiEliminarTarea,
  listarTareas as apiListarTareas,
} from '../api/tareas.client';
import type {
  ActualizarTareaDto,
  CrearTareaDto,
  EstadoTarea,
  Tarea,
} from '../types/tarea';

/** Mensaje mostrado en la zona de feedback (éxito / validación / error genérico). */
export interface MensajeUi {
  tipo: 'exito' | 'validacion' | 'error';
  texto: string;
}

const MENSAJE_TITULO_OBLIGATORIO = 'El título es obligatorio.';

function textoDeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Error inesperado. Inténtalo de nuevo.';
}

/**
 * Estado de la vista de tareas: listado + acciones de mutación (crear/actualizar/
 * cambiar estado/eliminar). Valida el título en el cliente ANTES de llamar a la API
 * (AC7) y mapea los errores del cliente a mensajes genéricos (AC8).
 */
export function useTareas(token: string | null) {
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeUi | null>(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setTareas(await apiListarTareas(token));
    } catch (error) {
      setMensaje({ tipo: 'error', texto: textoDeError(error) });
    } finally {
      setCargando(false);
    }
  }, [token]);

  const crear = useCallback(
    async (dto: CrearTareaDto): Promise<boolean> => {
      const titulo = dto.titulo.trim();
      if (titulo.length === 0) {
        setMensaje({ tipo: 'validacion', texto: MENSAJE_TITULO_OBLIGATORIO });
        return false;
      }
      setAccionEnCurso(true);
      try {
        const descripcion = dto.descripcion?.trim();
        const nueva = await apiCrearTarea(token, {
          titulo,
          ...(descripcion ? { descripcion } : {}),
        });
        setTareas((previa) => [...previa, nueva]);
        setMensaje({ tipo: 'exito', texto: 'Tarea creada.' });
        return true;
      } catch (error) {
        setMensaje({ tipo: 'error', texto: textoDeError(error) });
        return false;
      } finally {
        setAccionEnCurso(false);
      }
    },
    [token],
  );

  const actualizar = useCallback(
    async (id: number, dto: ActualizarTareaDto): Promise<boolean> => {
      if (dto.titulo !== undefined && dto.titulo.trim().length === 0) {
        setMensaje({ tipo: 'validacion', texto: MENSAJE_TITULO_OBLIGATORIO });
        return false;
      }
      setAccionEnCurso(true);
      try {
        const actualizada = await apiActualizarTarea(token, id, dto);
        setTareas((previa) => previa.map((t) => (t.id === id ? actualizada : t)));
        setMensaje({ tipo: 'exito', texto: 'Tarea actualizada.' });
        return true;
      } catch (error) {
        setMensaje({ tipo: 'error', texto: textoDeError(error) });
        if (error instanceof ApiError && error.status === 404) {
          await cargar();
        }
        return false;
      } finally {
        setAccionEnCurso(false);
      }
    },
    [token, cargar],
  );

  const cambiarEstado = useCallback(
    async (id: number, estado: EstadoTarea): Promise<boolean> => {
      setAccionEnCurso(true);
      try {
        const actualizada = await apiActualizarTarea(token, id, { estado });
        setTareas((previa) => previa.map((t) => (t.id === id ? actualizada : t)));
        setMensaje({ tipo: 'exito', texto: 'Estado actualizado.' });
        return true;
      } catch (error) {
        setMensaje({ tipo: 'error', texto: textoDeError(error) });
        if (error instanceof ApiError && error.status === 404) {
          await cargar();
        }
        return false;
      } finally {
        setAccionEnCurso(false);
      }
    },
    [token, cargar],
  );

  const eliminar = useCallback(
    async (id: number): Promise<boolean> => {
      setAccionEnCurso(true);
      try {
        await apiEliminarTarea(token, id);
        setTareas((previa) => previa.filter((t) => t.id !== id));
        setMensaje({ tipo: 'exito', texto: 'Tarea eliminada.' });
        return true;
      } catch (error) {
        setMensaje({ tipo: 'error', texto: textoDeError(error) });
        if (error instanceof ApiError && error.status === 404) {
          await cargar();
        }
        return false;
      } finally {
        setAccionEnCurso(false);
      }
    },
    [token, cargar],
  );

  const descartarMensaje = useCallback(() => setMensaje(null), []);

  return {
    tareas,
    cargando,
    accionEnCurso,
    mensaje,
    cargar,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    descartarMensaje,
  };
}
