import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CrearTareaDto {
  @IsString()
  @IsNotEmpty()
  @ApiProperty({ example: 'Estudar NestJS' })
  titulo: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Capítulo 1: introducción' })
  descripcion?: string;
}
