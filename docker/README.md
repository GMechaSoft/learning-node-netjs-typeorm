# 📦 Imagen Docker Demo — Front + Back + Base de Datos

Empaquetado **único** del sistema de gestión de tareas para **demostración académica**:
front (React/Vite), back (NestJS/TypeORM) y PostgreSQL en **una sola imagen**.

| Componente | Puerto | Exposto al host |
|------------|--------|-----------------|
| Frontend (nginx) | **80** | ✅ sí |
| Backend (API NestJS) | **8080** | ✅ sí (Swagger en `/docs`) |
| PostgreSQL 16 | 5432 | ❌ **no** (solo `localhost` interno) |

- **Conexión front→back:** el front se compila con `VITE_API_BASE_URL=http://localhost:8080`
  y llama directo al back (CORS ya habilitado en la API).
- **Persistencia:** **efímera** — sin volumen. La BD se crea en el arranque y se pierde
  al eliminar el contenedor.

## Archivos

- `Dockerfile` (raíz) — build multi-stage: `ui-build` → `api-build` → `api-prod` → runtime (`postgres:16` + `node:22` + `nginx`).
- `.dockerignore` (raíz) — controla el contexto de build (excluye `node_modules`, `dist`, `.env`, docs).
- `docker/entrypoint.sh` — levanta PostgreSQL → espera `pg_isready` → API (background, :8080) → Nginx (foreground, :80).
- `docker/nginx.conf` — servidor :80 del front con fallback de SPA.
- `docker/.env` — credenciales de demo (BD + JWT + puerto).
- `docker-compose.demo.yml` (raíz) — arranque de 1 comando.

## Cómo arrancar

Requiere Docker (en este proyecto se usa el daemon de **WSL Ubuntu** — ver `memories/guia-wsl-docker.md`).

```bash
# Opción A — compose (recomendado):
docker compose -f docker-compose.demo.yml up

# Opción B — build + run manual:
docker build -t tareas-demo .
docker run -p 80:80 -p 8080:8080 tareas-demo
```

### URLs

- **Frontend:** `http://localhost` (puerto 80)
- **API (Swagger):** `http://localhost:8080/docs`

### Obtener un token para la UI

La UI pide un token JWT. Genéralo contra la API de la demo:

```bash
curl -X POST http://localhost:8080/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{"usuario":"demo"}'
```

Copia el valor de `token` y pégalo en el campo de autenticación de la UI.

## Verificación rápida

```bash
# Front sirve la SPA (200, HTML de la app)
curl -sI http://localhost/ | head -n 1

# API protegida sin token (401)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/api/tareas

# Swagger (200)
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:8080/docs

# Puertos publicados: SOLO 80 y 8080 (5432 NO aparece)
docker port tareas-demo
```

## Limitaciones (demo)

- **BD efímera:** no hay volumen; los datos no sobreviven a `docker rm`.
- **Supervisor simple:** el `entrypoint.sh` no es un init system (tini/dumb-init);
  adecuado para una demo, no para producción.
- **Credenciales de demo:** `docker/.env` trae valores fijos solo para demostración.
