#!/bin/bash

# Start script for the 3D Avatar Generation Pipeline
# This script starts all required services

set -e

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Function to start services
start_services() {
    print_status "Starting 3D Avatar Generation Pipeline..."
    
    # Check if Redis is running
    if ! pgrep -x "redis-server" > /dev/null; then
        print_status "Starting Redis..."
        redis-server --daemonize yes
        sleep 2
        print_success "Redis started"
    else
        print_success "Redis already running"
    fi
    
    # Start backend
    print_status "Starting FastAPI backend..."
    cd backend
    source ../venv/bin/activate
    python main.py &
    BACKEND_PID=$!
    cd ..
    print_success "Backend started (PID: $BACKEND_PID)"
    
    # Start worker
    print_status "Starting RQ worker..."
    cd backend
    source ../venv/bin/activate
    python worker.py &
    WORKER_PID=$!
    cd ..
    print_success "Worker started (PID: $WORKER_PID)"
    
    # Start frontend
    print_status "Starting React frontend..."
    cd frontend
    npm start &
    FRONTEND_PID=$!
    cd ..
    print_success "Frontend started (PID: $FRONTEND_PID)"
    
    echo ""
    print_success "All services started successfully!"
    echo ""
    echo "Services running:"
    echo "- Backend API: http://localhost:8000"
    echo "- Frontend: http://localhost:3000"
    echo "- Redis: localhost:6379"
    echo ""
    echo "Process IDs:"
    echo "- Backend: $BACKEND_PID"
    echo "- Worker: $WORKER_PID"
    echo "- Frontend: $FRONTEND_PID"
    echo ""
    echo "Press Ctrl+C to stop all services"
    
    # Wait for interrupt
    trap 'stop_services' INT
    wait
}

# Function to stop services
stop_services() {
    print_status "Stopping services..."
    
    # Kill processes
    pkill -f "python main.py" || true
    pkill -f "python worker.py" || true
    pkill -f "npm start" || true
    
    print_success "All services stopped"
    exit 0
}

# Check if setup is complete
check_setup() {
    if [ ! -d "venv" ]; then
        echo "Error: Virtual environment not found. Please run ./setup.sh first."
        exit 1
    fi
    
    if [ ! -d "pifuhd" ]; then
        echo "Error: PIFuHD not found. Please run ./setup.sh first."
        exit 1
    fi
    
    if [ ! -f "backend/requirements.txt" ]; then
        echo "Error: Backend requirements not found. Please run ./setup.sh first."
        exit 1
    fi
    
    if [ ! -f "frontend/package.json" ]; then
        echo "Error: Frontend package.json not found. Please run ./setup.sh first."
        exit 1
    fi
}

# Main function
main() {
    check_setup
    start_services
}

# Run main function
main "$@"
