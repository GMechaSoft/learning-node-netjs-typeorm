import { useCallback, useState } from 'react';

const TOKEN_STORAGE_KEY = 'tareas-webui:token';

function leerTokenGuardado(): string | null {
  const guardado = localStorage.getItem(TOKEN_STORAGE_KEY);
  return guardado && guardado.trim().length > 0 ? guardado : null;
}

/**
 * Token JWT persistente en `localStorage` (AC6): sobrevive a la recarga de la
 * página y se reemplaza por completo cuando se guarda uno nuevo.
 */
export function useToken() {
  const [token, setToken] = useState<string | null>(() => leerTokenGuardado());

  const guardarToken = useCallback((nuevo: string) => {
    const limpio = nuevo.trim();
    if (limpio.length === 0) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      return;
    }
    localStorage.setItem(TOKEN_STORAGE_KEY, limpio);
    setToken(limpio);
  }, []);

  const limpiarToken = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
  }, []);

  return { token, guardarToken, limpiarToken };
}
