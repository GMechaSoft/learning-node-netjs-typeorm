import { ESTADOS_TAREA, EstadoTarea } from './estado-tarea';

/**
 * Entidad de dominio Tarea.
 * Sin imports de framework (NestJS/TypeORM): los invariantes viven aquí (DDD táctico, coding-standards §4).
 */
export class Tarea {
  public readonly id: number | undefined;
  public readonly titulo: string;
  public readonly descripcion: string | null;
  public readonly estado: EstadoTarea;
  public readonly creadaEn: Date | undefined;

  private constructor(
    id: number | undefined,
    titulo: string,
    descripcion: string | null,
    estado: string,
    creadaEn: Date | undefined,
  ) {
    if (!titulo || titulo.trim().length === 0) {
      throw new Error('El título es obligatorio');
    }
    if (!ESTADOS_TAREA.includes(estado as EstadoTarea)) {
      throw new Error(`Estado inválido: ${estado}`);
    }
    this.id = id;
    this.titulo = titulo;
    this.descripcion = descripcion;
    this.estado = estado as EstadoTarea;
    this.creadaEn = creadaEn;
  }

  /** Crea una tarea nueva: estado inicial "pendiente" y fecha de creación actual. */
  static crear(titulo: string, descripcion?: string | null): Tarea {
    return new Tarea(
      undefined,
      titulo,
      descripcion ?? null,
      'pendiente',
      new Date(),
    );
  }

  /** Reconstruye una tarea ya persistida (adaptador de infraestructura); el estado llega sin tipar y se valida. */
  static reconstruir(
    id: number,
    titulo: string,
    descripcion: string | null,
    estado: string,
    creadaEn: Date,
  ): Tarea {
    return new Tarea(id, titulo, descripcion, estado, creadaEn);
  }

  /** Devuelve una instancia nueva con los cambios aplicados; los campos ausentes conservan su valor. */
  actualizar(cambios: {
    titulo?: string;
    descripcion?: string;
    estado?: EstadoTarea;
  }): Tarea {
    return new Tarea(
      this.id,
      cambios.titulo ?? this.titulo,
      cambios.descripcion !== undefined
        ? cambios.descripcion
        : this.descripcion,
      cambios.estado ?? this.estado,
      this.creadaEn,
    );
  }
}
