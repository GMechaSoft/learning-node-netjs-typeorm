import type { EstadoTarea, Tarea } from '../types/tarea';
import './tarea-item.css';

interface TareaItemProps {
  tarea: Tarea;
  enEdicion: boolean;
  onEditar: (tarea: Tarea) => void;
  onCambiarEstado: (id: number, estado: EstadoTarea) => void;
  onEliminar: (id: number) => void;
}

/** Una fila del listado: título, descripción, estado y acciones (editar/cambiar estado/eliminar). */
export function TareaItem({ tarea, enEdicion, onEditar, onCambiarEstado, onEliminar }: TareaItemProps) {
  const estadoOtro: EstadoTarea = tarea.estado === 'pendiente' ? 'completada' : 'pendiente';
  return (
    <li className={`tarea-item${enEdicion ? ' tarea-item--editando' : ''}`}>
      <div className="tarea-item__contenido">
        <span className={`tarea-item__titulo${tarea.estado === 'completada' ? ' tarea-item__titulo--completada' : ''}`}>
          {tarea.titulo}
        </span>
        {tarea.descripcion && <span className="tarea-item__descripcion">{tarea.descripcion}</span>}
      </div>
      <div className="tarea-item__estado">
        <span className={`tarea-item__badge tarea-item__badge--${tarea.estado}`}>{tarea.estado}</span>
      </div>
      <div className="tarea-item__acciones">
        <button type="button" onClick={() => onEditar(tarea)}>Editar</button>
        <button type="button" onClick={() => onCambiarEstado(tarea.id, estadoOtro)}>
          Marcar {estadoOtro}
        </button>
        <button type="button" className="tarea-item__eliminar" onClick={() => onEliminar(tarea.id)}>
          Eliminar
        </button>
      </div>
    </li>
  );
}
