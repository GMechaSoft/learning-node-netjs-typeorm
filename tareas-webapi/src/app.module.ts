import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule, type JwtModuleOptions, type JwtSignOptions } from "@nestjs/jwt";
import { TypeOrmModule } from '@nestjs/typeorm';
import { TareaEntity } from './modules/tareas/infrastructure/tarea.entity';
import { TareasModule } from './modules/tareas/tareas.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres' as const,
        host: config.get<string>('DB_HOST'),
        port: config.get<number>('DB_PORT'),
        username: config.get<string>('DB_USER'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get<string>('DB_NAME'),
        entities: [TareaEntity],
        // Solo desarrollo; en producción usar migraciones (coding-standards §Evolución)
        synchronize: config.get<string>('DB_SYNCHRONIZE') === 'true',
        logging: false,
      }),
    }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService): JwtModuleOptions => ({
        secret: config.get<string>("JWT_SECRET"),
        signOptions: {
          expiresIn: config.get<string>("JWT_EXPIRES_IN", "1h") as JwtSignOptions["expiresIn"],
        },
      }),
    }),
    TareasModule,
  ],
})
export class AppModule {}
