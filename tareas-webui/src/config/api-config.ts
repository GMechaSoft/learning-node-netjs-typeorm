/** URL base de la API, configurable por variable de entorno (regla: URL base configurable). */
export const API_BASE_URL: string =
  import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000';
