#!/usr/bin/env bash
set -euo pipefail

DC="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  DC="docker-compose"
fi

$DC build backend
$DC up -d backend

echo "Waiting for backend health..."
for i in {1..40}; do
  if curl -fsS http://localhost:8081/api/weather/health >/dev/null 2>&1; then
    echo "✅ Backend is healthy"
    exit 0
  fi
  sleep 3
done

echo "❌ Backend failed to become healthy in time" >&2
exit 1
