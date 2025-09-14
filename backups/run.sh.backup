#!/usr/bin/env bash
set -euo pipefail

# Enhanced runner for Weather Radar app with Spring Boot backend
# Usage:
#   ./run.sh                 # same as: up (full stack)
#   ./run.sh up              # start full stack (frontend + backend)
#   ./run.sh frontend        # start only frontend
#   ./run.sh backend         # start only backend
#   ./run.sh dev             # start in development mode
#   ./run.sh down            # stop all services
#   ./run.sh restart         # restart all services
#   ./run.sh logs            # show logs
#   ./run.sh status          # show status
#   ./run.sh health          # check service health
#   ./run.sh open            # open browser
#   ./run.sh api             # test API endpoints

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

SERVICE_NAME="weather-radar"
BACKEND_PORT=8081
FRONTEND_PORT=8089
DEFAULT_PORT_START=8080
DEFAULT_PORT_END=8090

# PID files for process management
BACKEND_PID_FILE="$SCRIPT_DIR/.backend.pid"
FRONTEND_PID_FILE="$SCRIPT_DIR/.frontend.pid"

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

# Spring Boot backend management
start_backend() {
  if is_backend_running; then
    echo "Backend already running on port $BACKEND_PORT"
    return 0
  fi
  
  echo "Starting Spring Boot backend on port $BACKEND_PORT..."
  cd "$SCRIPT_DIR/spring-backend"
  
  if [[ ! -f "./mvnw" ]]; then
    echo "Maven wrapper not found. Generating..."
    mvn wrapper:wrapper || {
      echo "ERROR: Failed to generate Maven wrapper. Ensure Maven is installed."
      exit 1
    }
  fi
  
  nohup ./mvnw spring-boot:run > "$SCRIPT_DIR/backend.log" 2>&1 &
  echo $! > "$BACKEND_PID_FILE"
  cd "$SCRIPT_DIR"
  
  echo "Waiting for backend to start..."
  for i in {1..30}; do
    if is_backend_running; then
      echo "✅ Backend started successfully on port $BACKEND_PORT"
      return 0
    fi
    sleep 2
  done
  
  echo "❌ Backend failed to start within 60 seconds"
  return 1
}

stop_backend() {
  if [[ -f "$BACKEND_PID_FILE" ]]; then
    local pid=$(cat "$BACKEND_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping backend (PID: $pid)..."
      kill "$pid"
      rm -f "$BACKEND_PID_FILE"
    else
      rm -f "$BACKEND_PID_FILE"
    fi
  fi
  
  # Fallback: kill by port
  local backend_pid=$(lsof -ti :$BACKEND_PORT 2>/dev/null || true)
  if [[ -n "$backend_pid" ]]; then
    echo "Stopping backend process on port $BACKEND_PORT..."
    kill "$backend_pid" 2>/dev/null || true
  fi
}

is_backend_running() {
  if have_cmd curl; then
    curl -s "http://localhost:$BACKEND_PORT/actuator/health" >/dev/null 2>&1
  else
    is_port_in_use "$BACKEND_PORT"
  fi
}

# Frontend management
start_frontend() {
  if is_frontend_running; then
    echo "Frontend already running on port $FRONTEND_PORT"
    return 0
  fi
  
  echo "Starting frontend server on port $FRONTEND_PORT..."
  cd "$SCRIPT_DIR"
  
  nohup python3 -m http.server "$FRONTEND_PORT" --directory public > "$SCRIPT_DIR/frontend.log" 2>&1 &
  echo $! > "$FRONTEND_PID_FILE"
  
  echo "Waiting for frontend to start..."
  for i in {1..10}; do
    if is_frontend_running; then
      echo "✅ Frontend started successfully on port $FRONTEND_PORT"
      return 0
    fi
    sleep 1
  done
  
  echo "❌ Frontend failed to start within 10 seconds"
  return 1
}

stop_frontend() {
  if [[ -f "$FRONTEND_PID_FILE" ]]; then
    local pid=$(cat "$FRONTEND_PID_FILE")
    if kill -0 "$pid" 2>/dev/null; then
      echo "Stopping frontend (PID: $pid)..."
      kill "$pid"
      rm -f "$FRONTEND_PID_FILE"
    else
      rm -f "$FRONTEND_PID_FILE"
    fi
  fi
  
  # Fallback: kill by port
  local frontend_pid=$(lsof -ti :$FRONTEND_PORT 2>/dev/null || true)
  if [[ -n "$frontend_pid" ]]; then
    echo "Stopping frontend process on port $FRONTEND_PORT..."
    kill "$frontend_pid" 2>/dev/null || true
  fi
}

is_frontend_running() {
  is_port_in_use "$FRONTEND_PORT"
}

# Service health checks
check_health() {
  echo "🔍 Checking service health..."
  echo
  
  # Backend health
  if is_backend_running; then
    echo "✅ Backend: Running on port $BACKEND_PORT"
    if have_cmd curl; then
      local health=$(curl -s "http://localhost:$BACKEND_PORT/actuator/health" 2>/dev/null || echo "ERROR")
      if [[ "$health" == *"UP"* ]]; then
        echo "   Status: Healthy"
      else
        echo "   Status: Unhealthy"
      fi
    fi
  else
    echo "❌ Backend: Not running"
  fi
  
  # Frontend health
  if is_frontend_running; then
    echo "✅ Frontend: Running on port $FRONTEND_PORT"
  else
    echo "❌ Frontend: Not running"
  fi
  
  echo
  echo "🌐 Service URLs:"
  if is_frontend_running; then
    echo "   • Demo: http://localhost:$FRONTEND_PORT/demo.html"
    echo "   • Test: http://localhost:$FRONTEND_PORT/airport-weather-test.html"
    echo "   • Main: http://localhost:$FRONTEND_PORT/index.html"
  fi
  if is_backend_running; then
    echo "   • API Health: http://localhost:$BACKEND_PORT/api/weather/health"
    echo "   • Weather Data: http://localhost:$BACKEND_PORT/api/weather/stations"
  fi
}

CMD="${1:-up}"
shift || true

DC=$(compose_cmd)

case "$CMD" in
  up|start)
    echo "🚀 Starting full stack (backend + frontend)..."
    start_backend
    start_frontend
    echo
    check_health
    ;;

  frontend)
    echo "🌐 Starting frontend only..."
    start_frontend
    echo "Frontend URLs:"
    echo "  • Demo: http://localhost:$FRONTEND_PORT/demo.html"
    echo "  • Test: http://localhost:$FRONTEND_PORT/airport-weather-test.html"
    ;;

  backend)
    echo "⚙️ Starting backend only..."
    start_backend
    echo "Backend URLs:"
    echo "  • Health: http://localhost:$BACKEND_PORT/api/weather/health"
    echo "  • Weather: http://localhost:$BACKEND_PORT/api/weather/stations"
    ;;

  down|stop)
    echo "🛑 Stopping all services..."
    stop_backend
    stop_frontend
    # Also stop Docker Compose if it exists
    if [[ -f "docker-compose.yml" ]]; then
      $DC down -v 2>/dev/null || true
    fi
    echo "All services stopped"
    ;;

  restart)
    echo "🔄 Restarting all services..."
    stop_backend
    stop_frontend
    start_backend
    start_frontend
    check_health
    ;;

  status|ps)
    echo "📊 Service Status:"
    echo
    
    # Process status
    if [[ -f "$BACKEND_PID_FILE" ]]; then
      local backend_pid=$(cat "$BACKEND_PID_FILE")
      if kill -0 "$backend_pid" 2>/dev/null; then
        echo "Backend: Running (PID: $backend_pid)"
      else
        echo "Backend: Stopped (stale PID file)"
      fi
    else
      echo "Backend: Stopped"
    fi
    
    if [[ -f "$FRONTEND_PID_FILE" ]]; then
      local frontend_pid=$(cat "$FRONTEND_PID_FILE")
      if kill -0 "$frontend_pid" 2>/dev/null; then
        echo "Frontend: Running (PID: $frontend_pid)"
      else
        echo "Frontend: Stopped (stale PID file)"
      fi
    else
      echo "Frontend: Stopped"
    fi
    
    # Port status
    echo
    echo "Port Status:"
    if is_port_in_use "$BACKEND_PORT"; then
      echo "  Port $BACKEND_PORT (Backend): In use"
    else
      echo "  Port $BACKEND_PORT (Backend): Available"
    fi
    
    if is_port_in_use "$FRONTEND_PORT"; then
      echo "  Port $FRONTEND_PORT (Frontend): In use"
    else
      echo "  Port $FRONTEND_PORT (Frontend): Available"
    fi
    
    # Docker status if available
    if [[ -f "docker-compose.yml" ]]; then
      echo
      echo "Docker Services:"
      $DC ps 2>/dev/null || echo "  No Docker services running"
    fi
    ;;

  health)
    check_health
    ;;

  *)
    echo "❌ Unknown command: $CMD" >&2
    echo
    echo "Usage: $0 [COMMAND]" >&2
    echo
    echo "Commands:" >&2
    echo "  up, start     Start full stack (backend + frontend)" >&2
    echo "  frontend      Start only frontend server" >&2
    echo "  backend       Start only backend server" >&2
    echo "  down, stop    Stop all services" >&2
    echo "  restart       Restart all services" >&2
    echo "  status, ps    Show service status" >&2
    echo "  health        Check service health" >&2
    echo
    echo "Examples:" >&2
    echo "  ./run.sh                    # Start everything" >&2
    echo "  ./run.sh frontend           # Start only frontend" >&2
    echo "  ./run.sh backend           # Start only backend" >&2
    echo "  ./run.sh health            # Check if services are healthy" >&2
    exit 1
    ;;
esac
