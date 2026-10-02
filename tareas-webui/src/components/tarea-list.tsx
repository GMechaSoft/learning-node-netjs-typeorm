import type { EstadoTarea, Tarea } from '../types/tarea';
import { TareaItem } from './tarea-item';
import './tarea-list.css';

interface TareaListProps {
  tareas: Tarea[];
  cargando: boolean;
  tareaEnEdicion: Tarea | null;
  onEditar: (tarea: Tarea) => void;
  onCambiarEstado: (id: number, estado: EstadoTarea) => void;
  onEliminar: (id: number) => void;
}

/**
 * Listado de tareas: indicador "Cargando…" durante la petición (AC/detalle UI),
 * estado vacío "No hay tareas" y una fila por tarea (AC1).
 */
export function TareaList({
  tareas,
  cargando,
  tareaEnEdicion,
  onEditar,
  onCambiarEstado,
  onEliminar,
}: TareaListProps) {
  return (
    <section className="tarea-list" aria-label="Listado de tareas">
      <h2 className="tarea-list__titulo">Tareas</h2>
      {cargando ? (
        <p className="tarea-list__cargando" role="status">
          Cargando…
        </p>
      ) : tareas.length === 0 ? (
        <p className="tarea-list__vacio">No hay tareas</p>
      ) : (
        <ul className="tarea-list__ul">
          {tareas.map((tarea) => (
            <TareaItem
              key={tarea.id}
              tarea={tarea}
              enEdicion={tareaEnEdicion?.id === tarea.id}
              onEditar={onEditar}
              onCambiarEstado={onCambiarEstado}
              onEliminar={onEliminar}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
