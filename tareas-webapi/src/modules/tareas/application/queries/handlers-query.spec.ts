import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Tarea } from '../../domain/tarea';
import { TAREA_REPOSITORY } from '../../domain/tarea-repository.port';
import { ListarTareasHandler } from './listar-tareas.handler';
import { ObtenerTareaHandler } from './obtener-tarea.handler';

function fakeRepository(overrides: Record<string, jest.Mock> = {}) {
  return {
    guardar: jest.fn(),
    buscarPorId: jest.fn().mockResolvedValue(null),
    listar: jest.fn().mockResolvedValue([]),
    eliminar: jest.fn(),
    ...overrides,
  };
}

describe('ListarTareasHandler', () => {
  it('debe devolver la colección completa de tareas', async () => {
    const tareas = [
      Tarea.reconstruir(1, 'T1', null, 'pendiente', new Date()),
      Tarea.reconstruir(2, 'T2', 'd', 'completada', new Date()),
    ];
    const repository = fakeRepository({
      listar: jest.fn().mockResolvedValue(tareas),
    });
    const handler = new ListarTareasHandler(repository);
    const resultado = await handler.ejecutar();
    expect(resultado).toHaveLength(2);
    expect(repository.listar).toHaveBeenCalledTimes(1);
  });
});

describe('ObtenerTareaHandler', () => {
  it('debe devolver la tarea al existir', async () => {
    const tarea = Tarea.reconstruir(1, 'T1', null, 'pendiente', new Date());
    const repository = fakeRepository({
      buscarPorId: jest.fn().mockResolvedValue(tarea),
    });
    const handler = new ObtenerTareaHandler(repository);
    const resultado = await handler.ejecutar(1);
    expect(resultado.id).toBe(1);
  });

  it('debe lanzar NotFoundException cuando la tarea no existe', async () => {
    const repository = fakeRepository({
      buscarPorId: jest.fn().mockResolvedValue(null),
    });
    const handler = new ObtenerTareaHandler(repository);
    await expect(handler.ejecutar(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});

describe('Inyección vía token TAREA_REPOSITORY', () => {
  it('debe resolver los handlers de query mediante el token del puerto', async () => {
    const repository = fakeRepository();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ListarTareasHandler,
        ObtenerTareaHandler,
        { provide: TAREA_REPOSITORY, useValue: repository },
      ],
    }).compile();
    expect(moduleRef.get(ListarTareasHandler)).toBeDefined();
    expect(moduleRef.get(ObtenerTareaHandler)).toBeDefined();
  });
});
