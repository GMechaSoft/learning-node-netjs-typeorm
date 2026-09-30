import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

/**
 * Guard de autenticación JWT en el borde (coding-standards §4: autenticación en el borde).
 * Verifica el token Bearer; la emisión de tokens es responsabilidad del módulo auth (HU futura).
 */
@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ headers: { authorization?: string } }>();
    const [tipo, token] = request.headers.authorization?.split(' ') ?? [];
    if (tipo !== 'Bearer' || !token) {
      throw new UnauthorizedException('Token JWT ausente');
    }
    try {
      this.jwtService.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token JWT inválido');
    }
  }
}
