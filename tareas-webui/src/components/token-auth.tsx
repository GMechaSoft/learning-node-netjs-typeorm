import { useState } from 'react';
import './token-auth.css';

interface TokenAuthProps {
  tokenInicial: string | null;
  onGuardar: (token: string) => void;
  onLimpiar: () => void;
}

/** Campo de autenticación: ingresa o reemplaza el token JWT (persistente entre recargas, AC6). */
export function TokenAuth({ tokenInicial, onGuardar, onLimpiar }: TokenAuthProps) {
  const [entrada, setEntrada] = useState(tokenInicial ?? '');
  const hayToken = tokenInicial !== null;

  const manejarGuardar = () => {
    if (entrada.trim().length > 0) onGuardar(entrada);
  };

  return (
    <section className="token-auth" aria-label="Autenticación">
      <label className="token-auth__etiqueta" htmlFor="token-jwt">
        Token JWT
      </label>
      <div className="token-auth__fila">
        <input
          id="token-jwt"
          className="token-auth__campo"
          type="password"
          value={entrada}
          placeholder="Pega aquí tu token JWT"
          autoComplete="off"
          onChange={(evento) => setEntrada(evento.target.value)}
        />
        <button type="button" className="token-auth__guardar" onClick={manejarGuardar}>
          Guardar
        </button>
        {hayToken && (
          <button type="button" className="token-auth__limpiar" onClick={onLimpiar}>
            Quitar
          </button>
        )}
      </div>
      <p className="token-auth__estado">
        {hayToken ? 'Token guardado. El listado usa este token en cada petición.' : 'Sin token: pégalo y guárdalo para cargar el listado.'}
      </p>
    </section>
  );
}
