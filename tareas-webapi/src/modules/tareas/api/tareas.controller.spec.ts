import { NotFoundException, ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { CrearTareaHandler } from '../application/commands/crear-tarea.handler';
import { ActualizarTareaHandler } from '../application/commands/actualizar-tarea.handler';
import { EliminarTareaHandler } from '../application/commands/eliminar-tarea.handler';
import { ListarTareasHandler } from '../application/queries/listar-tareas.handler';
import { ObtenerTareaHandler } from '../application/queries/obtener-tarea.handler';
import { TareasController } from './tareas.controller';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

const SECRET_PRUEBA = 'test-secret';
// Token real firmado con el mismo secret que registra el módulo de prueba: el guard lo valida de verdad.
const TOKEN_VALIDO = `Bearer ${new JwtService({ secret: SECRET_PRUEBA }).sign({ sub: '1' })}`;

describe('TareasController (integración: guard real + dobles de handlers)', () => {
  let tareaFixture: {
    id: number;
    titulo: string;
    descripcion: string | null;
    estado: 'pendiente';
    creadaEn: Date;
  };

  const handlersMock = {
    crearTarea: { ejecutar: jest.fn() },
    listarTareas: { ejecutar: jest.fn() },
    obtenerTarea: { ejecutar: jest.fn() },
    actualizarTarea: { ejecutar: jest.fn() },
    eliminarTarea: { ejecutar: jest.fn() },
  };

  beforeAll(() => {
    tareaFixture = {
      id: 1,
      titulo: 'Estudar NestJS',
      descripcion: 'Capítulo 1',
      estado: 'pendiente',
      creadaEn: new Date(),
    };
    handlersMock.crearTarea.ejecutar.mockResolvedValue(tareaFixture);
    handlersMock.listarTareas.ejecutar.mockResolvedValue([tareaFixture]);
    handlersMock.obtenerTarea.ejecutar.mockResolvedValue(tareaFixture);
    handlersMock.actualizarTarea.ejecutar.mockResolvedValue({
      ...tareaFixture,
      estado: 'completada' as const,
    });
    handlersMock.eliminarTarea.ejecutar.mockResolvedValue(undefined);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
  });

  it('201: debe crear una tarea con token válido', async () => {
    const appLocal = await montarApp();
    // Act
    const respuesta = await request(appLocal.getHttpServer())
      .post('/tareas')
      .set('Authorization', TOKEN_VALIDO)
      .send({ titulo: 'Estudar NestJS' });
    // Assert
    expect(respuesta.status).toBe(201);
    expect(respuesta.body).toMatchObject({
      id: 1,
      titulo: 'Estudar NestJS',
      estado: 'pendiente',
    });
    await appLocal.close();
  });

  it('200: debe listar tareas con token válido', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .get('/tareas')
      .set('Authorization', TOKEN_VALIDO);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body).toHaveLength(1);
    await appLocal.close();
  });

  it('200: debe obtener una tarea por ID con token válido', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .get('/tareas/1')
      .set('Authorization', TOKEN_VALIDO);
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.id).toBe(1);
    await appLocal.close();
  });

  it('200: debe actualizar una tarea con token válido', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .put('/tareas/1')
      .set('Authorization', TOKEN_VALIDO)
      .send({ estado: 'completada' });
    expect(respuesta.status).toBe(200);
    expect(respuesta.body.estado).toBe('completada');
    await appLocal.close();
  });

  it('204: debe eliminar una tarea con token válido', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .delete('/tareas/1')
      .set('Authorization', TOKEN_VALIDO);
    expect(respuesta.status).toBe(204);
    await appLocal.close();
  });

  it('400: debe rechazar una creación sin título (ValidationPipe)', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .post('/tareas')
      .set('Authorization', TOKEN_VALIDO)
      .send({ descripcion: 'sin titulo' });
    expect(respuesta.status).toBe(400);
    expect(handlersMock.crearTarea.ejecutar).not.toHaveBeenCalled();
    await appLocal.close();
  });

  it('404: debe responder tarea no encontrada al obtener un ID inexistente', async () => {
    handlersMock.obtenerTarea.ejecutar.mockRejectedValueOnce(
      new NotFoundException('Tarea 999 no encontrada'),
    );
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .get('/tareas/999')
      .set('Authorization', TOKEN_VALIDO);
    expect(respuesta.status).toBe(404);
    await appLocal.close();
  });

  it('401: debe rechazar la petición sin token', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer()).get('/tareas');
    expect(respuesta.status).toBe(401);
    expect(handlersMock.listarTareas.ejecutar).not.toHaveBeenCalled();
    await appLocal.close();
  });

  it('401: debe rechazar la petición con token inválido', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .get('/tareas')
      .set('Authorization', 'Bearer token-invalido');
    expect(respuesta.status).toBe(401);
    await appLocal.close();
  });

  async function montarApp() {
    // Controller con su guard real (JwtService real del JwtModule) y dobles de handlers:
    // la persistencia queda fuera del alcance unitario, los estados HTTP sí se prueban de verdad.
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET_PRUEBA })],
      controllers: [TareasController],
      providers: [
        JwtAuthGuard,
        { provide: CrearTareaHandler, useValue: handlersMock.crearTarea },
        { provide: ListarTareasHandler, useValue: handlersMock.listarTareas },
        { provide: ObtenerTareaHandler, useValue: handlersMock.obtenerTarea },
        { provide: ActualizarTareaHandler, useValue: handlersMock.actualizarTarea },
        { provide: EliminarTareaHandler, useValue: handlersMock.eliminarTarea },
      ],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();
    return app;
  }
});
