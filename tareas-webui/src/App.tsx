import { useEffect, useState } from 'react';
import { Mensajes } from './components/mensajes';
import { TareaForm, type ValoresTareaForm } from './components/tarea-form';
import { TareaList } from './components/tarea-list';
import { TokenAuth } from './components/token-auth';
import { useToken } from './hooks/use-token';
import { useTareas } from './hooks/use-tareas';
import type { Tarea } from './types/tarea';
import './App.css';

/**
 * Composición de la única vista (SPA): autenticación + formulario + listado + mensajes.
 * Carga el listado al montar si hay token guardado; al guardar/cambiar el token
 * se vuelve a cargar con el nuevo; al quitarlo se limpia el listado.
 */
export default function App() {
  const { token, guardarToken, limpiarToken } = useToken();
  const { tareas, cargando, accionEnCurso, mensaje, cargar, crear, actualizar, cambiarEstado, eliminar, descartarMensaje } =
    useTareas(token);
  const [tareaEnEdicion, setTareaEnEdicion] = useState<Tarea | null>(null);

  useEffect(() => {
    if (token) {
      void cargar();
    }
    // Solo al montar y cuando cambia el token (la identidad de cargar).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, cargar]);

  const manejarGuardarToken = (nuevo: string) => {
    guardarToken(nuevo);
  };

  const manejarLimpiarToken = () => {
    limpiarToken();
    setTareaEnEdicion(null);
  };

  const manejarSubmit = (tarea: Tarea | null, valores: ValoresTareaForm) => {
    if (tarea) {
      const { titulo, descripcion, estado } = valores;
      const sinCambios =
        titulo === tarea.titulo &&
        (descripcion ?? '') === (tarea.descripcion ?? '') &&
        estado === tarea.estado;
      if (sinCambios) {
        setTareaEnEdicion(null);
        return;
      }
      void actualizar(tarea.id, { titulo, descripcion, estado });
      setTareaEnEdicion(null);
    } else {
      void crear({ titulo: valores.titulo, ...(valores.descripcion ? { descripcion: valores.descripcion } : {}) });
    }
  };

  return (
    <div className="app">
      <header className="app__header">
        <h1>Gestión de tareas</h1>
      </header>

      <TokenAuth tokenInicial={token} onGuardar={manejarGuardarToken} onLimpiar={manejarLimpiarToken} />

      <Mensajes mensaje={mensaje} onDescartar={descartarMensaje} />

      {token ? (
        <main className="app__cuerpo">
          <TareaForm
            tarea={tareaEnEdicion}
            enCurso={accionEnCurso}
            onSubmit={manejarSubmit}
            onCancelar={() => setTareaEnEdicion(null)}
          />
          <TareaList
            tareas={tareas}
            cargando={cargando}
            tareaEnEdicion={tareaEnEdicion}
            onEditar={setTareaEnEdicion}
            onCambiarEstado={(id, estado) => void cambiarEstado(id, estado)}
            onEliminar={(id) => void eliminar(id)}
          />
        </main>
      ) : (
        <main className="app__cuerpo app__cuerpo--sin-token">
          <p className="app__sin-token">
            Guarda un token JWT arriba para ver y gestionar tus tareas.
          </p>
        </main>
      )}
    </div>
  );
}
