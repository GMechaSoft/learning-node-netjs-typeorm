import { Inject, Injectable } from '@nestjs/common';
import { Tarea } from '../../domain/tarea';
import {
  TAREA_REPOSITORY,
  type TareaRepository,
} from '../../domain/tarea-repository.port';

export interface CrearTareaInput {
  titulo: string;
  descripcion?: string;
}

@Injectable()
export class CrearTareaHandler {
  constructor(
    @Inject(TAREA_REPOSITORY) private readonly repository: TareaRepository,
  ) {}

  async ejecutar(input: CrearTareaInput): Promise<Tarea> {
    const tarea = Tarea.crear(input.titulo, input.descripcion);
    return this.repository.guardar(tarea);
  }
}
