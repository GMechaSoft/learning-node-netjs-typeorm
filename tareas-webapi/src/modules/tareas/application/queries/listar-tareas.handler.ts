import { Inject, Injectable } from '@nestjs/common';
import type { Tarea } from '../../domain/tarea';
import {
  TAREA_REPOSITORY,
  type TareaRepository,
} from '../../domain/tarea-repository.port';

@Injectable()
export class ListarTareasHandler {
  constructor(
    @Inject(TAREA_REPOSITORY) private readonly repository: TareaRepository,
  ) {}

  async ejecutar(): Promise<Tarea[]> {
    return this.repository.listar();
  }
}
