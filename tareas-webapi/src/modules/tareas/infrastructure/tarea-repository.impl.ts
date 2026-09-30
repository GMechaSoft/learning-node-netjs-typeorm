import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';
import type { TareaRepository } from '../domain/tarea-repository.port';
import { Tarea } from '../domain/tarea';
import { TareaEntity } from './tarea.entity';

/** Adaptador de infraestructura: implementa el puerto del dominio con TypeORM/PostgreSQL. */
@Injectable()
export class TareaRepositoryImpl implements TareaRepository {
  constructor(
    @InjectRepository(TareaEntity)
    private readonly repo: Repository<TareaEntity>,
  ) {}

  async guardar(tarea: Tarea): Promise<Tarea> {
    if (tarea.id === undefined) {
      const entidad = this.repo.create({
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        estado: tarea.estado,
      });
      const persistida = await this.repo.save(entidad);
      return Tarea.reconstruir(
        persistida.id,
        persistida.titulo,
        persistida.descripcion,
        persistida.estado,
        persistida.creadaEn,
      );
    }

    const existente = await this.repo.findOneBy({ id: tarea.id });
    if (!existente) {
      throw new Error(`Tarea ${tarea.id} no encontrada`);
    }
    Object.assign(existente, {
      titulo: tarea.titulo,
      descripcion: tarea.descripcion,
      estado: tarea.estado,
    });
    const persistida = await this.repo.save(existente);
    return Tarea.reconstruir(
      persistida.id,
      persistida.titulo,
      persistida.descripcion,
      persistida.estado,
      persistida.creadaEn,
    );
  }

  async buscarPorId(id: number): Promise<Tarea | null> {
    const entidad = await this.repo.findOneBy({ id });
    if (!entidad) {
      return null;
    }
    return Tarea.reconstruir(
      entidad.id,
      entidad.titulo,
      entidad.descripcion,
      entidad.estado,
      entidad.creadaEn,
    );
  }

  async listar(): Promise<Tarea[]> {
    const entidades = await this.repo.find({ order: { id: 'ASC' } });
    return entidades.map((e) =>
      Tarea.reconstruir(e.id, e.titulo, e.descripcion, e.estado, e.creadaEn),
    );
  }

  async eliminar(id: number): Promise<void> {
    await this.repo.delete(id);
  }
}
