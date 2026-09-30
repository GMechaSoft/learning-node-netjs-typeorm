import { Module } from '@nestjs/common';
import { TareasController } from './api/tareas.controller';
import { ActualizarTareaHandler } from './application/commands/actualizar-tarea.handler';
import { CrearTareaHandler } from './application/commands/crear-tarea.handler';
import { EliminarTareaHandler } from './application/commands/eliminar-tarea.handler';
import { ListarTareasHandler } from './application/queries/listar-tareas.handler';
import { ObtenerTareaHandler } from './application/queries/obtener-tarea.handler';
import { TareasPersistenceModule } from './infrastructure/tareas-persistence.module';

@Module({
  imports: [TareasPersistenceModule],
  controllers: [TareasController],
  providers: [
    CrearTareaHandler,
    ListarTareasHandler,
    ObtenerTareaHandler,
    ActualizarTareaHandler,
    EliminarTareaHandler,
  ],
})
export class TareasModule {}
