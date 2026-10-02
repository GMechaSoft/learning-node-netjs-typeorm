import { Pressable, StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { EstadoTarea, Tarea } from '@/types/tarea';

interface TareaItemProps {
  tarea: Tarea;
  ocupado: boolean;
  onEditar: (tarea: Tarea) => void;
  onCambiarEstado: (id: number, estado: EstadoTarea) => void;
  onEliminar: (id: number) => void;
}

/**
 * Tarjeta de una tarea (título + badge de estado, descripción en medio,
 * acciones abajo). Adaptación móvil de
 * `tareas-webui/src/components/tarea-item.tsx`.
 */
export function TareaItem({ tarea, ocupado, onEditar, onCambiarEstado, onEliminar }: TareaItemProps) {
  const completada = tarea.estado === 'completada';
  const estadoOtro: EstadoTarea = completada ? 'pendiente' : 'completada';

  return (
    <ThemedView type="backgroundElement" style={styles.tarjeta} testID={`tarea-item-${tarea.id}`}>
      <ThemedView style={styles.cabecera}>
        <ThemedText type="smallBold" numberOfLines={2} style={[styles.titulo, completada && styles.tituloCompletada]}>
          {tarea.titulo}
        </ThemedText>
        <ThemedView style={[styles.badge, completada ? styles.badgeCompletada : styles.badgePendiente]}>
          <ThemedText type="small" style={styles.badgeTexto}>
            {tarea.estado}
          </ThemedText>
        </ThemedView>
      </ThemedView>

      {tarea.descripcion ? (
        <ThemedText type="small" style={styles.descripcion} numberOfLines={3}>
          {tarea.descripcion}
        </ThemedText>
      ) : null}

      <ThemedView style={styles.acciones}>
        <Pressable
          testID={`tarea-${tarea.id}-editar`}
          accessibilityRole="button"
          disabled={ocupado}
          onPress={() => onEditar(tarea)}
          style={({ pressed }) => [styles.accion, pressed && styles.pressed]}>
          <ThemedText type="small">Editar</ThemedText>
        </Pressable>
        <Pressable
          testID={`tarea-${tarea.id}-estado`}
          accessibilityRole="button"
          disabled={ocupado}
          onPress={() => onCambiarEstado(tarea.id, estadoOtro)}
          style={({ pressed }) => [styles.accion, pressed && styles.pressed]}>
          <ThemedText type="small">{completada ? 'Marcar pendiente' : 'Marcar completada'}</ThemedText>
        </Pressable>
        <Pressable
          testID={`tarea-${tarea.id}-eliminar`}
          accessibilityRole="button"
          disabled={ocupado}
          onPress={() => onEliminar(tarea.id)}
          style={({ pressed }) => [styles.accion, pressed && styles.pressed]}>
          <ThemedText type="small" style={styles.eliminar}>
            Eliminar
          </ThemedText>
        </Pressable>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  tarjeta: {
    gap: Spacing.two,
    borderRadius: Spacing.three,
    padding: Spacing.three,
  },
  cabecera: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.two,
  },
  titulo: {
    flexShrink: 1,
  },
  tituloCompletada: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  descripcion: {
    opacity: 0.8,
  },
  badge: {
    borderRadius: Spacing.six,
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  badgePendiente: {
    backgroundColor: 'rgba(255, 193, 7, 0.18)',
  },
  badgeCompletada: {
    backgroundColor: 'rgba(38, 166, 91, 0.18)',
  },
  badgeTexto: {
    fontSize: 12,
  },
  acciones: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.two,
  },
  accion: {
    paddingVertical: Spacing.half,
    paddingHorizontal: Spacing.two,
  },
  eliminar: {
    color: '#C0392B',
  },
  pressed: {
    opacity: 0.7,
  },
});
