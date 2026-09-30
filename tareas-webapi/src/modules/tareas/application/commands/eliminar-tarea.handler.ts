import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  TAREA_REPOSITORY,
  type TareaRepository,
} from '../../domain/tarea-repository.port';

@Injectable()
export class EliminarTareaHandler {
  constructor(
    @Inject(TAREA_REPOSITORY) private readonly repository: TareaRepository,
  ) {}

  async ejecutar(id: number): Promise<void> {
    const existente = await this.repository.buscarPorId(id);
    if (!existente) {
      throw new NotFoundException(`Tarea ${id} no encontrada`);
    }
    await this.repository.eliminar(id);
  }
}
