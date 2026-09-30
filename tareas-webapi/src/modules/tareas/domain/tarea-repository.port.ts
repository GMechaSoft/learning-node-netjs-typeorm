import { Tarea } from './tarea';

/**
 * Puerto de persistencia de Tareas (hexagonal): el dominio define el contrato,
 * la infraestructura (TypeORM) lo implementa.
 */
export interface TareaRepository {
  guardar(tarea: Tarea): Promise<Tarea>;
  buscarPorId(id: number): Promise<Tarea | null>;
  listar(): Promise<Tarea[]>;
  eliminar(id: number): Promise<void>;
}

/**
 * Token de inyección del puerto. El dominio no conoce a NestJS, pero el Symbol
 * es TypeScript puro; la aplicación inyecta con @Inject(TAREA_REPOSITORY) porque
 * la interfaz no existe en runtime.
 */
export const TAREA_REPOSITORY: unique symbol = Symbol('TAREA_REPOSITORY');
