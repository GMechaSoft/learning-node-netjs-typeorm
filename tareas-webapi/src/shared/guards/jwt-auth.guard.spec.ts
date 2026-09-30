import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { JwtAuthGuard } from './jwt-auth.guard';

function contextoCon(authorization?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        headers: authorization ? { authorization } : {},
      }),
    }),
  } as unknown as ExecutionContext;
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: { verify: jest.Mock };

  beforeEach(async () => {
    jwtService = { verify: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [JwtAuthGuard, { provide: JwtService, useValue: jwtService }],
    }).compile();
    guard = moduleRef.get(JwtAuthGuard);
  });

  it('debe permitir el acceso con un token Bearer válido', () => {
    jwtService.verify.mockReturnValue({ sub: '1' });
    expect(guard.canActivate(contextoCon('Bearer token-valido'))).toBe(true);
  });

  it('debe lanzar UnauthorizedException cuando no hay header Authorization', () => {
    expect(() => guard.canActivate(contextoCon(undefined))).toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar UnauthorizedException cuando el esquema no es Bearer', () => {
    expect(() => guard.canActivate(contextoCon('Basic abc'))).toThrow(
      UnauthorizedException,
    );
  });

  it('debe lanzar UnauthorizedException cuando el token es inválido', () => {
    jwtService.verify.mockImplementation(() => {
      throw new Error('jwt expired');
    });
    expect(() =>
      guard.canActivate(contextoCon('Bearer token-invalido')),
    ).toThrow(UnauthorizedException);
  });
});
