import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { Tarea } from '../types/tarea';
import { TareaForm } from './tarea-form';

const TAREA: Tarea = { id: 1, titulo: 'Comprar leche', descripcion: 'Dos litros', estado: 'pendiente', creadaEn: '2026-10-01T00:00:00Z' };

describe('TareaForm — validación de título (AC7)', () => {
  it('no envía si el título está vacío y muestra el mensaje de validación (QA-09)', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TareaForm tarea={null} enCurso={false} onSubmit={onSubmit} onCancelar={vi.fn()} />);

    await user.type(screen.getByLabelText(/título/i), '   ');
    await user.click(screen.getByRole('button', { name: /crear/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument();
  });

  it('envía los valores cuando el título tiene contenido (QA-03)', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TareaForm tarea={null} enCurso={false} onSubmit={onSubmit} onCancelar={vi.fn()} />);

    await user.type(screen.getByLabelText(/título/i), 'Leer libro');
    await user.type(screen.getByLabelText(/descripción/i), 'Capítulo 5');
    await user.click(screen.getByRole('button', { name: /crear/i }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(null, {
      titulo: 'Leer libro',
      descripcion: 'Capítulo 5',
      estado: 'pendiente',
    });
  });

  it('en modo editar no envía si se borra el título (QA-10)', async () => {
    const onSubmit = vi.fn();
    const user = userEvent.setup();
    render(<TareaForm tarea={TAREA} enCurso={false} onSubmit={onSubmit} onCancelar={vi.fn()} />);

    const campo = screen.getByLabelText(/título/i) as HTMLInputElement;
    await user.clear(campo);
    await user.click(screen.getByRole('button', { name: /guardar cambios/i }));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByText('El título es obligatorio.')).toBeInTheDocument();
  });

  it('deshabilita el botón mientras hay una acción en curso (QA-16)', () => {
    render(<TareaForm tarea={null} enCurso={true} onSubmit={vi.fn()} onCancelar={vi.fn()} />);
    expect(screen.getByRole('button', { name: /guardando…/i })).toBeDisabled();
  });
});
