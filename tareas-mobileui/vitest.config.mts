import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

/**
 * Stack de tests del demo móvil (HU #4): Vitest + jsdom + react-test-renderer.
 * React Testing Library no soporta React Native (SDK 57 / RN 0.86), así que los
 * tests de UI usan `react-test-renderer`; los de cliente y hooks son lógicos.
 */
export default defineConfig({
  resolve: {
    alias: {
      '@/': `${fileURLToPath(new URL('./src', import.meta.url))}/`,
      '@': `${fileURLToPath(new URL('./src', import.meta.url))}`,
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/app/**', 'src/components/animated-icon*'],
    },
  },
});
