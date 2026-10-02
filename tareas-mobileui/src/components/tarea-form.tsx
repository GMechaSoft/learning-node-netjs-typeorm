import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, TextInput } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';
import type { CrearTareaDto, Tarea } from '@/types/tarea';

interface TareaFormProps {
  /** Tarea en edición (modo actualizar); `null` → modo crear. */
  tareaEnEdicion: Tarea | null;
  /** `true` mientras hay una acción en vuelo (botón enviar deshabilitado). */
  ocupado: boolean;
  onCrear: (dto: CrearTareaDto) => void;
  onActualizar: (id: number, titulo: string, descripcion?: string) => void;
  onCancelar: () => void;
}

const INPUT_STYLE = (theme: Record<string, string>) => ({
  color: theme.text,
  backgroundColor: theme.backgroundElement,
  borderRadius: Spacing.two,
  paddingHorizontal: Spacing.three,
  paddingVertical: Spacing.two,
  fontSize: 16,
  minHeight: 44,
  textAlignVertical: 'center' as const,
});

/**
 * Formulario de tarea con modo crear y modo actualizar (AC3/AC4/AC7).
 * Valida el título en el cliente (vacío o solo espacios) ANTES de llamar a la
 * API: si no pasa, no dispara `onCrear`/`onActualizar` y muestra el mensaje
 * local. Adaptación móvil de `tareas-webui/src/components/tarea-form.tsx`.
 */
export function TareaForm({ tareaEnEdicion, ocupado, onCrear, onActualizar, onCancelar }: TareaFormProps) {
  const theme = useTheme();
  const [titulo, setTitulo] = useState(tareaEnEdicion?.titulo ?? '');
  const [descripcion, setDescripcion] = useState(tareaEnEdicion?.descripcion ?? '');
  const [tituloInvalido, setTituloInvalido] = useState(false);

  const esEdicion = tareaEnEdicion !== null;

  const limpiar = () => {
    setTitulo('');
    setDescripcion('');
    setTituloInvalido(false);
  };

  const enviar = () => {
    if (ocupado) return;
    if (titulo.trim().length === 0) {
      setTituloInvalido(true);
      return;
    }
    setTituloInvalido(false);
    if (esEdicion) {
      onActualizar(tareaEnEdicion.id, titulo, descripcion.trim() === '' ? undefined : descripcion.trim());
    } else {
      onCrear({ titulo, ...(descripcion.trim() === '' ? {} : { descripcion: descripcion.trim() }) });
    }
    limpiar();
  };

  return (
    <ThemedView type="backgroundElement" style={styles.contenedor}>
      <ThemedText type="smallBold" style={styles.titulo}>
        {esEdicion ? 'Editar tarea' : 'Nueva tarea'}
      </ThemedText>

      <TextInput
        testID="tarea-form-titulo"
        value={titulo}
        onChangeText={(texto) => {
          setTitulo(texto);
          if (texto.trim().length > 0) setTituloInvalido(false);
        }}
        placeholder="Título (obligatorio)"
        placeholderTextColor={theme.textSecondary}
        style={INPUT_STYLE(theme)}
      />
      {tituloInvalido && (
        <ThemedText type="small" style={styles.alerta}>
          El título es obligatorio.
        </ThemedText>
      )}

      <TextInput
        testID="tarea-form-descripcion"
        value={descripcion}
        onChangeText={setDescripcion}
        placeholder="Descripción (opcional)"
        placeholderTextColor={theme.textSecondary}
        multiline
        style={[INPUT_STYLE(theme), styles.descripcion]}
      />

      <ThemedView style={styles.botonera}>
        <Pressable
          testID="tarea-form-enviar"
          accessibilityRole="button"
          accessibilityState={{ disabled: ocupado }}
          disabled={ocupado}
          onPress={enviar}
          style={({ pressed }) => [styles.enviar, { backgroundColor: theme.backgroundSelected }, pressed && styles.pressed, ocupado && styles.deshabilitado]}>
          {ocupado ? <ActivityIndicator size="small" color={theme.text} /> : <ThemedText type="smallBold">Enviar</ThemedText>}
        </Pressable>
        {esEdicion && (
          <Pressable
            testID="tarea-form-cancelar"
            accessibilityRole="button"
            disabled={ocupado}
            onPress={() => {
              limpiar();
              onCancelar();
            }}
            style={({ pressed }) => [styles.cancelar, pressed && styles.pressed]}>
            <ThemedText type="smallBold">Cancelar</ThemedText>
          </Pressable>
        )}
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  contenedor: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  titulo: {
    marginBottom: Spacing.half,
  },
  alerta: {
    color: '#C0392B',
  },
  descripcion: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  botonera: {
    flexDirection: 'row',
    gap: Spacing.two,
    marginTop: Spacing.half,
  },
  enviar: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    borderRadius: Spacing.two,
    minHeight: 44,
  },
  cancelar: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.two,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.two,
    minHeight: 44,
  },
  pressed: {
    opacity: 0.8,
  },
  deshabilitado: {
    opacity: 0.6,
  },
});
