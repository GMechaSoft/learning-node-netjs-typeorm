import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiResponse } from '@nestjs/swagger';
import { ActualizarTareaHandler } from '../application/commands/actualizar-tarea.handler';
import { CrearTareaHandler } from '../application/commands/crear-tarea.handler';
import { EliminarTareaHandler } from '../application/commands/eliminar-tarea.handler';
import { ListarTareasHandler } from '../application/queries/listar-tareas.handler';
import { ObtenerTareaHandler } from '../application/queries/obtener-tarea.handler';
import { Tarea } from '../domain/tarea';
import { ActualizarTareaDto } from './dto/actualizar-tarea.dto';
import { CrearTareaDto } from './dto/crear-tarea.dto';
import { JwtAuthGuard } from '../../../shared/guards/jwt-auth.guard';

@ApiTags('tareas')
@UseGuards(JwtAuthGuard)
@Controller('tareas')
export class TareasController {
  constructor(
    private readonly crearTarea: CrearTareaHandler,
    private readonly listarTareas: ListarTareasHandler,
    private readonly obtenerTarea: ObtenerTareaHandler,
    private readonly actualizarTarea: ActualizarTareaHandler,
    private readonly eliminarTarea: EliminarTareaHandler,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Crear una tarea' })
  @ApiResponse({ status: 201, description: 'Tarea creada' })
  @ApiResponse({ status: 400, description: 'Datos de validación inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async crear(@Body() crearTareaDto: CrearTareaDto): Promise<Tarea> {
    return this.crearTarea.ejecutar(crearTareaDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar tareas' })
  @ApiResponse({ status: 200, description: 'Colección de tareas' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  async listar(): Promise<Tarea[]> {
    return this.listarTareas.ejecutar();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener una tarea por ID' })
  @ApiResponse({ status: 200, description: 'Tarea encontrada' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async obtener(@Param('id', ParseIntPipe) id: number): Promise<Tarea> {
    return this.obtenerTarea.ejecutar(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Actualizar una tarea' })
  @ApiResponse({ status: 200, description: 'Tarea actualizada' })
  @ApiResponse({ status: 400, description: 'Datos de validación inválidos' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async actualizar(
    @Param('id', ParseIntPipe) id: number,
    @Body() actualizarTareaDto: ActualizarTareaDto,
  ): Promise<Tarea> {
    return this.actualizarTarea.ejecutar(id, actualizarTareaDto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Eliminar una tarea' })
  @ApiResponse({ status: 204, description: 'Tarea eliminada' })
  @ApiResponse({ status: 401, description: 'Token JWT ausente o inválido' })
  @ApiResponse({ status: 404, description: 'Tarea no encontrada' })
  async eliminar(@Param('id', ParseIntPipe) id: number): Promise<void> {
    await this.eliminarTarea.ejecutar(id);
  }
}
