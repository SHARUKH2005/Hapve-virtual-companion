#!/bin/bash

# RodinHD Quick Setup Script
# This script automates the initial setup of RodinHD

set -e  # Exit on error

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     RodinHD Setup - High-Fidelity Avatar Generation           ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""

# Configuration
PROJECT_ROOT="C:/Users/M.A.SHARUKH SAMEER/OneDrive/Desktop/face"
RODINHD_DIR="$PROJECT_ROOT/RodinHD"
DATA_DIR="$PROJECT_ROOT/avatar-datasets"

echo "📁 Project Root: $PROJECT_ROOT"
echo "📁 RodinHD Directory: $RODINHD_DIR"
echo "📁 Data Directory: $DATA_DIR"
echo ""

# Step 1: Clone Repository
echo "Step 1/5: Cloning RodinHD repository..."
cd "$PROJECT_ROOT"
if [ ! -d "RodinHD" ]; then
    git clone https://github.com/rodinhd/RodinHD.git
    echo "✅ Repository cloned"
else
    echo "ℹ️ Repository already exists"
fi
echo ""

# Step 2: Create Conda Environment
echo "Step 2/5: Creating Conda environment..."
if conda env list | grep -q "rodinhd"; then
    echo "ℹ️ Environment 'rodinhd' already exists"
else
    conda create -n rodinhd python=3.8 -y
    echo "✅ Environment created"
fi
echo ""

# Step 3: Install Dependencies
echo "Step 3/5: Installing dependencies..."
echo "⚠️ This may take 10-15 minutes..."
source activate rodinhd

# Install PyTorch with CUDA
conda install pytorch torchvision torchaudio pytorch-cuda=11.8 -c pytorch -c nvidia -y

# Install requirements
cd "$RODINHD_DIR"
pip install -r requirements.txt

# Additional dependencies
pip install trimesh pillow opencv-python tqdm objaverse

echo "✅ Dependencies installed"
echo ""

# Step 4: Create Data Directories
echo "Step 4/5: Creating data directories..."
mkdir -p "$DATA_DIR/objaverse"
mkdir -p "$DATA_DIR/shapenet"
mkdir -p "$DATA_DIR/custom"
mkdir -p "$DATA_DIR/organized"
mkdir -p "$DATA_DIR/features"
echo "✅ Directories created"
echo ""

# Step 5: Verify Installation
echo "Step 5/5: Verifying installation..."
python -c "
import torch
import numpy as np
print(f'PyTorch: {torch.__version__}')
print(f'CUDA Available: {torch.cuda.is_available()}')
if torch.cuda.is_available():
    print(f'CUDA Version: {torch.version.cuda}')
    print(f'GPU: {torch.cuda.get_device_name(0)}')
print('✅ Installation verified!')
"
echo ""

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║     ✅ RodinHD Setup Complete!                                 ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo ""
echo "📚 Next Steps:"
echo "1. Activate environment: conda activate rodinhd"
echo "2. Download dataset: python scripts/download_objaverse.py"
echo "3. Prepare data: python scripts/organize_dataset.py"
echo "4. Start training: cd Renderer && sh fit_stage1.sh"
echo ""
echo "📖 Full guide: RODINHD_SETUP_GUIDE.md"
