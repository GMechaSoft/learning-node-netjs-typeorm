/**
 * Tipados mínimos para imports de CSS en el bundle web/Expo.
 * `expo-env.d.ts` (gitignored) solo existe tras ejecutar `expo start`;
 * este archivo mantiene `npx tsc --noEmit` verde en clonos frescos.
 */
declare module '*.module.css' {
  const classes: Record<string, string>;
  export default classes;
}

declare module '*.css';
