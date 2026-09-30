import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
} from 'typeorm';

/** Entidad de persistencia (adaptador TypeORM). El modelo de dominio vive en domain/tarea.ts. */
@Entity('tareas')
export class TareaEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 200 })
  titulo: string;

  @Column({ type: 'text', nullable: true })
  descripcion: string | null;

  @Column({ length: 20, default: 'pendiente' })
  estado: string;

  @CreateDateColumn({ type: 'timestamptz' })
  creadaEn: Date;
}
