import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Mensajes } from '@/components/mensajes';
import { TareaForm } from '@/components/tarea-form';
import { TareaItem } from '@/components/tarea-item';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTareas } from '@/hooks/use-tareas';
import { useTheme } from '@/hooks/use-theme';
import type { Tarea } from '@/types/tarea';

/**
 * Pantalla única de la app de tareas (HU #4): autenticación automática,
 * formulario + listado. Adaptación móvil de `tareas-webui/src/App.tsx`.
 */
export default function HomeScreen() {
  const theme = useTheme();
  const {
    tareas,
    cargando,
    accionEnCurso,
    autenticando,
    authError,
    mensaje,
    autenticar,
    crear,
    actualizar,
    cambiarEstado,
    eliminar,
  } = useTareas();
  const [tareaEnEdicion, setTareaEnEdicion] = useState<Tarea | null>(null);

  const ocupado = accionEnCurso || autenticando;

  const manejarCrear = (dto: { titulo: string; descripcion?: string }) => {
    void crear(dto);
  };

  const manejarActualizar = (id: number, titulo: string, descripcion?: string) => {
    void actualizar(id, { titulo, ...(descripcion !== undefined ? { descripcion } : {}) });
    setTareaEnEdicion(null);
  };

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ThemedText type="subtitle" style={styles.titulo}>
          Mis tareas
        </ThemedText>

        <Mensajes mensaje={mensaje} />

        {autenticando && (
          <ThemedView type="backgroundElement" style={styles.estadoAuth}>
            <ActivityIndicator size="small" />
            <ThemedText type="small" style={styles.textoEstado} testID="auth-emitiendo">
              Autenticando…
            </ThemedText>
          </ThemedView>
        )}

        {authError && (
          <ThemedView type="backgroundElement" style={styles.estadoAuth}>
            <ThemedText type="small" style={styles.textoEstado} testID="auth-error-text">
              No se pudo conectar con la API. Verifica que esté en marcha y reintenta.
            </ThemedText>
            <Pressable
              testID="auth-reintentar"
              accessibilityRole="button"
              onPress={() => void autenticar()}
              style={({ pressed }) => [
                styles.botonReintentar,
                { backgroundColor: theme.backgroundSelected },
                pressed && styles.pressed,
              ]}>
              <ThemedText type="smallBold">Reintentar</ThemedText>
            </Pressable>
          </ThemedView>
        )}

        {!autenticando && !authError && (
          <>
            <TareaForm
              key={tareaEnEdicion ? `edicion-${tareaEnEdicion.id}` : 'nueva'}
              tareaEnEdicion={tareaEnEdicion}
              ocupado={ocupado}
              onCrear={manejarCrear}
              onActualizar={manejarActualizar}
              onCancelar={() => setTareaEnEdicion(null)}
            />

            <ThemedText type="smallBold" style={styles.tituloListado}>
              Tareas
            </ThemedText>

            <ScrollView contentContainerStyle={styles.listado}>
              {cargando && (
                <ThemedView style={styles.estadoListado} testID="listado-cargando">
                  <ActivityIndicator size="small" />
                  <ThemedText type="small">Cargando…</ThemedText>
                </ThemedView>
              )}

              {!cargando && tareas.length === 0 && (
                <ThemedText type="small" style={styles.estadoListado} testID="listado-vacio">
                  No hay tareas. Crea la primera con el formulario.
                </ThemedText>
              )}

              {tareas.map((tarea) => (
                <TareaItem
                  key={tarea.id}
                  tarea={tarea}
                  ocupado={ocupado}
                  onEditar={setTareaEnEdicion}
                  onCambiarEstado={(id, estado) => void cambiarEstado(id, estado)}
                  onEliminar={(id) => void eliminar(id)}
                />
              ))}
            </ScrollView>
          </>
        )}
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    gap: Spacing.three,
  },
  titulo: {
    textAlign: 'center',
  },
  estadoAuth: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingVertical: Spacing.three,
    paddingHorizontal: Spacing.three,
  },
  textoEstado: {
    flexShrink: 1,
  },
  botonReintentar: {
    borderRadius: Spacing.two,
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    minHeight: 44,
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.8,
  },
  tituloListado: {
    marginTop: Spacing.half,
  },
  listado: {
    gap: Spacing.two,
    paddingBottom: Spacing.four,
  },
  estadoListado: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.two,
    paddingVertical: Spacing.four,
  },
});
