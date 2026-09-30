import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import type { Tarea } from '../../domain/tarea';
import {
  TAREA_REPOSITORY,
  type TareaRepository,
} from '../../domain/tarea-repository.port';

@Injectable()
export class ObtenerTareaHandler {
  constructor(
    @Inject(TAREA_REPOSITORY) private readonly repository: TareaRepository,
  ) {}

  async ejecutar(id: number): Promise<Tarea> {
    const tarea = await this.repository.buscarPorId(id);
    if (!tarea) {
      throw new NotFoundException(`Tarea ${id} no encontrada`);
    }
    return tarea;
  }
}
