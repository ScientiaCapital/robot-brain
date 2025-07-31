#!/bin/bash
# Helper script for running the robot project

DOCKER="/Applications/Docker.app/Contents/Resources/bin/docker"
DOCKER_COMPOSE="/Applications/Docker.app/Contents/Resources/bin/docker compose"

case "$1" in
  start)
    echo "🚀 Starting Robot Brain Project..."
    $DOCKER_COMPOSE up -d
    echo "✅ Services starting up. Check status with: ./run.sh status"
    ;;
  stop)
    echo "🛑 Stopping Robot Brain Project..."
    $DOCKER_COMPOSE down
    ;;
  status)
    echo "📊 Robot Brain Status:"
    $DOCKER_COMPOSE ps
    ;;
  logs)
    $DOCKER_COMPOSE logs -f ${2:-}
    ;;
  rebuild)
    echo "🔨 Rebuilding Robot Brain containers..."
    $DOCKER_COMPOSE build --no-cache
    ;;
  shell)
    SERVICE=${2:-robot-api}
    echo "🐚 Opening shell in $SERVICE..."
    $DOCKER exec -it $SERVICE /bin/bash
    ;;
  test)
    echo "🧪 Testing Robot Brain API..."
    curl -s http://localhost:8000/ | python3 -m json.tool
    ;;
  *)
    echo "Robot Brain Project Helper"
    echo "Usage: ./run.sh {start|stop|status|logs|rebuild|shell|test}"
    echo ""
    echo "  start   - Start all services"
    echo "  stop    - Stop all services"
    echo "  status  - Show service status"
    echo "  logs    - Follow logs (optionally specify service)"
    echo "  rebuild - Rebuild containers"
    echo "  shell   - Open shell in container"
    echo "  test    - Test API endpoint"
    ;;
esac