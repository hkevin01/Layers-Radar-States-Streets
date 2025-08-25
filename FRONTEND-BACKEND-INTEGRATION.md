# Frontend ↔ Backend Integration

This project includes a Spring Boot backend (port 8081) and a static frontend. You can run the backend locally or in Docker and access it from the frontend.

## Backend in Docker

```bash
# Build and start backend container
docker compose build backend
docker compose up -d backend

# Verify health
curl -fsS http://localhost:8081/api/weather/health
```

To start frontend locally and use Dockerized backend:

```bash
./run.sh docker
open http://localhost:8089/index.html
```

## Local Backend

```bash
./run.sh backend   # starts Spring Boot via mvnw
./run.sh frontend  # starts static server on 8089
```

## Configuration

The frontend expects the backend at <http://localhost:8081> by default. If you introduce a dynamic runtime config, prefer an environment variable (`BACKEND_BASE_URL`) and propagate it to the frontend as needed.

## Health Endpoints

- API health: <http://localhost:8081/api/weather/health>
- Weather stations: <http://localhost:8081/api/weather/stations>

## Troubleshooting

- If port 8081 is in use, stop the conflicting process or change the mapping in docker-compose.yml.
- On first Docker build, Maven may download dependencies; subsequent builds will be faster due to caching.

