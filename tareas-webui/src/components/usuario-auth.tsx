import { useState, type FormEvent } from 'react';
import './usuario-auth.css';

interface UsuarioAuthProps {
  usuarioInicial: string | null;
  token: string | null;
  emitiendo: boolean;
  onIniciarSesion: (usuario: string) => void;
  onCerrar: () => void;
}

/**
 * Campo de autenticación: ingresa tu nombre de usuario y la app solicita el token
 * al backend (el secret vive en el servidor, nunca en el cliente). El usuario y el
 * token quedan persistentes entre recargas (AC6). El token emitido se puede ver y
 * copiar en el campo de solo lectura.
 */
export function UsuarioAuth({ usuarioInicial, token, emitiendo, onIniciarSesion, onCerrar }: UsuarioAuthProps) {
  const [entrada, setEntrada] = useState(usuarioInicial ?? '');
  const [mostrarToken, setMostrarToken] = useState(false);
  const hayUsuario = usuarioInicial !== null;

  const manejarEnviar = (evento: FormEvent) => {
    evento.preventDefault();
    if (entrada.trim().length > 0 && !emitiendo) {
      onIniciarSesion(entrada);
    }
  };

  const manejarCopiar = async () => {
    if (!token) return;
    try {
      await navigator.clipboard.writeText(token);
    } catch {
      // Sin permiso de clipboard: el usuario puede copiarlo del campo de solo lectura.
    }
  };

  return (
    <section className="usuario-auth" aria-label="Autenticación">
      <form className="usuario-auth__form" onSubmit={manejarEnviar}>
        <label className="usuario-auth__etiqueta" htmlFor="usuario-login">
          Usuario
        </label>
        <div className="usuario-auth__fila">
          <input
            id="usuario-login"
            className="usuario-auth__campo"
            type="text"
            value={entrada}
            placeholder="Escribe tu nombre de usuario"
            autoComplete="username"
            onChange={(evento) => setEntrada(evento.target.value)}
          />
          <button type="submit" className="usuario-auth__guardar" disabled={emitiendo}>
            {emitiendo ? 'Entrando…' : 'Entrar'}
          </button>
          {hayUsuario && (
            <button type="button" className="usuario-auth__limpiar" onClick={onCerrar} disabled={emitiendo}>
              Salir
            </button>
          )}
        </div>
      </form>

      {hayUsuario && token && (
        <div className="usuario-auth__token">
          <div className="usuario-auth__token-acciones">
            <button
              type="button"
              className="usuario-auth__ver"
              onClick={() => setMostrarToken((v) => !v)}
            >
              {mostrarToken ? 'Ocultar token' : 'Ver token'}
            </button>
            <button type="button" className="usuario-auth__copiar" onClick={() => void manejarCopiar()}>
              Copiar
            </button>
          </div>
          {mostrarToken && (
            <input
              className="usuario-auth__token-valor"
              type="text"
              readOnly
              value={token}
              aria-label="Token emitido"
            />
          )}
        </div>
      )}

      <p className="usuario-auth__estado">
        {hayUsuario
          ? `Sesión como ${usuarioInicial}. El listado usa el token emitido para este usuario.`
          : 'Sin sesión: escribe tu usuario y pulsa Entrar para emitir el token y cargar tus tareas.'}
      </p>
    </section>
  );
}
