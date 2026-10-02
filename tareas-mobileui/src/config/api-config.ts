/**
 * URL base de la API, configurable por variable de entorno (AC9).
 * Expo inyecta `process.env.EXPO_PUBLIC_*` en el bundle en tiempo de build
 * (no hay `import.meta.env` como en Vite — la webui usa `VITE_API_BASE_URL`).
 * Default: `http://localhost:3000` (puerto por defecto de `tareas-webapi`).
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ?? 'http://localhost:3000';

/** Usuario fijo con el que la autenticación automática emite el token (HU #4). */
export const DEMO_USER = 'demo';
