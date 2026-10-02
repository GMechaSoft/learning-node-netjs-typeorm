# Registro de Cambios — Historia #3

| Fecha | Fase | Descripción | Autor |
|-------|------|-------------|-------|
| 2026-10-01 | Creación | Historia creada via Dev-Rápido | Gerson Sanchez |
| 2026-10-01 | Creación | Casos de prueba generados (qa.md, 10 casos) | Gerson Sanchez |
| 2026-10-01 | Creación | Tracker resuelto: ninguna (desarrollo directo) | Gerson Sanchez |
| 2026-10-01 | Plan | Refinamiento técnico creado (12 tareas, 6 fases) | Gerson Sanchez |
| 2026-10-01 | Implementación | Creados artefactos del empaquetado: Dockerfile, .dockerignore, docker/{nginx.conf,entrypoint.sh,.env}, docker-compose.demo.yml, docker/README.md (T1-T6, T12) | Gerson Sanchez |
| 2026-10-01 | Tests | Verificaciones contra el contenedor vivo: 10/10 casos QA (QA-01..QA-10). Correcciones: (1) front `use-usuario.test.ts` importaba `afterEach` de `vitest` (bug latente TS2304); (2) entrypoint.sh → `/usr/local/bin/docker-entrypoint.sh` (ruta real de postgres:16) | Gerson Sanchez |
| 2026-10-02 | Dev-Rápido | ⚡ Implementado: empaquetado front + back + BD en una única imagen Docker de demostración (UI :80, API :8080, PostgreSQL 16 embebida y efímera no expuesta); 10/10 QA verificados; suite front 50/50 | Gerson Sanchez |
| 2026-10-02 | Medición | Intento HALT `PENDING_STRATEGY/STRATEGY_NOT_APPROVED` al cierre (guard de vigencia): no existe `measurement-strategy.json` aprobada — medición COSMIC/PNF pendiente de `/ceiba-generar-strategy` | Gerson Sanchez |
