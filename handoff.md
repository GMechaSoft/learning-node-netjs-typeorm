# 🚀 Development Handoff: Estándares de código del proyecto (workflow generar-estandares-codigo) — precondición de dev-rapido completada

**Date:** 2026-09-29 13:58  
**Repository Branch:** master

---

## 🎯 1. Objective
- Generar `docs/architecture/coding-standards.md` (estándares de código del proyecto NestJS/TypeORM) mediante el workflow `generar-estandares-codigo` del Método Ceiba, cumpliendo la precondición HALT que bloqueaba `/ceiba-dev-rapido` en la sesión anterior. Además, incorporar por solicitud explícita del usuario los estándares modernos de Node.js de programación asíncrona (`async/await` y Promesas) como sección obligatoria.

## 📊 2. Current Status
- **Status:** In Progress
- `coding-standards.md` creado, calibrado con la corrección del usuario (sección 5: Programación Asíncrona) y **ya committed** en `8ec4598` ("planificación", 13:48 — el usuario commiteó durante la sesión: incluye además `.gitignore`, el workspace, la HU #1 y el GPS de la sesión previa). Working tree limpio (verificado con `git status --short` y `git diff HEAD`, ambos vacíos). Queda pendiente el cierre formal del workflow: confirmación del usuario en `step-06-validate` y el step `step-06b-ai-context` (actualización del contexto IA del proyecto).

## 🗂️ 3. Files in Progress
- `docs/architecture/coding-standards.md` (creado en esta sesión; committed en `8ec4598`)
- `handoff.md` (sustituido por este snapshot)

## 🛠️ 4. Changes Made
- **`docs/architecture/coding-standards.md`** (workflow `generar-estandares-codigo`, modo inferencia por greenfield):
  - **Obligatorios**: nomenclatura (camelCase variables/funciones, PascalCase clases, kebab-case archivos, sufijo `Dto`); orden de imports (`reflect-metadata` primero en el punto de entrada; dominio antes que infraestructura); manejo de errores con excepciones HTTP semánticas de NestJS (404/401/400-422, alineado a los ACs de la HU #1) y `ValidationPipe` global con `whitelist: true`; restricciones de capas hexagonales con CQRS (dominio sin imports de framework, guard JWT en el borde, credenciales de PostgreSQL solo por variables de entorno, comandos ≠ queries).
  - **Sección 5 (solicitud del usuario): Programación Asíncrona** — `async/await` como patrón único (prohibido mezclar `.then()/.catch()` o callbacks); toda Promesa se consume (`await` o `void` explícito, sin Promesas huérfanas); sin I/O síncrono en la ruta de petición (solo `fs/promises`); errores de Promesas siempre manejados (try/catch en handler o filtro global, sin swallows); sin `setTimeout` como control de flujo. Con ejemplo correcto (handler con `await` + `NotFoundException`) y 4 anti-patrones.
  - **Testing**: no hay convención real (greenfield) → se adopta Jest (default del CLI NestJS) + Arrange-Act-Assert (3A) como convención declarada, con dobles de puertos del dominio.
  - **Herramientas**: ESLint + Prettier proyectados según default del CLI NestJS (`guia.md`), marcados para recalibrar contra los archivos reales al inicializar.
  - **UI/Design System**: N/A (API REST sin UI).
  - **Evolución**: `@nestjs/config`, migraciones TypeORM en vez de `synchronize: true`, Test Data Builders, testcontainers, SonarQube.
  - Nota de greenfield explícita: ejemplos son proyecciones sobre `guia.md` + GPS, a recalibrar contra el código real al cerrar la primera historia.
- **Verificación de repo**: la sesión anterior documentó todo el workspace como untracked; esta sesión encontró todo committed en `8ec4598` (commiteado por el usuario durante la sesión). El estado real de `git` se usó para este handoff.

## ⚠️ 5. Attempts and Failures
- **Intento:** primera llamada a `git status --short` para el inventario de archivos
  - *Result:* devolvió vacío (no error): todo estaba ya committed en `8ec4598` "planificación" (13:48), hecho durante la sesión. Workaround: reconstruir el inventario con `git show --name-only HEAD` / `HEAD~1` para distinguir lo de esta sesión (`coding-standards.md`) de lo de la sesión previa (`.gitignore`, `docs/`, workspace). Sin pérdida de datos.
- **Intento:** crear `handoff.md` con la herramienta de creación de archivos
  - *Result:* falló ("File already exists") porque `8ec4598` lo incluye; se resolvió sustituyendo el contenido completo con edición. Sin pérdida de datos.

## 🔮 6. Next Steps (Pending Tasks)
1. Confirmar `docs/architecture/coding-standards.md` (step-06 del workflow `generar-estandares-codigo`) y cerrar con `step-06b-ai-context` (actualización del contexto IA del proyecto).
2. Retomar `/ceiba-dev-rapido` para la HU #1 (`docs/stories/1-gestion-tareas-api/`): la precondición de documentación base ya quedó cumplida (GPS + `coding-standards.md` existen); el workflow arranca en `step-00-hu`.
3. Inicializar el proyecto NestJS (`nest new`) + dependencias (`typeorm pg class-validator class-transformer @nestjs/swagger @nestjs/jwt`) con `DataSource` por variables de entorno (corregir credenciales hardcoded de `guia.md`) — el primer código real servirá para recalibrar los ejemplos-proyección de `coding-standards.md`.
4. Crear la HU de autenticación JWT (registro/login) — precondición operativa de la HU #1; módulo auth marcado pendiente en el GPS.
5. Responder decisiones pendientes del GPS: `docker-compose` para PostgreSQL, librería JWT (`@nestjs/jwt`), migraciones vs `synchronize` en producción.
