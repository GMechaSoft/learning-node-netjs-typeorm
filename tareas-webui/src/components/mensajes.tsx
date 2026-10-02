import type { MensajeUi } from '../hooks/use-tareas';
import './mensajes.css';

interface MensajesProps {
  mensaje: MensajeUi | null;
  onDescartar: () => void;
}

/** Zona única de feedback (éxito / validación / error) compartida por todas las acciones. */
export function Mensajes({ mensaje, onDescartar }: MensajesProps) {
  if (!mensaje) return null;
  return (
    <div className={`mensajes mensajes--${mensaje.tipo}`} role="status">
      <span>{mensaje.texto}</span>
      <button type="button" className="mensajes__cerrar" onClick={onDescartar} aria-label="Cerrar mensaje">
        ×
      </button>
    </div>
  );
}
