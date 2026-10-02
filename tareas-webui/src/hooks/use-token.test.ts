import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useToken } from './use-token';

describe('useToken — persistencia en localStorage (AC6)', () => {
  it('arranca sin token y lo persiste al guardarlo (QA-07)', () => {
    const { result } = renderHook(() => useToken());
    expect(result.current.token).toBeNull();

    act(() => {
      result.current.guardarToken('token-nuevo');
    });
    expect(result.current.token).toBe('token-nuevo');
    expect(window.localStorage.getItem('tareas-webui:token')).toBe('token-nuevo');
  });

  it('sobrevive a la "recarga": un nuevo render lee el token guardado (QA-07)', () => {
    window.localStorage.setItem('tareas-webui:token', 'token-persistido');
    const { result } = renderHook(() => useToken());
    expect(result.current.token).toBe('token-persistido');
  });

  it('reemplaza el token anterior sin dejar rastro (QA-08)', () => {
    window.localStorage.setItem('tareas-webui:token', 'token-antiguo');
    const { result } = renderHook(() => useToken());
    expect(result.current.token).toBe('token-antiguo');

    act(() => {
      result.current.guardarToken('token-nuevo');
    });
    expect(result.current.token).toBe('token-nuevo');
    expect(window.localStorage.getItem('tareas-webui:token')).toBe('token-nuevo');
  });

  it('limpiarToken lo quita del almacenamiento y del estado', () => {
    window.localStorage.setItem('tareas-webui:token', 'token-por-quitar');
    const { result } = renderHook(() => useToken());

    act(() => {
      result.current.limpiarToken();
    });
    expect(result.current.token).toBeNull();
    expect(window.localStorage.getItem('tareas-webui:token')).toBeNull();
  });

  it('guardar vacío equivale a limpiar (evita token en blanco)', () => {
    const { result } = renderHook(() => useToken());
    act(() => {
      result.current.guardarToken('token-uno');
    });

    act(() => {
      result.current.guardarToken('   ');
    });
    expect(result.current.token).toBeNull();
    expect(window.localStorage.getItem('tareas-webui:token')).toBeNull();
  });
});
