/**
 * Tipos del dominio de tareas, lado consumidor.
 * Fuente única de verdad: `tareas-webapi` (entity `tarea.entity.ts` + DTOs).
 */

/** Estados permitidos de una tarea (backend: `estado-tarea.ts`). */
export type EstadoTarea = 'pendiente' | 'completada';

/** Forma de una tarea tal como la devuelve la API (`tarea.entity.ts`). */
export interface Tarea {
  id: number;
  titulo: string;
  descripcion: string | null;
  estado: EstadoTarea;
  creadaEn: string;
}

/** Payload de creación (backend: `crear-tarea.dto.ts`): título obligatorio, descripción opcional. */
export interface CrearTareaDto {
  titulo: string;
  descripcion?: string;
}

/** Payload de actualización (backend: `actualizar-tarea.dto.ts`): todos los campos opcionales. */
export interface ActualizarTareaDto {
  titulo?: string;
  descripcion?: string;
  estado?: EstadoTarea;
}
