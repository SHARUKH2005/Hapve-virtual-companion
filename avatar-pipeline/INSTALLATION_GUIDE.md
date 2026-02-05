# 3D Avatar Generation Pipeline - Complete Implementation

## 🎯 Overview

This is a complete, production-ready implementation of a 3D avatar generation system that transforms single photos into interactive 3D models using PIFuHD, with a modern web interface built with React and Three.js.

## 🏗️ Architecture

```
User Upload → FastAPI Backend → Redis Queue → RQ Worker → PIFuHD → Blender → GLB → Three.js Viewer
```

### Components:
- **Backend**: FastAPI server handling uploads and API endpoints
- **Worker**: Background processing using RQ (Redis Queue)
- **PIFuHD**: Facebook's single-image 3D reconstruction model
- **Blender**: Mesh optimization and GLB conversion
- **Frontend**: React app with Three.js 3D viewer
- **Redis**: Job queue and caching

## 🚀 Quick Start

### Prerequisites
- **Python 3.9+** with pip
- **Node.js 16+** with npm
- **Redis server**
- **Blender 3.0+** (for mesh processing)
- **NVIDIA GPU** with CUDA (recommended for PIFuHD)
- **Git** (for cloning PIFuHD)

### 1. Clone and Setup
```bash
# Clone the repository
git clone <your-repo-url> avatar-pipeline
cd avatar-pipeline

# Make setup script executable
chmod +x setup.sh

# Run automated setup
./setup.sh
```

### 2. Download PIFuHD Checkpoints
```bash
cd pifuhd
# Follow the README.md instructions to download required checkpoints
# Typically involves downloading files to pifuhd/checkpoints/
```

### 3. Start Services
```bash
# Option A: Use the start script
chmod +x start.sh
./start.sh

# Option B: Start manually
# Terminal 1: Redis
redis-server

# Terminal 2: Backend
cd backend
source ../venv/bin/activate
python main.py

# Terminal 3: Worker
cd backend
source ../venv/bin/activate
python worker.py

# Terminal 4: Frontend
cd frontend
npm start
```

### 4. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

## 📁 Project Structure

```
avatar-pipeline/
├── backend/                 # FastAPI backend
│   ├── main.py             # FastAPI application
│   ├── tasks.py             # RQ job definitions
│   ├── process_job.py      # Main processing pipeline
│   ├── util_image.py       # Image preprocessing
│   ├── worker.py           # RQ worker script
│   ├── config.py           # Configuration management
│   ├── requirements.txt    # Python dependencies
│   └── Dockerfile          # Docker configuration
├── pifuhd/                 # PIFuHD repository (cloned)
├── blender-scripts/        # Blender automation
│   ├── obj_to_glb.py      # OBJ to GLB conversion
│   └── decimate_and_export.py # Mesh optimization
├── frontend/               # React frontend
│   ├── src/
│   │   ├── App.jsx         # Main application
│   │   ├── Uploader.jsx    # File upload component
│   │   ├── Viewer.jsx      # Three.js 3D viewer
│   │   ├── StatusTracker.jsx # Job status tracking
│   │   └── upload.js       # API client
│   ├── package.json        # Node.js dependencies
│   └── Dockerfile          # Docker configuration
├── uploads/                # Uploaded images
├── models/                 # Generated 3D models
├── status/                 # Job status files
├── docker-compose.yml      # Docker orchestration
├── setup.sh               # Automated setup script
├── start.sh               # Service startup script
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables
Create a `.env` file in the backend directory:

```env
# Redis Configuration
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_DB=0

# API Configuration
API_HOST=0.0.0.0
API_PORT=8000
API_DEBUG=false

# Image Processing
IMAGE_TARGET_SIZE=1024
IMAGE_MAX_FILE_SIZE=10485760  # 10MB

# PIFuHD Settings
PIFUHD_RESOLUTION=512
PIFUHD_TIMEOUT=1800  # 30 minutes

# Blender Settings
BLENDER_PATH=blender
DECIMATE_RATIO=0.25
TARGET_TRIANGLES=50000

# Performance
ENABLE_GPU=true
GPU_MEMORY_FRACTION=0.8

# Security
ALLOWED_ORIGINS=http://localhost:3000
REQUIRE_CONSENT=true
```

### Configuration Profiles
- **Development**: Lower resolution, debug logging
- **Production**: Higher quality, optimized performance
- **Testing**: Minimal resources for CI/CD

## 🔄 Processing Pipeline

### Step-by-Step Process:

1. **Upload**: User uploads image via web interface
2. **Validation**: Check file type, size, and content
3. **Preprocessing**: Face detection and alignment using MediaPipe
4. **Queue**: Job added to Redis queue for background processing
5. **PIFuHD**: 3D reconstruction from aligned image
6. **Conversion**: OBJ to GLB using Blender
7. **Optimization**: Mesh decimation and material optimization
8. **Delivery**: GLB served via static files, displayed in Three.js

### Job Status Flow:
```
queued → processing → preprocessing → 3d_generation → conversion → optimization → finished
```

## 🛠️ API Endpoints

### Upload Endpoint
```http
POST /upload
Content-Type: multipart/form-data

Response:
{
  "job_id": "uuid",
  "message": "Image uploaded successfully",
  "status_url": "/status/{job_id}"
}
```

### Status Endpoint
```http
GET /status/{job_id}

Response:
{
  "status": "processing",
  "step": "3d_generation",
  "progress": 60
}
```

### Static Files
```http
GET /static/{job_id}/{filename.glb}
```

## 🎨 Frontend Features

### Upload Interface
- Drag & drop file upload
- Image preview
- File validation
- Progress tracking

### 3D Viewer
- Interactive Three.js scene
- Orbit controls (rotate, zoom, pan)
- Realistic lighting
- Material optimization
- Responsive design

### Status Tracking
- Real-time job progress
- Step-by-step updates
- Error handling
- Job management

## 🐳 Docker Deployment

### Using Docker Compose
```bash
# Build and start all services
docker-compose up --build

# Run in background
docker-compose up -d --build

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Manual Docker Build
```bash
# Build backend
cd backend
docker build -t avatar-backend .

# Build frontend
cd ../frontend
docker build -t avatar-frontend .

# Run with docker-compose
docker-compose up
```

## 🔍 Troubleshooting

### Common Issues:

1. **CUDA Out of Memory**
   ```bash
   # Reduce PIFuHD resolution
   export PIFUHD_RESOLUTION=256
   ```

2. **Blender Not Found**
   ```bash
   # Install Blender or update path
   export BLENDER_PATH=/path/to/blender
   ```

3. **Redis Connection Failed**
   ```bash
   # Start Redis server
   redis-server
   ```

4. **PIFuHD Checkpoints Missing**
   ```bash
   # Download required checkpoints
   cd pifuhd
   # Follow README instructions
   ```

### Performance Optimization:

1. **GPU Memory Issues**
   - Reduce `PIFUHD_RESOLUTION`
   - Lower `GPU_MEMORY_FRACTION`
   - Use CPU fallback

2. **Slow Processing**
   - Increase `MAX_CONCURRENT_JOBS`
   - Use higher-end GPU
   - Optimize Blender settings

3. **Large File Sizes**
   - Increase `DECIMATE_RATIO`
   - Enable LOD generation
   - Use Draco compression

## 📊 Monitoring and Logging

### Log Files
- Application logs: `avatar_pipeline.log`
- Job logs: `status/{job_id}.json`
- Error logs: Console output

### Health Checks
```bash
# Check API health
curl http://localhost:8000/

# Check Redis
redis-cli ping

# Check job queue
curl http://localhost:8000/jobs
```

## 🔒 Security Considerations

### Privacy
- User consent required for processing
- Automatic file deletion after 24 hours
- No persistent storage of uploaded images

### Security
- File type validation
- Size limits
- CORS configuration
- Input sanitization

### Production Deployment
- Use HTTPS
- Implement authentication
- Set up monitoring
- Configure backup strategies

## 🚀 Production Deployment

### Cloud Deployment (AWS/GCP/Azure)
1. Use GPU instances for workers
2. Store models in cloud storage (S3/GCS/Azure Blob)
3. Use managed Redis (ElastiCache/Cloud Memorystore)
4. Implement load balancing
5. Set up monitoring and alerting

### Scaling Considerations
- Horizontal scaling of workers
- CDN for model delivery
- Database for job persistence
- Message queues for high throughput

## 📈 Performance Metrics

### Typical Processing Times:
- **Image preprocessing**: 5-10 seconds
- **PIFuHD inference**: 2-5 minutes (GPU)
- **Blender conversion**: 30-60 seconds
- **Total pipeline**: 3-7 minutes

### Resource Requirements:
- **GPU**: 8GB+ VRAM recommended
- **RAM**: 16GB+ system memory
- **Storage**: 50GB+ for models and checkpoints
- **CPU**: 4+ cores for preprocessing

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **PIFuHD**: Facebook Research for the 3D reconstruction model
- **Three.js**: For the 3D web graphics library
- **FastAPI**: For the modern Python web framework
- **React**: For the frontend framework
- **Blender**: For 3D mesh processing

## 📞 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs
3. Create an issue on GitHub
4. Contact the development team

---

**Happy 3D Avatar Generation! 🎭**
