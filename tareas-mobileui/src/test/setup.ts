import '@testing-library/jest-dom/vitest';

// Los tests de UI usan react-test-renderer (RTL no soporta RN 0.86/SDK 57):
// cada test desmonta su propio renderer (`renderer.unmount()`).
