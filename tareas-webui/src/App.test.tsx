import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ApiError } from './api/tareas.client';
import App from './App';
import { emitirToken } from './api/auth.client';
import { listarTareas } from './api/tareas.client';
import type { Tarea } from './types/tarea';

// Clase local idéntica a la real: la instancia que se rechaza tiene que ser de la
// MISMA clase que el hook compara con instanceof (la del módulo mockeado).
// vi.hoisted: disponible antes de que vi.mock (hoisted) ejecute su factory.
const { ApiErrorDePrueba } = vi.hoisted(() => {
  class ApiErrorDePruebaClase extends Error {
    status: number | 'red';
    constructor(status: number | 'red', mensaje: string) {
      super(mensaje);
      this.name = 'ApiError';
      this.status = status;
    }
  }
  return { ApiErrorDePrueba: ApiErrorDePruebaClase };
});

vi.mock('./api/tareas.client', () => ({
  listarTareas: vi.fn(),
  crearTarea: vi.fn(),
  actualizarTarea: vi.fn(),
  eliminarTarea: vi.fn(),
  mapearError: vi.fn(),
  ApiError: ApiErrorDePrueba,
}));

vi.mock('./api/auth.client', () => ({
  emitirToken: vi.fn(),
}));

const TAREA_1: Tarea = { id: 1, titulo: 'Comprar leche', descripcion: 'Dos litros', estado: 'pendiente', creadaEn: '2026-10-01T00:00:00Z' };
const TAREA_2: Tarea = { id: 2, titulo: 'Preparar informe', descripcion: 'Informe T3', estado: 'completada', creadaEn: '2026-10-01T01:00:00Z' };

function conSesion(usuario: string, token: string) {
  window.localStorage.setItem('tareas-webui:usuario', usuario);
  window.localStorage.setItem('tareas-webui:token', token);
}

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('App — integración render (QA-01, QA-02, QA-11, QA-14)', () => {
  it('muestra el listado de tareas al cargar con sesión válida (QA-01)', async () => {
    conSesion('gerson.sanchez', 'token-valido');
    vi.mocked(listarTareas).mockResolvedValue([TAREA_1, TAREA_2]);

    render(<App />);

    await waitFor(() => expect(screen.getByText('Comprar leche')).toBeInTheDocument());
    expect(screen.getByText('Preparar informe')).toBeInTheDocument();
    expect(screen.getAllByText('pendiente').length).toBeGreaterThan(0);
    expect(screen.getAllByText('completada').length).toBeGreaterThan(0);
  });

  it('muestra el estado vacío cuando no hay tareas (QA-02)', async () => {
    conSesion('gerson.sanchez', 'token-valido');
    vi.mocked(listarTareas).mockResolvedValue([]);

    render(<App />);

    await waitFor(() => expect(screen.getByText('No hay tareas')).toBeInTheDocument());
  });

  it('muestra el error genérico de token ante un 401 sin bloquearse (QA-11)', async () => {
    conSesion('gerson.sanchez', 'token-invalido-prueba');
    vi.mocked(listarTareas).mockRejectedValue(
      new ApiErrorDePrueba(401, 'Token ausente o inválido. Verifica tu token en el campo de autenticación.'),
    );

    render(<App />);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/token/i));
    // La app no se bloquea: el campo de autenticación sigue disponible para reintentar.
    expect(screen.getByLabelText(/usuario/i)).toBeInTheDocument();
  });

  it('muestra el error genérico de red cuando la API no está accesible (QA-14)', async () => {
    conSesion('gerson.sanchez', 'token-valido');
    vi.mocked(listarTareas).mockRejectedValue(
      new ApiErrorDePrueba('red', 'No se puede conectar al servidor. Verifica que la API esté en marcha e inténtalo de nuevo.'),
    );

    render(<App />);

    await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent(/no se puede conectar/i));
  });

  it('sin sesión invita a escribir un usuario y no llama a la API (QA-07 contexto)', async () => {
    vi.mocked(listarTareas).mockResolvedValue([]);

    render(<App />);

    expect(screen.getByText(/Escribe tu usuario arriba/i)).toBeInTheDocument();
    await waitFor(() => expect(listarTareas).not.toHaveBeenCalled());
  });

  it('inicia sesión con un usuario: emite el token y carga el listado (QA-login)', async () => {
    const user = userEvent.setup();
    vi.mocked(emitirToken).mockResolvedValue('token-emitido');
    vi.mocked(listarTareas).mockResolvedValue([TAREA_1]);

    render(<App />);

    await user.type(screen.getByLabelText(/usuario/i), 'gerson.sanchez');
    await user.click(screen.getByRole('button', { name: /entrar/i }));

    expect(emitirToken).toHaveBeenCalledWith('gerson.sanchez');
    expect(window.localStorage.getItem('tareas-webui:usuario')).toBe('gerson.sanchez');
    await waitFor(() => expect(listarTareas).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByText('Comprar leche')).toBeInTheDocument());
  });

  it('tipos: el error de la API tiene el contrato ApiError', () => {
    // Guard de tipos: ApiErrorDePrueba es estructuralmente compatible con ApiError.
    const error: ApiError = new ApiErrorDePrueba(401, 'x');
    expect(error.status).toBe(401);
  });
});
