import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { emitirToken } from '../api/auth.client';
import { useUsuario } from './use-usuario';

vi.mock('../api/auth.client', () => ({
  emitirToken: vi.fn(),
}));

afterEach(() => {
  vi.clearAllMocks();
  window.localStorage.clear();
});

describe('useUsuario — login por usuario (emite token + persistencia)', () => {
  it('arranca sin sesión', () => {
    const { result } = renderHook(() => useUsuario());
    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.emitiendo).toBe(false);
  });

  it('iniciarSesion emite el token, lo persiste y devuelve true', async () => {
    vi.mocked(emitirToken).mockResolvedValue('token-emitido');
    const { result } = renderHook(() => useUsuario());

    await act(async () => {
      await result.current.iniciarSesion('gerson.sanchez');
    });

    expect(emitirToken).toHaveBeenCalledWith('gerson.sanchez');
    expect(result.current.usuario).toBe('gerson.sanchez');
    expect(result.current.token).toBe('token-emitido');
    expect(window.localStorage.getItem('tareas-webui:usuario')).toBe('gerson.sanchez');
    expect(window.localStorage.getItem('tareas-webui:token')).toBe('token-emitido');
  });

  it('iniciarSesion recorta espacios al usuario antes de emitir', async () => {
    vi.mocked(emitirToken).mockResolvedValue('token-emitido');
    const { result } = renderHook(() => useUsuario());

    await act(async () => {
      await result.current.iniciarSesion('  ana.lópez  ');
    });

    expect(emitirToken).toHaveBeenCalledWith('ana.lópez');
    expect(result.current.usuario).toBe('ana.lópez');
  });

  it('iniciarSesion con usuario vacío no emite y devuelve false', async () => {
    const { result } = renderHook(() => useUsuario());

    let ok = true;
    await act(async () => {
      ok = await result.current.iniciarSesion('   ');
    });

    expect(ok).toBe(false);
    expect(emitirToken).not.toHaveBeenCalled();
    expect(result.current.usuario).toBeNull();
  });

  it('iniciarSesion devuelve false sin romper si el backend falla', async () => {
    vi.mocked(emitirToken).mockRejectedValue(new Error('red'));
    const { result } = renderHook(() => useUsuario());

    let ok = true;
    await act(async () => {
      ok = await result.current.iniciarSesion('gerson.sanchez');
    });

    expect(ok).toBe(false);
    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBeNull();
    expect(result.current.emitiendo).toBe(false);
  });

  it('sobre-scribe una sesión anterior con la nueva (reemplazo)', async () => {
    window.localStorage.setItem('tareas-webui:usuario', 'viejo');
    window.localStorage.setItem('tareas-webui:token', 'token-viejo');
    vi.mocked(emitirToken).mockResolvedValue('token-nuevo');
    const { result } = renderHook(() => useUsuario());

    expect(result.current.usuario).toBe('viejo');

    await act(async () => {
      await result.current.iniciarSesion('nuevo');
    });

    expect(result.current.usuario).toBe('nuevo');
    expect(result.current.token).toBe('token-nuevo');
    expect(window.localStorage.getItem('tareas-webui:usuario')).toBe('nuevo');
    expect(window.localStorage.getItem('tareas-webui:token')).toBe('token-nuevo');
  });

  it('cerrarSesion borra usuario y token del almacenamiento y del estado', () => {
    window.localStorage.setItem('tareas-webui:usuario', 'gerson.sanchez');
    window.localStorage.setItem('tareas-webui:token', 'token-x');
    const { result } = renderHook(() => useUsuario());

    expect(result.current.usuario).toBe('gerson.sanchez');

    act(() => {
      result.current.cerrarSesion();
    });

    expect(result.current.usuario).toBeNull();
    expect(result.current.token).toBeNull();
    expect(window.localStorage.getItem('tareas-webui:usuario')).toBeNull();
    expect(window.localStorage.getItem('tareas-webui:token')).toBeNull();
  });
});
