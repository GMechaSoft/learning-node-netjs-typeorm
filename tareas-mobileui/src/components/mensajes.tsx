import { StyleSheet } from 'react-native';

import { Spacing } from '@/constants/theme';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import type { MensajeUi } from '@/hooks/use-tareas';

const TONOS = {
  exito: { lightColor: '#E7F6E7', darkColor: '#12291A' },
  validacion: { lightColor: '#FFF4E0', darkColor: '#3A2E12' },
  error: { lightColor: '#FDE8E8', darkColor: '#3A1515' },
} as const;

/**
 * Zona única de feedback (éxito / validación / error genérico).
 * Adaptación móvil de `tareas-webui/src/components/mensajes.tsx`.
 */
export function Mensajes({ mensaje }: { mensaje: MensajeUi | null }) {
  if (!mensaje) return null;
  const tono = TONOS[mensaje.tipo];
  return (
    <ThemedView lightColor={tono.lightColor} darkColor={tono.darkColor} style={styles.banner}>
      <ThemedText type="small" style={styles.texto}>
        {mensaje.texto}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  texto: {
    textAlign: 'left',
  },
});
