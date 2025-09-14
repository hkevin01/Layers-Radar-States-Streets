# Docker Guide

Run the Weather Radar app entirely inside Docker containers.

## Start both services

```bash
docker compose up --build
```

- Frontend: <http://localhost:8089/index.html>
- Backend health: <http://localhost:8081/api/weather/health>

## Start via helper script

```bash
./run.sh docker-all
```

## Env vars

- FRONTEND_HOST_PORT (default 8089)
- BACKEND_HOST_PORT (default 8081)

## Stop

```bash
docker compose down
```
