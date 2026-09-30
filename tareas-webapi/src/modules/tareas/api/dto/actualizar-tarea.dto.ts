import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ESTADOS_TAREA } from '../../domain/estado-tarea';

export class ActualizarTareaDto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional({ example: 'Título actualizado' })
  titulo?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'Descripción actualizada' })
  descripcion?: string;

  @IsOptional()
  @IsIn(ESTADOS_TAREA)
  @ApiPropertyOptional({ enum: ESTADOS_TAREA, example: 'completada' })
  estado?: (typeof ESTADOS_TAREA)[number];
}
