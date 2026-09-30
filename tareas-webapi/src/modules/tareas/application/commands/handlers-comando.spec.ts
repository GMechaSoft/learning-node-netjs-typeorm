import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Tarea } from '../../domain/tarea';
import { TAREA_REPOSITORY } from '../../domain/tarea-repository.port';
import { ActualizarTareaHandler } from './actualizar-tarea.handler';
import { CrearTareaHandler } from './crear-tarea.handler';
import { EliminarTareaHandler } from './eliminar-tarea.handler';

function fakeRepository(overrides: Record<string, jest.Mock> = {}) {
  return {
    guardar: jest.fn().mockImplementation(async (t: Tarea) => t),
    buscarPorId: jest.fn().mockResolvedValue(null),
    listar: jest.fn().mockResolvedValue([]),
    eliminar: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('CrearTareaHandler', () => {
  it('debe persistir la tarea y devolverla con id y estado pendiente', async () => {
    // Arrange
    const creada = Tarea.reconstruir(
      7,
      'Estudar NestJS',
      null,
      'pendiente',
      new Date(),
    );
    const repository = fakeRepository({
      guardar: jest.fn().mockResolvedValue(creada),
    });
    const handler = new CrearTareaHandler(repository);
    // Act
    const resultado = await handler.ejecutar({ titulo: 'Estudar NestJS' });
    // Assert
    expect(repository.guardar).toHaveBeenCalledTimes(1);
    expect(resultado.id).toBe(7);
    expect(resultado.estado).toBe('pendiente');
  });

  it('debe propagar la descripción opcional al dominio', async () => {
    const repository = fakeRepository();
    const handler = new CrearTareaHandler(repository);
    await handler.ejecutar({ titulo: 'T', descripcion: 'D' });
    const guardada = repository.guardar.mock.calls[0][0] as Tarea;
    expect(guardada.descripcion).toBe('D');
  });
});

describe('ActualizarTareaHandler', () => {
  const existente = Tarea.reconstruir(
    1,
    'Original',
    'desc',
    'pendiente',
    new Date(),
  );

  it('debe lanzar NotFoundException cuando la tarea no existe', async () => {
    const repository = fakeRepository({
      buscarPorId: jest.fn().mockResolvedValue(null),
    });
    const handler = new ActualizarTareaHandler(repository);
    await expect(
      handler.ejecutar(999, { titulo: 'Nueva' }),
    ).rejects.toBeInstanceOf(NotFoundException);
    expect(repository.guardar).not.toHaveBeenCalled();
  });

  it('debe devolver la tarea actualizada al existir', async () => {
    const actualizada = existente.actualizar({ estado: 'completada' });
    const repository = fakeRepository({
      buscarPorId: jest.fn().mockResolvedValue(existente),
      guardar: jest.fn().mockResolvedValue(actualizada),
    });
    const handler = new ActualizarTareaHandler(repository);
    const resultado = await handler.ejecutar(1, { estado: 'completada' });
    expect(resultado.estado).toBe('completada');
    expect(repository.guardar).toHaveBeenCalledWith(actualizada);
  });
});

describe('EliminarTareaHandler', () => {
  it('debe lanzar NotFoundException cuando la tarea no existe', async () => {
    const repository = fakeRepository({
      buscarPorId: jest.fn().mockResolvedValue(null),
    });
    const handler = new EliminarTareaHandler(repository);
    await expect(handler.ejecutar(999)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    expect(repository.eliminar).not.toHaveBeenCalled();
  });

  it('debe eliminar la tarea al existir', async () => {
    const existente = Tarea.reconstruir(1, 'T', null, 'pendiente', new Date());
    const repository = fakeRepository({
      buscarPorId: jest.fn().mockResolvedValue(existente),
    });
    const handler = new EliminarTareaHandler(repository);
    await handler.ejecutar(1);
    expect(repository.eliminar).toHaveBeenCalledWith(1);
  });
});

describe('Inyección vía token TAREA_REPOSITORY', () => {
  it('debe resolver los handlers mediante el token del puerto', async () => {
    const repository = fakeRepository();
    const moduleRef = await Test.createTestingModule({
      providers: [
        CrearTareaHandler,
        ActualizarTareaHandler,
        EliminarTareaHandler,
        { provide: TAREA_REPOSITORY, useValue: repository },
      ],
    }).compile();
    expect(moduleRef.get(CrearTareaHandler)).toBeDefined();
    expect(moduleRef.get(ActualizarTareaHandler)).toBeDefined();
    expect(moduleRef.get(EliminarTareaHandler)).toBeDefined();
  });
});
