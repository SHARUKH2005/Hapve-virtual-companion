# 3D Avatar Generation Pipeline

A complete system for generating 3D avatars from single photos using PIFuHD, with web-based upload and Three.js viewer.

## 🚀 Quick Start

### Prerequisites
- Python 3.9+
- Node.js 16+
- NVIDIA GPU with CUDA support
- Redis server
- Blender (for mesh processing)

### Installation

1. **Backend Setup**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

2. **Clone PIFuHD**
```bash
cd ..
git clone https://github.com/facebookresearch/pifuhd.git pifuhd
cd pifuhd
pip install -r requirements.txt
# Download checkpoints as per PIFuHD README
```

3. **Frontend Setup**
```bash
cd ../frontend
npm install
```

4. **Start Services**
```bash
# Terminal 1: Start Redis
redis-server

# Terminal 2: Start FastAPI backend
cd backend
source venv/bin/activate
uvicorn main:app --reload

# Terminal 3: Start RQ worker
cd backend
source venv/bin/activate
python worker.py

# Terminal 4: Start React frontend
cd frontend
npm start
```

## 📁 Project Structure

```
avatar-pipeline/
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI app
│   ├── tasks.py            # Background job functions
│   ├── process_job.py      # Main pipeline logic
│   ├── util_image.py       # Image preprocessing
│   ├── worker.py           # RQ worker script
│   └── requirements.txt    # Python dependencies
├── pifuhd/                 # PIFuHD repository (cloned)
├── blender-scripts/        # Blender automation scripts
│   ├── obj_to_glb.py
│   └── decimate_and_export.py
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx
│   │   ├── Viewer.jsx
│   │   ├── Uploader.jsx
│   │   └── upload.js
│   └── package.json
├── uploads/                # Uploaded images
├── models/                 # Generated 3D models
├── status/                 # Job status files
└── docker-compose.yml      # Docker setup
```

## 🔄 Pipeline Flow

1. **Upload**: User uploads photo via web interface
2. **Preprocess**: Face detection and alignment
3. **Generate**: PIFuHD creates 3D mesh from image
4. **Convert**: Blender converts OBJ to optimized GLB
5. **Serve**: Model available for Three.js viewer

## 🛠️ API Endpoints

- `POST /upload` - Upload image file
- `GET /status/{job_id}` - Check processing status
- `GET /static/{path}` - Serve generated models

## 📊 Job Status Flow

```
queued → processing → finished/failed
```

## 🔧 Configuration

Edit `backend/config.py` to adjust:
- PIFuHD resolution
- Mesh decimation ratio
- File paths
- GPU settings

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

## 📝 Notes

- Requires GPU for PIFuHD inference
- Models are stored locally (configure cloud storage for production)
- Job status is stored in JSON files (use database for production)
