import { useEffect, useState } from 'react';
import { Mensajes } from './components/mensajes';
import { TareaForm, type ValoresTareaForm } from './components/tarea-form';
import { TareaList } from './components/tarea-list';
import { UsuarioAuth } from './components/usuario-auth';
import { useUsuario } from './hooks/use-usuario';
import { useTareas } from './hooks/use-tareas';
import type { Tarea } from './types/tarea';
import './App.css';

/**
 * Composición de la única vista (SPA): autenticación por usuario + formulario + listado
 * + mensajes. Al montar, si hay sesión guardada (usuario + token) carga el listado;
 * al iniciar sesión se emite el token y se vuelve a cargar; al salir se limpia el listado.
 */
export default function App() {
  const { usuario, token, emitiendo, iniciarSesion, cerrarSesion } = useUsuario();
  const { tareas, cargando, accionEnCurso, mensaje, cargar, crear, actualizar, cambiarEstado, eliminar, descartarMensaje } =
    useTareas(token);
  const [tareaEnEdicion, setTareaEnEdicion] = useState<Tarea | null>(null);

  useEffect(() => {
    if (token) {
      void cargar();
    }
  }, [token, cargar]);

  const manejarCerrarSesion = () => {
    cerrarSesion();
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

      <UsuarioAuth
        usuarioInicial={usuario}
        token={token}
        emitiendo={emitiendo}
        onIniciarSesion={(u) => void iniciarSesion(u)}
        onCerrar={manejarCerrarSesion}
      />

      <Mensajes mensaje={mensaje} onDescartar={descartarMensaje} />

      {token ? (
        <main className="app__cuerpo">
          <TareaForm
            key={tareaEnEdicion ? `editar-${tareaEnEdicion.id}` : 'crear'}
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
            Escribe tu usuario arriba y pulsa Entrar para ver y gestionar tus tareas.
          </p>
        </main>
      )}
    </div>
  );
}
