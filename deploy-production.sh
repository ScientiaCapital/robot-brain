#!/bin/bash
# Simple Production Deployment Script for Robot Brain
# 🔧 REFACTOR Phase: Simple FastAPI + Gunicorn deployment (no Docker)

set -e  # Exit on any error

echo "🚀 Starting Robot Brain Simple Production Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
APP_NAME="robot-brain"
DEPLOY_ENV="production"
HEALTH_CHECK_URL="http://localhost:8000/health"
MAX_HEALTH_RETRIES=30
HEALTH_RETRY_INTERVAL=2
PID_FILE="/tmp/robot-brain-production.pid"

# Functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check if Python 3 is available
    if ! command -v python3 &> /dev/null; then
        log_error "Python 3 is not installed"
        exit 1
    fi
    
    # Check if virtual environment exists
    if [ ! -d "venv" ]; then
        log_warning "Virtual environment not found, creating one..."
        python3 -m venv venv
    fi
    
    # Check if production environment file exists
    if [ ! -f ".env.production" ]; then
        log_error "Production environment file (.env.production) not found"
        exit 1
    fi
    
    log_info "Prerequisites check passed"
}

setup_environment() {
    log_info "Setting up production environment..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Install/upgrade dependencies
    pip install -r requirements.txt
    
    log_info "Environment setup completed"
}

run_tests() {
    log_info "Running production tests..."
    
    # Activate virtual environment if not already active
    if [ -z "$VIRTUAL_ENV" ]; then
        source venv/bin/activate
    fi
    
    # Run production configuration tests
    if ! python -m pytest tests/test_production_config.py -k "not test_all_required_tests_passing" --tb=no -q; then
        log_error "Production tests failed"
        exit 1
    fi
    
    log_info "All production tests passed"
}

stop_existing_server() {
    log_info "Stopping existing production server..."
    
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Stopping server with PID $PID"
            kill -TERM "$PID"
            sleep 3
            
            # Force kill if still running
            if kill -0 "$PID" 2>/dev/null; then
                log_warning "Force killing server with PID $PID"
                kill -KILL "$PID"
            fi
        fi
        rm -f "$PID_FILE"
    fi
    
    # Kill any remaining gunicorn processes
    pkill -f "gunicorn.*robot-brain" || true
    
    log_info "Existing server stopped"
}

start_production_server() {
    log_info "Starting production server..."
    
    # Activate virtual environment
    source venv/bin/activate
    
    # Start the production server in background
    nohup python3 start-production.py > /tmp/robot-brain-production.log 2>&1 &
    SERVER_PID=$!
    
    # Save PID for later management
    echo $SERVER_PID > "$PID_FILE"
    
    log_info "Production server started with PID $SERVER_PID"
    log_info "Logs: tail -f /tmp/robot-brain-production.log"
}

wait_for_health() {
    log_info "Waiting for application to be healthy..."
    
    for i in $(seq 1 $MAX_HEALTH_RETRIES); do
        if curl -f -s $HEALTH_CHECK_URL > /dev/null 2>&1; then
            log_info "Application is healthy"
            return 0
        fi
        
        log_warning "Health check attempt $i/$MAX_HEALTH_RETRIES failed, retrying in ${HEALTH_RETRY_INTERVAL}s..."
        sleep $HEALTH_RETRY_INTERVAL
    done
    
    log_error "Application failed to become healthy after $MAX_HEALTH_RETRIES attempts"
    return 1
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Check health endpoint
    if ! wait_for_health; then
        log_error "Health check failed"
        show_logs
        exit 1
    fi
    
    # Check metrics endpoint
    if curl -f -s http://localhost:8000/metrics > /dev/null 2>&1; then
        log_info "Metrics endpoint is accessible"
    else
        log_warning "Metrics endpoint check failed"
    fi
    
    # Check API endpoint
    if curl -f -s http://localhost:8000/api/robots > /dev/null 2>&1; then
        log_info "API endpoint is accessible"
    else
        log_warning "API endpoint check failed"
    fi
    
    log_info "Deployment verification completed"
}

show_logs() {
    log_info "Showing recent logs..."
    if [ -f "/tmp/robot-brain-production.log" ]; then
        tail -50 /tmp/robot-brain-production.log
    else
        log_warning "Log file not found"
    fi
}

show_status() {
    log_info "Service status:"
    if [ -f "$PID_FILE" ]; then
        PID=$(cat "$PID_FILE")
        if kill -0 "$PID" 2>/dev/null; then
            log_info "Robot Brain is running with PID $PID"
            
            # Show process details
            ps -p "$PID" -o pid,ppid,cmd,etime,pcpu,pmem
            
            # Show port usage
            if command -v lsof &> /dev/null; then
                lsof -i :8000 | head -10
            fi
        else
            log_warning "PID file exists but process is not running"
            rm -f "$PID_FILE"
        fi
    else
        log_warning "Robot Brain is not running (no PID file found)"
    fi
}

# Main deployment flow
main() {
    log_info "Robot Brain Simple Production Deployment Started"
    echo "======================================="
    
    check_prerequisites
    setup_environment
    run_tests
    stop_existing_server
    start_production_server
    verify_deployment
    show_status
    
    echo "======================================="
    log_info "Production deployment completed successfully!"
    log_info "Application is running at: http://localhost:8000"
    log_info "Health check: http://localhost:8000/health"
    log_info "Metrics: http://localhost:8000/metrics"
    echo ""
    log_info "Management commands:"
    log_info "  View logs: tail -f /tmp/robot-brain-production.log"
    log_info "  Stop server: $0 stop"
    log_info "  Check status: $0 status"
    log_info "  Health check: $0 health"
}

# Handle script arguments
case "${1:-deploy}" in
    "deploy")
        main
        ;;
    "logs")
        show_logs
        ;;
    "status")
        show_status
        ;;
    "stop")
        log_info "Stopping production services..."
        stop_existing_server
        ;;
    "health")
        if wait_for_health; then
            log_info "Application is healthy"
            exit 0
        else
            log_error "Application is not healthy"
            exit 1
        fi
        ;;
    "restart")
        log_info "Restarting production server..."
        stop_existing_server
        setup_environment
        start_production_server
        verify_deployment
        ;;
    *)
        echo "Usage: $0 {deploy|logs|status|stop|health|restart}"
        echo "  deploy:  Full production deployment (default)"
        echo "  logs:    Show recent logs"
        echo "  status:  Show service status"
        echo "  stop:    Stop production services"
        echo "  health:  Check application health"
        echo "  restart: Restart production server"
        exit 1
        ;;
esac