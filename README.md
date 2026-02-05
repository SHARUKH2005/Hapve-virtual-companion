# 🤖 Virtual Companion AI (Hapve)

**A production-ready virtual companion platform featuring real-time 3D avatars, voice interaction, and local LLM intelligence.**

[![Status](https://img.shields.io/badge/status-fully--operational-success)]()
[![Frontend](https://img.shields.io/badge/frontend-React_%2B_Vite-blue)]()
[![Backend](https://img.shields.io/badge/backend-FastAPI_%2B_Node-green)]()
[![AI](https://img.shields.io/badge/AI-AirLLM_70B-purple)]()

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Quick Start](#quick-start)
3. [Architecture](#architecture)
4. [Features](#features)
5. [System Requirements](#system-requirements)
6. [Advanced Configuration (AirLLM & 3D Gen)](#advanced-configuration)
7. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

This project is a unified AI platform that combines multiple cutting-edge technologies into a single, cohesive experience. It allows users to create, customize, and converse with an intelligent virtual companion.

**Key Innovations:**

- **Hybrid Brain**: Runs massive 70B parameter models on consumer hardware using **AirLLM** (layer-wise inference) or falls back to cloud APIs (GPT4Free)/Node backend.
- **Visual Intelligence**: Generates 3D avatars from a single selfie using **PIFuHD** pipeline (optional local setup) or Ready Player Me.
- **Immersive Interaction**: Hands-free voice chat using browser-native APIs and real-time face tracking to mirror user expressions on the avatar.
- **Blockchain Ready**: Includes foundations for NFT-based character ownership (Hapve).

---

## 🚀 Quick Start

### The Easiest Way (Windows)

We have resolved previous startup issues. The safest way to start the entire stack (Frontend, Backend, AI Service) is:

1. Open `virtual-companion-ai` folder.
2. Double-click **`start-dev.bat`**.

Or from the command line:

```bash
cd virtual-companion-ai
start-dev.bat
```

This will automatically check dependencies and launch:

- **Frontend**: `http://localhost:3006` (The main UI)
- **Node Backend**: `http://localhost:4000`
- **Avatar/AI Service**: `http://localhost:8000`

### Alternative Method (PowerShell)

For advanced users who want separate windows for each service:

```powershell
cd virtual-companion-ai
.\start.ps1
```

---

## 🏗️ Architecture

The system consists of three main synchronized services:

1. **Frontend (`virtual-companion-ai/frontend`)**:
    - **Tech**: React, Vite, TailwindCSS, Three.js (React Three Fiber).
    - **Role**: Handles 3D rendering, User Interface, Voice I/O, and Face Tracking (MediaPipe).
    - **Port**: `3006`.

2. **Core Backend (`virtual-companion-ai/backend`)**:
    - **Tech**: Node.js, Express.
    - **Role**: Orchestrates data, handles simple logic, and manages optional connections (Database/Redis).
    - **Port**: `4000`.

3. **AI Engine (`avatar-pipeline/backend` or `virtual-companion-ai/avatar-service`)**:
    - **Tech**: Python, FastAPI, AirLLM, PyTorch.
    - **Role**: Runs the heavy AI workloads—LLM inference (70B models), 3D mesh generation (PIFuHD).
    - **Port**: `8000`.

---

## ✨ Features

### Core Functionality (Active)

| Feature | Description | Status |
| :--- | :--- | :--- |
| **3D Avatar Creation** | Create avatars from selfies via Ready Player Me or Local Pipeline. | ✅ Working |
| **AI Personality** | 5 distinct modes (Friendly, Professional, Mentor, Funny, Flirty). | ✅ Working |
| **Voice Chat** | Bidirectional voice conversation with lip-sync. | ✅ Working |
| **Face Tracking** | Webcam-based real-time expression mirroring. | ✅ Working |
| **Memory System** | JSON-based storage for remembering conversations. | ✅ Working |
| **Local LLM** | AirLLM integration for running 70B models locally. | ✅ Working |

### Optional / In-Progress

- **Blockchain**: Hardhat local node for minting character NFTs.
- **High-Fidelity Gen**: Local PIFuHD pipeline for photorealistic mesh generation (requires GPU).

---

## 💻 System Requirements

**Minimum (Cloud Mode / Light usage)**

- **OS**: Windows 10/11, macOS, Linux
- **RAM**: 8GB
- **GPU**: Integrated graphics okay

**Recommended (Local AirLLM / 70B Model)**

- **RAM**: 16GB+ (AirLLM offloads to disk, but RAM helps)
- **Storage**: SSD with ~150GB free (for model weights)
- **GPU**: NVIDIA GPU (CUDA) recommended for reasonable speeds

---

## 🔧 Advanced Configuration

### Enabling AirLLM (Local 70B Model)

To use the high-end local AI personality:

1. Navigate to `avatar-pipeline/backend` (or `virtual-companion-ai/avatar-service`).
2. Install heavy dependencies: `pip install -r requirements.txt`.
3. Ensure your `config.py` or `.env` is set to `ENGINE=local`.
4. **Note**: First run will download massive model files. Inference speed on CPU/Low-RAM system may be slow (30-60s per response).

### Local 3D Pipeline (PIFuHD)

To generate avatars locally instead of using cloud APIs:

1. Setup `avatar-pipeline` directory.
2. Clone PIFuHD: `git clone https://github.com/facebookresearch/pifuhd.git pifuhd`.
3. Download checkpoints as per PIFuHD documentation.
4. Ensure you have a CUDA-capable GPU.

---

## 🐛 Troubleshooting

**"Infinite Command Prompt" Loop**

- **Fix**: Use the `start-dev.bat` script. It has been patched to prevent the `npm install` loop.

**"Site Can't Be Reached"**

- Verify all 3 ports are active: `3006` (UI), `4000` (Node), `8000` (Python).
- If `8000` is down, check the Python console for missing module errors.

**Avatar Not Moving**

- Click **"Enable Camera"** in the UI.
- Ensure explicit browser permissions for Microphone and Camera are granted.

---

## 📁 Project Structure Overview

```
face/
├── README.md                      # [THIS FILE] Unified Documentation
├── virtual-companion-ai/          # MAIN APPLICATION
│   ├── frontend/                  # React UI
│   ├── backend/                   # Node.js Server
│   ├── public/                    # Static assets
│   ├── start-dev.bat              # Recommended launcher
│   └── ...
├── avatar-pipeline/               # AI & 3D GENERATION ENGINE
│   ├── backend/                   # Python FastAPI (AirLLM/PIFuHD)
│   ├── pifuhd/                    # (Data) 3D Generator
│   └── ...
└── ... (Legacy/Archived folders)
```

**Maintainer**: M.A. SHARUKH SAMEER
**Last Updated**: Jan 2026
