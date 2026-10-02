import { useState, type FormEvent } from 'react';
import type { EstadoTarea, Tarea } from '../types/tarea';
import './tarea-form.css';

export interface ValoresTareaForm {
  titulo: string;
  descripcion: string;
  estado: EstadoTarea;
}

interface TareaFormProps {
  tarea: Tarea | null;
  enCurso: boolean;
  onSubmit: (tarea: Tarea | null, valores: ValoresTareaForm) => void;
  onCancelar: () => void;
}

/**
 * Formulario de tarea con modo crear (tarea=null) y modo editar (tarea!=null).
 * El estado inicial se deriva de la tarea en el montaje: el padre re-monta el
 * formulario con una `key` distinta por cada tarea en edición, así no hace
 * falta un efecto para rellenarlo. Valida el título en el cliente sin llamar a
 * la API (AC7); el botón Enviar se deshabilita mientras hay una acción en vuelo.
 */
export function TareaForm({ tarea, enCurso, onSubmit, onCancelar }: TareaFormProps) {
  const [valorTitulo, setValorTitulo] = useState(tarea?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(tarea?.descripcion ?? '');
  const [estado, setEstado] = useState<EstadoTarea>(tarea?.estado ?? 'pendiente');
  const [errorTitulo, setErrorTitulo] = useState(false);

  const manejarEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (valorTitulo.trim().length === 0) {
      setErrorTitulo(true);
      return;
    }
    const valores: ValoresTareaForm = {
      titulo: valorTitulo,
      descripcion: descripcion.trim(),
      estado,
    };
    onSubmit(tarea, valores);
    if (!tarea) {
      // Creación: limpiar el formulario para la siguiente tarea (AC2).
      setValorTitulo('');
      setDescripcion('');
      setEstado('pendiente');
      setErrorTitulo(false);
    }
  };

  return (
    <form className="tarea-form" onSubmit={manejarEnviar} aria-label={tarea ? 'Actualizar tarea' : 'Crear tarea'}>
      <h2 className="tarea-form__titulo">{tarea ? 'Actualizar tarea' : 'Crear tarea'}</h2>

      <div className="tarea-form__campo">
        <label htmlFor="tarea-titulo">Título (obligatorio)</label>
        <input
          id="tarea-titulo"
          type="text"
          value={valorTitulo}
          aria-invalid={errorTitulo || undefined}
          onChange={(e) => {
            setValorTitulo(e.target.value);
            if (errorTitulo && e.target.value.trim().length > 0) setErrorTitulo(false);
          }}
        />
        {errorTitulo && <span className="tarea-form__error">El título es obligatorio.</span>}
      </div>

      <div className="tarea-form__campo">
        <label htmlFor="tarea-descripcion">Descripción (opcional)</label>
        <textarea
          id="tarea-descripcion"
          rows={3}
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
        />
      </div>

      <div className="tarea-form__campo">
        <label htmlFor="tarea-estado">Estado</label>
        <select
          id="tarea-estado"
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoTarea)}
        >
          <option value="pendiente">pendiente</option>
          <option value="completada">completada</option>
        </select>
      </div>

      <div className="tarea-form__acciones">
        <button type="submit" disabled={enCurso}>
          {enCurso ? 'Guardando…' : tarea ? 'Guardar cambios' : 'Crear'}
        </button>
        {tarea && (
          <button type="button" className="tarea-form__cancelar" onClick={onCancelar}>
            Cancelar
          </button>
        )}
      </div>
    </form>
  );
}
