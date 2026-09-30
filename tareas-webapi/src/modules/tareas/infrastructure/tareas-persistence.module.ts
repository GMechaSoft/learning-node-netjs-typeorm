import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TAREA_REPOSITORY } from '../domain/tarea-repository.port';
import { TareaEntity } from './tarea.entity';
import { TareaRepositoryImpl } from './tarea-repository.impl';

@Module({
  imports: [TypeOrmModule.forFeature([TareaEntity])],
  providers: [
    TareaRepositoryImpl,
    {
      provide: TAREA_REPOSITORY,
      useExisting: TareaRepositoryImpl,
    },
  ],
  exports: [TAREA_REPOSITORY],
})
export class TareasPersistenceModule {}
