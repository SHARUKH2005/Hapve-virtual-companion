#!/bin/bash

# 3D Avatar Generation Pipeline Setup Script
# This script sets up the complete environment for the avatar generation system

set -e

echo "🚀 Setting up 3D Avatar Generation Pipeline..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running on supported OS
check_os() {
    print_status "Checking operating system..."
    
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        OS="linux"
        print_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        OS="macos"
        print_success "macOS detected"
    else
        print_error "Unsupported operating system: $OSTYPE"
        exit 1
    fi
}

# Check for required tools
check_dependencies() {
    print_status "Checking dependencies..."
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version | cut -d' ' -f2)
        print_success "Python $PYTHON_VERSION found"
    else
        print_error "Python 3 is required but not installed"
        exit 1
    fi
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js $NODE_VERSION found"
    else
        print_error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check Redis
    if command -v redis-server &> /dev/null; then
        print_success "Redis found"
    else
        print_warning "Redis not found. Installing..."
        install_redis
    fi
    
    # Check Blender
    if command -v blender &> /dev/null; then
        print_success "Blender found"
    else
        print_warning "Blender not found. Please install Blender manually."
        print_status "Download from: https://www.blender.org/download/"
    fi
    
    # Check CUDA (optional but recommended)
    if command -v nvidia-smi &> /dev/null; then
        CUDA_VERSION=$(nvidia-smi | grep "CUDA Version" | awk '{print $9}')
        print_success "CUDA $CUDA_VERSION found"
    else
        print_warning "CUDA not found. GPU acceleration will not be available."
    fi
}

# Install Redis
install_redis() {
    print_status "Installing Redis..."
    
    if [[ "$OS" == "linux" ]]; then
        if command -v apt-get &> /dev/null; then
            sudo apt-get update
            sudo apt-get install -y redis-server
        elif command -v yum &> /dev/null; then
            sudo yum install -y redis
        else
            print_error "Cannot install Redis automatically. Please install manually."
            exit 1
        fi
    elif [[ "$OS" == "macos" ]]; then
        if command -v brew &> /dev/null; then
            brew install redis
        else
            print_error "Homebrew required for Redis installation on macOS"
            exit 1
        fi
    fi
    
    print_success "Redis installed successfully"
}

# Setup Python environment
setup_python_env() {
    print_status "Setting up Python environment..."
    
    # Create virtual environment
    python3 -m venv venv
    source venv/bin/activate
    
    # Upgrade pip
    pip install --upgrade pip
    
    # Install backend dependencies
    cd backend
    pip install -r requirements.txt
    cd ..
    
    print_success "Python environment setup complete"
}

# Setup Node.js environment
setup_node_env() {
    print_status "Setting up Node.js environment..."
    
    cd frontend
    npm install
    cd ..
    
    print_success "Node.js environment setup complete"
}

# Clone PIFuHD repository
setup_pifuhd() {
    print_status "Setting up PIFuHD..."
    
    if [ ! -d "pifuhd" ]; then
        git clone https://github.com/facebookresearch/pifuhd.git pifuhd
        print_success "PIFuHD cloned successfully"
    else
        print_success "PIFuHD already exists"
    fi
    
    # Install PIFuHD dependencies
    cd pifuhd
    pip install -r requirements.txt
    cd ..
    
    print_warning "Don't forget to download PIFuHD checkpoints!"
    print_status "Follow instructions in pifuhd/README.md"
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    
    mkdir -p uploads models status blender-scripts
    
    print_success "Directories created"
}

# Start services
start_services() {
    print_status "Starting services..."
    
    # Start Redis
    if ! pgrep -x "redis-server" > /dev/null; then
        redis-server --daemonize yes
        print_success "Redis started"
    else
        print_success "Redis already running"
    fi
    
    print_success "Services started"
}

# Main setup function
main() {
    echo "=========================================="
    echo "3D Avatar Generation Pipeline Setup"
    echo "=========================================="
    
    check_os
    check_dependencies
    create_directories
    setup_python_env
    setup_node_env
    setup_pifuhd
    start_services
    
    echo ""
    echo "=========================================="
    print_success "Setup completed successfully!"
    echo "=========================================="
    echo ""
    echo "Next steps:"
    echo "1. Download PIFuHD checkpoints (see pifuhd/README.md)"
    echo "2. Start the backend: cd backend && source ../venv/bin/activate && python main.py"
    echo "3. Start the worker: cd backend && source ../venv/bin/activate && python worker.py"
    echo "4. Start the frontend: cd frontend && npm start"
    echo ""
    echo "Or use Docker: docker-compose up --build"
    echo ""
}

# Run main function
main "$@"
