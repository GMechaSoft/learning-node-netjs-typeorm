import { useCallback, useEffect, useRef, useState } from 'react';

import { emitirToken } from '../api/auth.client';
import {
  actualizarTarea as apiActualizarTarea,
  ApiError,
  crearTarea as apiCrearTarea,
  eliminarTarea as apiEliminarTarea,
  listarTareas as apiListarTareas,
  mapearError,
} from '../api/tareas.client';
import { DEMO_USER } from '../config/api-config';
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

/** Estado de la autenticación automática (AC1): emitiendo → lista | error. */
export type EstadoAutenticacion = 'emitiendo' | 'lista' | 'error';

const MENSAJE_TITULO_OBLIGATORIO = 'El título es obligatorio.';

function textoDeError(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'Error inesperado. Inténtalo de nuevo.';
}

/**
 * Estado de la vista de tareas con autenticación automática (HU #4):
 * al montar emite sola el token vía `POST /api/auth/token` (usuario fijo `demo`,
 * sin login ni persistencia) y carga el listado. Ante un `401` en cualquier
 * petición re-emite el token una vez y repite la acción (regla AC1/QA-10).
 * Valida el título en el cliente ANTES de llamar a la API (AC7) y mapea los
 * errores del cliente a mensajes genéricos (AC8).
 */
export function useTareas() {
  const tokenRef = useRef<string | null>(null);
  const [estadoAuth, setEstadoAuth] = useState<EstadoAutenticacion>('emitiendo');
  const [tareas, setTareas] = useState<Tarea[]>([]);
  const [cargando, setCargando] = useState(false);
  const [accionEnCurso, setAccionEnCurso] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeUi | null>(null);

  const emitir = useCallback(async (): Promise<string> => {
    const nuevoToken = await emitirToken(DEMO_USER);
    tokenRef.current = nuevoToken;
    return nuevoToken;
  }, []);

  /**
   * Ejecuta una petición con token Bearer; si la API responde 401, re-emite el
   * token una vez y repite la misma petición con el token nuevo (QA-10).
   */
  const ejecutarConToken = useCallback(
    async <T>(fn: (token: string) => Promise<T>): Promise<T> => {
      const token = tokenRef.current;
      if (!token) {
        throw new ApiError('red', mapearError('red'));
      }
      try {
        return await fn(token);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          await emitir();
          return await fn(tokenRef.current as string);
        }
        throw error;
      }
    },
    [emitir],
  );

  const cargar = useCallback(async () => {
    setCargando(true);
    try {
      setTareas(await ejecutarConToken((token) => apiListarTareas(token)));
    } catch (error) {
      setMensaje({ tipo: 'error', texto: textoDeError(error) });
    } finally {
      setCargando(false);
    }
  }, [ejecutarConToken]);

  /** Autenticación automática: emite el token y carga el listado (AC1). */
  const autenticar = useCallback(async () => {
    setEstadoAuth('emitiendo');
    setMensaje(null);
    try {
      await emitir();
      setEstadoAuth('lista');
      await cargar();
    } catch (error) {
      setEstadoAuth('error');
      setMensaje({ tipo: 'error', texto: textoDeError(error) });
    }
  }, [cargar, emitir]);

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
        const nueva = await ejecutarConToken((token) =>
          apiCrearTarea(token, { titulo, ...(descripcion ? { descripcion } : {}) }),
        );
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
    [ejecutarConToken],
  );

  const actualizar = useCallback(
    async (id: number, dto: ActualizarTareaDto): Promise<boolean> => {
      if (dto.titulo !== undefined && dto.titulo.trim().length === 0) {
        setMensaje({ tipo: 'validacion', texto: MENSAJE_TITULO_OBLIGATORIO });
        return false;
      }
      setAccionEnCurso(true);
      try {
        const actualizada = await ejecutarConToken((token) => apiActualizarTarea(token, id, dto));
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
    [cargar, ejecutarConToken],
  );

  const cambiarEstado = useCallback(
    async (id: number, estado: EstadoTarea): Promise<boolean> => {
      setAccionEnCurso(true);
      try {
        const actualizada = await ejecutarConToken((token) =>
          apiActualizarTarea(token, id, { estado }),
        );
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
    [cargar, ejecutarConToken],
  );

  const eliminar = useCallback(
    async (id: number): Promise<boolean> => {
      setAccionEnCurso(true);
      try {
        await ejecutarConToken((token) => apiEliminarTarea(token, id));
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
    [cargar, ejecutarConToken],
  );

  const descartarMensaje = useCallback(() => setMensaje(null), []);

  // Autenticación automática al montar (AC1): emite el token y carga el listado.
  // Se agenda en un microtask para que el cuerpo del efecto no ejecute setState
  // de forma síncrona (regla react-hooks/set-state-in-effect): la
  // autenticación es asíncrona y los setState ocurren tras el primer await.
  useEffect(() => {
    let activo = true;
    void Promise.resolve().then(() => {
      if (activo) void autenticar();
    });
    return () => {
      activo = false;
    };
  }, [autenticar]);

  return {
    tareas,
    cargando,
    accionEnCurso,
    autenticando: estadoAuth === 'emitiendo',
    authError: estadoAuth === 'error',
    mensaje,
    autenticar,
    cargar,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
    descartarMensaje,
  };
}
