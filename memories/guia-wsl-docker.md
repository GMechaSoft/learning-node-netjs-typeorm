# Guía: WSL (Ubuntu) para Docker — hallazgos y puesta en marcha

> Memoria del proyecto (carpeta `memories/` del repo).
> Preferencia explícita del usuario (2026-09-30): **usar el Docker del WSL Ubuntu, NO Rancher Desktop**, para toda la infraestructura del proyecto (Postgres, etc.).

## Estado del sistema (verificado 2026-09-30)
- `wsl -l -v` → distribuciones: **Ubuntu** (Running, v2, default `*`), `rancher-desktop` (Stopped), `rancher-desktop-data` (Stopped).
- Daemon Docker dentro de Ubuntu: **activo sin arrancarlo** (server 29.6.1) — corre como servicio; no necesita arranque manual salvo que WSL esté parado.
- Verificar antes de usar: `wsl -d Ubuntu -- docker info --format 'server={{.ServerVersion}}'` (si falla: `wsl -d Ubuntu -- sudo service docker start` o `wsl -d Ubuntu` a mano).
- WSL comparte red con el host: los puertos 127.0.0.1 de contenedores WSL son alcanzables desde Windows (Node en `D:\` conectó a `localhost:5432` sin problemas).

## Mapa de rutas
- Windows `D:\workspace\learning\learning-node-netjs-typeorm` ↔ WSL `/mnt/d/workspace/learning/learning-node-netjs-typeorm`.
- Comandos compose siempre desde el directorio del `docker-compose.yml` (vía `/mnt/d/...`); el volumen `tareas-webapi_tareas_pgdata` vive en el almacenamiento de WSL, no en Windows.

## Patrón de comando (PowerShell → WSL)
```
wsl -d Ubuntu -- bash -lc "cd /mnt/d/workspace/learning/learning-node-netjs-typeorm/tareas-webapi && docker compose up -d"
```
- Bajar a Postgres: mismo comando con `docker compose down` (agregar `-v` para borrar el volumen/datos).
- Estado: `docker compose ps --format '{{.Name}} {{.Status}}'` (ojo: dentro de bash, ver trampa de comillas).

## ⚠️ Trampa crítica: comillas PowerShell
- Con **comillas dobles** PowerShell expande ANTES de pasar a bash: `$(seq 1 30)`, `${...}`, `{{...}}` y `2>/dev/null` se corrompen (fallas reales observadas: `seq` interpretado como cmdlet de PS, `D:\dev\null`, formato Go-template roto).
- **Solución: comillas simples** para el comando bash cuando contenga `$`, `{{}}` o redirects:
  ```
  wsl -d Ubuntu -- bash -lc 'for i in {1..30}; do s=$(docker inspect --format "{{.State.Health.Status}}" tareas-postgres); [ "$s" = healthy ] && break; sleep 2; done'
  ```
- Con comillas simples, `{{.State.Health.Status}}` funciona bien; la única falla observada fue con dobles.
- Regla práctica: **siempre comillas simples** para el bash, salvo que el comando necesite variables de PowerShell (casi nunca).

## Esperar a Postgres healthy
- El healthcheck tarda ~5-10s tras el arranque; el primer `inspect` puede devolver status vacío.
- Pattern: bucle bash (comillas simples) consultando `{{.State.Health.Status}}` hasta `healthy`, o directamente `docker ps` y leer `(healthy)` en el Status.
- En esta sesión: healthy en <60s (primera vez: pull de postgres:16 ~37s).

## Checklist de puesta en marcha (API de tareas)
1. `wsl -d Ubuntu -- bash -lc "cd /mnt/d/.../tareas-webapi && docker compose up -d"` (Postgres healthy en :5432).
2. En Windows (PowerShell, cwd `tareas-webapi/`): `npm run start:dev` → API en `:3000` (Swagger `/docs`, prefix `/api`).
3. Sonda rápida de API: `Invoke-WebRequest http://localhost:3000/api/tareas` → 401 = up (guard JWT activo).
4. Pruebas: `http/tareas-api.http` (REST Client), `node smoke-hu1.js` (14/14).
5. Cierre: `wsl -d Ubuntu -- bash -lc "cd /mnt/d/.../tareas-webapi && docker compose down"` + matar la terminal de `start:dev`.

## Notas de entorno
- Rancher Desktop sigue instalado (`C:\Program Files\Rancher Desktop\Rancher Desktop.exe`) pero **no se debe usar** — sus distros permanecen Stopped.
- El puerto 5432 de WSL puede colisionar si otro contenedor (p.ej. Rancher u otro compose) ya lo ocupa; verificar con `docker ps` antes.
- En esta máquina también corren en WSL: `faster-whisper-server` y `sqlserver_local` (no tocar).
