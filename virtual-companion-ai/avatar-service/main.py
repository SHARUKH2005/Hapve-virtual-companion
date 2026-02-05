from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from typing import Optional
import os
import shutil
from uuid import uuid4
from datetime import datetime
import logging

# Changed relative imports to absolute for direct execution
from database import SessionLocal, engine, Base, Job, User
try:
    # Optional: Web3 auth / SIWE routes (may require extra deps on Windows)
    from auth import router as auth_router  # type: ignore
except Exception:
    auth_router = None  # type: ignore

try:
    # Optional: IPFS pinning helpers (not required for basic end-to-end)
    from nft_storage import pin_file_to_ipfs, pin_json_to_ipfs  # type: ignore
except Exception:
    pin_file_to_ipfs = None  # type: ignore
    pin_json_to_ipfs = None  # type: ignore
from worker import enqueue_avatar_job
from models import (
    UploadResponse,
    JobStatusResponse,
    MintRequest,
    MintResponse,
    UserAvatarsResponse
)
from chat_service import chat_reply

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(
    title="Hapve API",
    description="Backend API for Hapve - Decentralized AI Avatar Platform",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "https://hapve.ai",
        "https://www.hapve.ai",
        "http://localhost:5173", # Standard Vite port
        "http://localhost:3005", # Current Vite port
        "http://localhost:3006", # Other Vite port
        "http://localhost:3007"  # New Vite port
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Upload directory
UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Static output directory for generated assets (GLB, thumbnails, etc.)
STATIC_DIR = os.getenv("STATIC_DIR", "static")
os.makedirs(STATIC_DIR, exist_ok=True)

# Serve static assets so the frontend can load generated GLBs via HTTP
app.mount("/static", StaticFiles(directory=STATIC_DIR), name="static")

# Constants
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}

# Dependency to get database session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Hapve API v1.0.0",
        "status": "healthy",
        "docs": "/api/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "hapve-backend"
    }


@app.post("/api/upload", response_model=UploadResponse)
async def upload_file(
    file: UploadFile = File(...),
    style: str = "realistic",
    mode: str = "fast",  # "fast", "pro", or "ultra"
    quality: str = "high",  # "medium", "high", or "ultra"
    user_address: Optional[str] = None,
    consent_given: bool = False,
    db=Depends(get_db)
):
    """
    Upload image for avatar generation
    """
    
    # Validate consent (Relaxed check for demo purposes if not strictly enforcing yet)
    # in production, uncomment the check
    # if not consent_given:
    #     raise HTTPException(
    #         status_code=400,
    #         detail="Consent required for biometric data processing"
    #     )
    
    # Validate file extension
    file_ext = os.path.splitext(file.filename)[1].lower()
    if file_ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed: {', '.join(ALLOWED_EXTENSIONS)}"
        )
    
    # Basic validation for mode / quality (defensive; frontend should also validate)
    allowed_modes = {"fast", "pro", "ultra"}
    allowed_qualities = {"medium", "high", "ultra"}
    if mode not in allowed_modes:
        raise HTTPException(status_code=400, detail=f"Invalid mode '{mode}'. Allowed: {', '.join(allowed_modes)}")
    if quality not in allowed_qualities:
        raise HTTPException(status_code=400, detail=f"Invalid quality '{quality}'. Allowed: {', '.join(allowed_qualities)}")

    try:
        # Generate job ID
        job_id = str(uuid4())
        
        # Save uploaded file
        file_path = os.path.join(UPLOAD_DIR, f"{job_id}_{file.filename}")
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File uploaded: {file_path}")
        
        # Create user if doesn't exist
        if user_address:
            user = db.query(User).filter(User.wallet_address == user_address).first()
            if not user:
                user = User(wallet_address=user_address)
                db.add(user)
                db.commit()
                db.refresh(user)
        
        # Create job record
        job = Job(
            id=job_id,
            user_address=user_address,
            status="queued",
            progress=0,
            file_path=file_path,
            style=style,
            consent_given=consent_given
        )
        db.add(job)
        db.commit()
        db.refresh(job)

        # FAST mode should be instant: mark completed immediately and return a preview URL.
        # (Option A: Ready Player Me / demo avatar. True RPM photo pipeline can be integrated next.)
        if mode == "fast":
            job.status = "completed"
            job.progress = 100
            job.preview_url = "https://models.readyplayer.me/63415033c46a6f6630f5a707.glb"
            job.updated_at = datetime.utcnow()
            db.commit()

            return UploadResponse(
                job_id=job_id,
                status="completed",
                message="FAST avatar generated.",
                estimated_time="instant",
                preview_url=job.preview_url,
            )

        # PRO/ULTRA: background job
        enqueue_avatar_job(job_id, file_path, style, mode=mode, quality=quality)

        estimated_time = {"pro": "30-60 minutes", "ultra": "2-3 hours"}[mode]

        return UploadResponse(
            job_id=job_id,
            status="queued",
            message="Avatar generation started.",
            estimated_time=estimated_time,
        )
        
    except Exception as e:
        logger.error(f"Upload error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# -------------------- UNIFIED INTEGRATION ALIASES (Integration Plan) --------------------
# These endpoints match the names from your unified architecture doc while reusing
# the existing Hapve backend implementation.

@app.post("/avatars/create")
async def avatars_create(
    photo: UploadFile = File(...),
    mode: str = "fast",
    quality: str = "high",
    style: str = "realistic",
    mint_as_nft: bool = False,  # placeholder: mint flow handled separately today
    user_address: Optional[str] = None,
    consent_given: bool = False,
    db=Depends(get_db),
):
    """
    Alias for the unified spec endpoint:
    - fast: 2-5 minutes
    - pro: 30-60 minutes
    - ultra: 2-3 hours

    Returns the same job_id used by /api/job/{job_id}.
    """
    # Reuse the existing upload pipeline
    upload = await upload_file(
        file=photo,
        style=style,
        mode=mode,
        quality=quality,
        user_address=user_address,
        consent_given=consent_given,
        db=db,
    )

    return {
        "job_id": upload.job_id,
        "mode": mode,
        "quality": quality,
        "status": upload.status,
        "estimated_time": upload.estimated_time,
        "message": upload.message,
        "mint_as_nft": mint_as_nft,
    }


@app.get("/avatars/status/{job_id}")
async def avatars_status(job_id: str, db=Depends(get_db)):
    """Alias for the unified spec status endpoint (wraps /api/job/{job_id})."""
    status = await get_job_status(job_id=job_id, db=db)

    # Normalize naming for clients that expect progress 0-100 (int)
    progress = int(status.progress) if status.progress is not None else 0

    return {
        "job_id": status.job_id,
        "status": status.status,  # queued | processing | completed | failed
        "progress": progress,
        "glb_url": status.preview_url,
        "metadata_cid": status.metadata_cid,
        "glb_cid": status.glb_cid,
        "thumbnail_cid": status.thumbnail_cid,
        "error": status.error_message,
    }


@app.get("/api/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status(job_id: str, db=Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    response = JobStatusResponse(
        job_id=job.id,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at.isoformat(),
        updated_at=job.updated_at.isoformat() if job.updated_at else None
    )
    
    if job.status == "completed":
        response.metadata_cid = job.metadata_cid
        response.glb_cid = job.glb_cid
        response.thumbnail_cid = job.thumbnail_cid
        response.preview_url = job.preview_url
    elif job.status == "failed":
        response.error_message = job.error_message
    
    return response


@app.get("/api/user/{user_address}/avatars", response_model=UserAvatarsResponse)
async def get_user_avatars(user_address: str, db=Depends(get_db)):
    jobs = db.query(Job).filter(
        Job.user_address == user_address,
        Job.status == "completed"
    ).order_by(Job.created_at.desc()).all()
    
    avatars = []
    for job in jobs:
        avatars.append({
            "job_id": job.id,
            "metadata_cid": job.metadata_cid,
            "glb_cid": job.glb_cid,
            "thumbnail_cid": job.thumbnail_cid,
            "preview_url": job.preview_url,
            "token_id": job.token_id,
            "created_at": job.created_at.isoformat()
        })
    
    return UserAvatarsResponse(
        user_address=user_address,
        total_avatars=len(avatars),
        avatars=avatars
    )

# -------------------- CHAT (LIVE COMPANION) --------------------
@app.post("/api/chat")
async def chat(request: dict):
    """
    Live companion chat endpoint.

    If OPENAI_API_KEY is configured, it will answer using the configured model.
    Otherwise, it returns a basic local fallback response so the app remains functional.
    """
    message = request.get("message")
    messages = request.get("messages")

    # Accept either {message:"..."} or {messages:[...]} for flexibility
    if isinstance(messages, list):
        chat_messages = messages
    elif isinstance(message, str):
        chat_messages = [{"role": "user", "content": message}]
    else:
        raise HTTPException(status_code=400, detail="Provide 'message' (string) or 'messages' (array).")

    system_prompt = request.get(
        "system_prompt",
        "You are a helpful, warm, emotionally-aware virtual companion. Be concise and kind.",
    )

    reply = await chat_reply(chat_messages, system_prompt=system_prompt)
    return {"response": reply, "emotion": "neutral"}

# ... (Include other endpoints as needed, kept core ones for brevity)

@app.post("/api/job/{job_id}/mint", response_model=MintResponse)
async def record_mint(job_id: str, request: MintRequest, db=Depends(get_db)):
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    job.token_id = request.token_id
    job.tx_hash = request.tx_hash
    job.minted = True
    job.minted_at = datetime.utcnow()
    db.commit()
    
    return MintResponse(message="Mint recorded successfully", job_id=job_id, token_id=request.token_id, tx_hash=request.tx_hash)

if auth_router is not None:
    app.include_router(auth_router, prefix="/api/auth", tags=["Authentication"])

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
