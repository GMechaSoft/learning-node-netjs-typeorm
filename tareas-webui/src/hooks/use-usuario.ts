import { useCallback, useState } from 'react';
import { emitirToken } from '../api/auth.client';

const USUARIO_STORAGE_KEY = 'tareas-webui:usuario';
const TOKEN_STORAGE_KEY = 'tareas-webui:token';

function leerGuardado(clave: string): string | null {
  const valor = localStorage.getItem(clave);
  return valor && valor.trim().length > 0 ? valor : null;
}

/**
 * Autenticación por nombre de usuario (cambio de forma de autenticar): se guarda el
 * usuario en `localStorage` y se solicita un token JWT al backend (`POST /api/auth/token`),
 * que a su vez se persiste. `iniciarSesion` devuelve `true`/`false` y expone
 * `emitiendo` para que la UI muestre el estado mientras se emite el token.
 */
export function useUsuario() {
  const [usuario, setUsuario] = useState<string | null>(() => leerGuardado(USUARIO_STORAGE_KEY));
  const [token, setToken] = useState<string | null>(() => leerGuardado(TOKEN_STORAGE_KEY));
  const [emitiendo, setEmitiendo] = useState(false);

  const iniciarSesion = useCallback(async (nuevoUsuario: string): Promise<boolean> => {
    const limpio = nuevoUsuario.trim();
    if (limpio.length === 0) {
      return false;
    }
    setEmitiendo(true);
    try {
      const nuevoToken = await emitirToken(limpio);
      localStorage.setItem(USUARIO_STORAGE_KEY, limpio);
      localStorage.setItem(TOKEN_STORAGE_KEY, nuevoToken);
      setUsuario(limpio);
      setToken(nuevoToken);
      return true;
    } catch {
      return false;
    } finally {
      setEmitiendo(false);
    }
  }, []);

  const cerrarSesion = useCallback(() => {
    localStorage.removeItem(USUARIO_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setUsuario(null);
    setToken(null);
  }, []);

  return { usuario, token, emitiendo, iniciarSesion, cerrarSesion };
}
