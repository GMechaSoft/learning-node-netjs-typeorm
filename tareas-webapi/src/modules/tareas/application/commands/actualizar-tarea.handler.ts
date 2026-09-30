import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { Tarea } from '../../domain/tarea';
import type { EstadoTarea } from '../../domain/estado-tarea';
import {
  TAREA_REPOSITORY,
  type TareaRepository,
} from '../../domain/tarea-repository.port';

export interface ActualizarTareaInput {
  titulo?: string;
  descripcion?: string;
  estado?: EstadoTarea;
}

@Injectable()
export class ActualizarTareaHandler {
  constructor(
    @Inject(TAREA_REPOSITORY) private readonly repository: TareaRepository,
  ) {}

  async ejecutar(id: number, cambios: ActualizarTareaInput): Promise<Tarea> {
    const existente = await this.repository.buscarPorId(id);
    if (!existente) {
      throw new NotFoundException(`Tarea ${id} no encontrada`);
    }
    const actualizada = existente.actualizar(cambios);
    return this.repository.guardar(actualizada);
  }
}
