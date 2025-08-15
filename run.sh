#!/usr/bin/env bash
set -euo pipefail

# Simple runner for the Weather Radar app via Docker Compose
# Usage:
#   ./run.sh                 # same as: up
#   ./run.sh up              # build and start on a free HOST_PORT (or use env HOST_PORT)
#   ./run.sh down            # stop and remove
#   ./run.sh restart         # down then up
#   ./run.sh logs            # follow logs
#   ./run.sh status          # show status
#   ./run.sh open            # open browser to the app

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SERVICE_NAME="weather-radar"
DEFAULT_PORT_START=8080
DEFAULT_PORT_END=8090

have_cmd() { command -v "$1" >/dev/null 2>&1; }

compose_cmd() {
  if have_cmd docker && docker compose version >/dev/null 2>&1; then
    echo "docker compose"
  elif have_cmd docker-compose; then
    echo "docker-compose"
  else
    echo "ERROR: Docker Compose not found (need docker compose or docker-compose)" >&2
    exit 1
  fi
}

is_port_in_use() {
  local port="$1"
  if have_cmd ss; then
    ss -ltn 2>/dev/null | awk '{print $4}' | grep -q ":$port$" && return 0 || true
  fi
  if have_cmd lsof; then
    lsof -i TCP:"$port" -sTCP:LISTEN >/dev/null 2>&1 && return 0 || true
  fi
  return 1
}

find_free_port() {
  local start="${1:-$DEFAULT_PORT_START}" end="${2:-$DEFAULT_PORT_END}" p
  for ((p=start; p<=end; p++)); do
    if ! is_port_in_use "$p"; then
      echo "$p"
      return 0
    fi
  done
  return 1
}

ensure_host_port() {
  if [[ -n "${HOST_PORT:-}" ]]; then
    echo "$HOST_PORT"
    return 0
  fi
  local free
  if free=$(find_free_port "$DEFAULT_PORT_START" "$DEFAULT_PORT_END"); then
    export HOST_PORT="$free"
    echo "$HOST_PORT"
    return 0
  fi
  echo "ERROR: No free port found between $DEFAULT_PORT_START-$DEFAULT_PORT_END" >&2
  exit 1
}

open_browser() {
  local url="$1"
  if have_cmd xdg-open; then xdg-open "$url" >/dev/null 2>&1 || true; fi
}

CMD="${1:-up}"
shift || true

DC=$(compose_cmd)

case "$CMD" in
  up|start)
    PORT=$(ensure_host_port)
    echo "Using HOST_PORT=$PORT"
    HOST_PORT="$PORT" $DC up -d --build
    echo "\nApp URLs:"
    echo "  • http://localhost:$PORT/public/weather-radar.html"
    echo "  • http://localhost:$PORT/public/radar-diagnostics.html"
    ;;

  down|stop)
    $DC down -v
    ;;

  restart)
    $DC down -v
    PORT=$(ensure_host_port)
    echo "Using HOST_PORT=$PORT"
    HOST_PORT="$PORT" $DC up -d --build
    ;;

  logs)
    $DC logs -f --tail=200
    ;;

  status|ps)
    $DC ps
    ;;

  open)
    PORT=$(ensure_host_port)
    echo "Opening http://localhost:$PORT/public/weather-radar.html"
    open_browser "http://localhost:$PORT/public/weather-radar.html"
    ;;

  *)
    echo "Unknown command: $CMD" >&2
    echo "Usage: $0 [up|down|restart|logs|status|open]" >&2
    exit 1
    ;;
 esac
