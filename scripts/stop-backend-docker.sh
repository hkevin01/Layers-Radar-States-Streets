#!/usr/bin/env bash
set -euo pipefail

DC="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  DC="docker-compose"
fi

$DC stop backend || true
