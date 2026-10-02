import { BadRequestException, Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { EmitirTokenDto } from './dto/emitir-token.dto';

/**
 * Emisión de tokens JWT para desarrollo.
 *
 * Ruta PÚBLICA (sin guard): se cambia la forma de autenticar — basta un nombre de
 * usuario y la API firma el token con su `JWT_SECRET` (el secret vive en el backend,
 * nunca en el cliente). El token devuelto es el mismo que valida `JwtAuthGuard` en
 * `/tareas`. En producción sustituirlo por un flujo de login con credenciales (HU auth).
 */
@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly jwtService: JwtService) {}

  @Post('token')
  @HttpCode(200)
  @ApiOperation({ summary: 'Emitir un token JWT a partir de un nombre de usuario' })
  @ApiResponse({ status: 200, description: 'Token emitido' })
  @ApiResponse({ status: 400, description: 'Usuario ausente o vacío' })
  async emitirToken(@Body() emitirTokenDto: EmitirTokenDto): Promise<{ token: string }> {
    const usuario = emitirTokenDto.usuario.trim();
    if (usuario.length === 0) {
      throw new BadRequestException('El usuario no puede estar vacío');
    }
    const token = this.jwtService.sign({ sub: usuario });
    return { token };
  }
}
