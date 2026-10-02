import { ValidationPipe } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AuthController } from './auth.controller';

const SECRET_PRUEBA = 'test-secret';

/**
 * Prueba de integración del controller de auth: ruta pública (sin guard) que emite
 * un JWT firmado con el secret real del JwtModule. El token devuelto se verifica de
 * verdad con el mismo secret (es el que valida JwtAuthGuard en /tareas).
 */
describe('AuthController (integración: emisión de token)', () => {
  it('200: emite un token verificable para un usuario dado', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .post('/auth/token')
      .send({ usuario: 'gerson.sanchez' });

    expect(respuesta.status).toBe(200);
    expect(typeof respuesta.body.token).toBe('string');

    // El token es firmado con el secret del módulo: se verifica de verdad y
    // expone el usuario en el claim `sub` (lo mismo que valida el guard).
    const verificado = new JwtService({ secret: SECRET_PRUEBA }).verify<
      { sub: string }
    >(respuesta.body.token);
    expect(verificado.sub).toBe('gerson.sanchez');
    await appLocal.close();
  });

  it('200: recorta los espacios del usuario antes de firmarlo', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .post('/auth/token')
      .send({ usuario: '  ana.lópez  ' });

    expect(respuesta.status).toBe(200);
    const verificado = new JwtService({ secret: SECRET_PRUEBA }).verify<
      { sub: string }
    >(respuesta.body.token);
    expect(verificado.sub).toBe('ana.lópez');
    await appLocal.close();
  });

  it('400: rechaza un usuario de solo espacios (tras el trim queda vacío)', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .post('/auth/token')
      .send({ usuario: '   ' });
    expect(respuesta.status).toBe(400);
    await appLocal.close();
  });

  it('400: rechaza un usuario vacío (ValidationPipe IsNotEmpty)', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .post('/auth/token')
      .send({ usuario: '' });
    expect(respuesta.status).toBe(400);
    await appLocal.close();
  });

  it('400: rechaza cuando no se envía el usuario (whitelist descarta propiedades extra)', async () => {
    const appLocal = await montarApp();
    const respuesta = await request(appLocal.getHttpServer())
      .post('/auth/token')
      .send({ otro: 'campo' });
    expect(respuesta.status).toBe(400);
    await appLocal.close();
  });

  async function montarApp() {
    const moduleRef = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: SECRET_PRUEBA })],
      controllers: [AuthController],
    }).compile();

    const app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    return app;
  }
});
