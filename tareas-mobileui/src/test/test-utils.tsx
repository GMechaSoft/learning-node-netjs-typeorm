import { act, create, type ReactTestRenderer } from 'react-test-renderer';

/**
 * Helper mínimo para probar hooks con `react-test-renderer`
 * (React Testing Library no soporta React Native en SDK 57 / RN 0.86).
 * Devuelve el último valor retornado por el hook y un `unmount` limpio.
 * Tras `act` de montaje, `result.current` está garantizado no ser null.
 */
export async function renderHook<T>(hook: () => T) {
  const result: { current: T } = { current: undefined as T };
  const Test = (): null => {
    result.current = hook();
    return null;
  };
  const renderer: ReactTestRenderer = create(<Test />);
  // Da tiempo a los efectos de montaje (p. ej. la autenticación automática).
  await act(async () => {});
  return {
    result,
    unmount: () => act(() => renderer.unmount()),
  };
}

/** Construye una `Response` JSON para mockear `fetch` (jsdom tiene `Response`). */
export function respuestaJson(datos: unknown, status = 200): Response {
  return new Response(JSON.stringify(datos), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
