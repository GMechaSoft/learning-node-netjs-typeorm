#!/bin/bash
# Supervisa los 3 procesos de la imagen demo (academica):
#   1) PostgreSQL 16  (efimero, solo localhost, NO expuesto al host)
#   2) API NestJS     (puerto 8080)
#   3) Nginx          (puerto 80; en foreground, mantiene vivo el contenedor)
#
# Limitacion de demo: es un supervisor simple (no un init system tipo tini).
# Adecuado para una demostracion, no para produccion.

PGDATA_DIR="${PGDATA:-/var/lib/postgresql/data}"

echo "[entrypoint] Iniciando PostgreSQL (data: ${PGDATA_DIR})..."
# El entrypoint oficial de postgres:16 (vive en /usr/local/bin) hace initdb
# (si la data esta vacia) usando POSTGRES_USER / POSTGRES_PASSWORD /
# POSTGRES_DB, y arranca postgres.
/usr/local/bin/docker-entrypoint.sh postgres &
PG_PID=$!

echo "[entrypoint] Esperando a que PostgreSQL acepte conexiones en localhost:${DB_PORT:-5432}..."
READY=0
for i in $(seq 1 60); do
    if pg_isready -h localhost -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" >/dev/null 2>&1; then
        READY=1
        echo "[entrypoint] PostgreSQL listo (intento ${i})."
        break
    fi
    sleep 1
done

if [ "$READY" -ne 1 ]; then
    echo "[entrypoint][WARN] PostgreSQL no respondio a tiempo; la API puede fallar al conectar."
fi

echo "[entrypoint] Iniciando API NestJS en el puerto ${PORT:-8080}..."
cd /opt/api
PORT="${PORT:-8080}" node dist/main.js &
API_PID=$!

echo "[entrypoint] Iniciando Nginx en el puerto 80 (foreground)..."
# nginx en foreground = proceso principal: mantiene vivo el contenedor.
exec nginx -g 'daemon off;'
