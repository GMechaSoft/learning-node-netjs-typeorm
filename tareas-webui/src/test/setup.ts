import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

// Aísla cada caso: limpiar el DOM y el estado de localStorage entre tests.
afterEach(() => {
  cleanup();
  window.localStorage.clear();
});
