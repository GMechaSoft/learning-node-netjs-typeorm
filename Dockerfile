# =============================================================================
# Imagen demo (academica): Front (nginx :80) + Back (NestJS :8080) + PostgreSQL
# -----------------------------------------------------------------------------
# Build:    docker build -t tareas-demo .
# Run:      docker run -p 80:80 -p 8080:8080 tareas-demo
#   o bien: docker compose -f docker-compose.demo.yml up
# Puertos:  80   = Frontend (SPA React)
#           8080 = Backend (API NestJS + Swagger en /docs)
#           5432 = PostgreSQL  NO expuesto (solo localhost interno)
# Persistencia: efimera (sin volumen; se re-crea al recrear el contenedor)
# =============================================================================

# ---------------------------------------------------------------------------
# Stage 1: Build del Frontend (SPA React + Vite)
# ---------------------------------------------------------------------------
FROM node:22 AS ui-build
WORKDIR /app/ui
# Dependencias primero para aprovechar el caché de capas
COPY tareas-webui/package.json tareas-webui/package-lock.json ./
RUN npm ci
# Fuentes del proyecto
COPY tareas-webui/ ./
# URL base de la API (build-time): el navegador llama directo al back en :8080 (CORS)
ARG VITE_API_BASE_URL=http://localhost:8080
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 2: Build del Backend (NestJS)
# ---------------------------------------------------------------------------
FROM node:22 AS api-build
WORKDIR /app/api
COPY tareas-webapi/package.json tareas-webapi/package-lock.json ./
RUN npm ci
COPY tareas-webapi/ ./
RUN npm run build

# ---------------------------------------------------------------------------
# Stage 3: Runtime del Backend (solo dependencias de produccion)
# ---------------------------------------------------------------------------
FROM node:22 AS api-prod
WORKDIR /app/api
COPY tareas-webapi/package.json tareas-webapi/package-lock.json ./
RUN npm ci --omit=dev
COPY --from=api-build /app/api/dist ./dist

# ---------------------------------------------------------------------------
# Stage 4: Imagen final — PostgreSQL 16 + Node 22 + Nginx
# ---------------------------------------------------------------------------
FROM postgres:16

# Herramientas de runtime: nginx (front :80), curl (healthcheck) y la libreria
# C++ que necesita el binario de Node. `policy-rc.d` evita que nginx arranque
# durante el build (no hay init system en el contenedor).
RUN set -x && \
    echo 'exit 101' > /usr/sbin/policy-rc.d && \
    apt-get update && \
    apt-get install -y --no-install-recommends nginx curl ca-certificates libstdc++6 && \
    rm -f /usr/sbin/policy-rc.d && \
    rm -rf /var/lib/apt/lists/*

# Binario de Node 22 (mismo Debian bookworm que la base postgres:16 => compatible)
COPY --from=api-prod /usr/local/bin/node /usr/local/bin/node

# Frontend compilado -> sirvelo con nginx
COPY --from=ui-build /app/ui/dist /usr/share/nginx/html
# Backend compilado + node_modules de produccion
COPY --from=api-prod /app/api /opt/api
# Configuracion de nginx y entrypoint (supervisa postgres + API + nginx)
COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Variables de runtime (valores de demo). Sobrescribibles via compose/env_file.
ENV POSTGRES_USER=postgres \
    POSTGRES_PASSWORD=postgres \
    POSTGRES_DB=tareas_db \
    DB_HOST=localhost \
    DB_PORT=5432 \
    DB_USER=postgres \
    DB_PASSWORD=postgres \
    DB_NAME=tareas_db \
    DB_SYNCHRONIZE=true \
    JWT_SECRET=demo-secret-academica \
    JWT_EXPIRES_IN=7d \
    PORT=8080

# Front :80 y API :8080. NO se expone 5432 (PostgreSQL) al host.
EXPOSE 80 8080

HEALTHCHECK --interval=10s --timeout=3s --start-period=30s --retries=5 \
    CMD curl -fsS http://localhost:8080/docs > /dev/null || exit 1

ENTRYPOINT ["/entrypoint.sh"]
