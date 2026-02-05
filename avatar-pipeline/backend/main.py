from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
import os
import uuid
import shutil
import json
from pathlib import Path
from rq import Queue
from redis import Redis
from tasks import process_job
from g4f_service import g4f_chat_service
from heygen_service import heygen_service
import logging
from dotenv import load_dotenv

load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="3D Avatar Generation API", version="1.0.0")

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React dev server
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection and job queue
redis_conn = Redis(host='localhost', port=6379, db=0)
q = Queue(connection=redis_conn)

# Directory setup
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("models")
STATUS_DIR = Path("status")

for directory in [UPLOAD_DIR, OUTPUT_DIR, STATUS_DIR]:
    directory.mkdir(exist_ok=True)

# Mount static files for serving models
app.mount("/static", StaticFiles(directory=str(OUTPUT_DIR)), name="static")

def write_status(job_id: str, status_dict: dict):
    """Write job status to JSON file"""
    status_file = STATUS_DIR / f"{job_id}.json"
    with open(status_file, "w") as f:
        json.dump(status_dict, f, indent=2)

def read_status(job_id: str) -> dict:
    """Read job status from JSON file"""
    status_file = STATUS_DIR / f"{job_id}.json"
    if not status_file.exists():
        return {"status": "not_found"}
    
    with open(status_file, "r") as f:
        return json.load(f)

@app.get("/")
async def root():
    """Health check endpoint"""
    return {"message": "3D Avatar Generation API is running", "status": "healthy"}

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    """
    Upload an image file and start 3D avatar generation process
    
    Args:
        file: Image file (JPG, PNG, etc.)
    
    Returns:
        dict: Job ID for tracking progress
    """
    # Validate file type
    if not file.content_type.startswith('image/'):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    # Generate unique job ID
    job_id = str(uuid.uuid4())
    
    # Save uploaded file
    file_extension = Path(file.filename).suffix
    input_path = UPLOAD_DIR / f"{job_id}{file_extension}"
    
    try:
        with open(input_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        logger.info(f"File uploaded: {input_path}")
        
        # Initialize job status
        write_status(job_id, {
            "status": "queued",
            "filename": file.filename,
            "upload_time": str(Path(input_path).stat().st_mtime)
        })
        
        # Enqueue processing job
        q.enqueue(
            process_job,
            job_id,
            str(input_path),
            str(OUTPUT_DIR),
            job_timeout='30m'  # 30 minute timeout
        )
        
        logger.info(f"Job {job_id} queued for processing")
        
        return {
            "job_id": job_id,
            "message": "Image uploaded successfully. Processing started.",
            "status_url": f"/status/{job_id}"
        }
        
    except Exception as e:
        logger.error(f"Upload failed for job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    """
    Get the status of a processing job
    
    Args:
        job_id: Unique job identifier
    
    Returns:
        dict: Current job status and progress
    """
    status = read_status(job_id)
    
    if status["status"] == "not_found":
        raise HTTPException(status_code=404, detail="Job not found")
    
    return status

@app.get("/jobs")
async def list_jobs():
    """List all jobs and their statuses"""
    jobs = []
    for status_file in STATUS_DIR.glob("*.json"):
        with open(status_file, "r") as f:
            job_data = json.load(f)
            job_data["job_id"] = status_file.stem
            jobs.append(job_data)
    
    return {"jobs": jobs}

@app.post("/chat")
@app.post("/chat")
async def chat_with_avatar(request: dict):
    """
    Chat with the avatar.
    JSON: {"prompt": "...", "max_tokens": 150, "personality": "friendly", "engine": "cloud"}
    'engine' can be 'cloud' (g4f/fast) or 'local_pro' (AirLLM/heavy).
    """
    prompt = request.get("prompt")
    max_tokens = request.get("max_tokens", 150)
    personality = request.get("personality", "friendly")
    engine = request.get("engine", "local_pro") # Default to AirLLM (Pro Mode) as requested
    
    if not prompt:
        raise HTTPException(status_code=400, detail="Prompt is required")

    response = ""
    model_name = ""
    mode_used = ""

    try:
        # Check if the user specifically requested the Heavy GPU/AirLLM engine
        # OR if it's the default now.
        if engine == "local_pro":
            logger.info("Engaging AirLLM (Pro/Local Mode) - Layer-wise Inference...")
            # Lazy load AirLLM only if requested
            response = airllm_chat_service.generate_response(prompt, personality_type=personality, max_new_tokens=max_tokens)
            model_name = airllm_chat_service.model_name
            mode_used = "airllm_local"
            
        else:
            # Default to Cloud/G4F
            logger.info("Using Cloud/G4F Engine...")
            response = g4f_chat_service.generate_response(prompt, personality_type=personality, max_tokens=max_tokens)
            model_name = g4f_chat_service.model
            mode_used = "gpt4free_cloud"

    except Exception as e:
        logger.error(f"Engine failed: {e}. Falling back to Cloud.")
        response = g4f_chat_service.generate_response(prompt, personality_type=personality, max_tokens=max_tokens)
        model_name = "fallback_g4f"
        mode_used = "fallback"

    return {
        "response": response,
        "model": model_name,
        "mode": mode_used
    }

@app.get("/avatar/stats")
async def get_avatar_stats():
    """Fetch the AI's current evolution and personality stats"""
    from memory_service import memory_mgr
    return memory_mgr.data["personality"]

@app.post("/avatar/talk")
async def avatar_talk(request: dict):
    """
    Generate a talking video using HeyGen.
    Expects: {"image_url": "...", "text": "..."}
    """
    image_url = request.get("image_url")
    text = request.get("text")
    
    if not image_url or not text:
        raise HTTPException(status_code=400, detail="image_url and text are required")
    
    result = heygen_service.create_talking_video(image_url, text)
    return result

@app.get("/avatar/video/{video_id}")
async def get_video_status(video_id: str):
    """Check HeyGen video status"""
    return heygen_service.get_video_status(video_id)

@app.delete("/job/{job_id}")
async def delete_job(job_id: str):
    """Delete a job and its associated files"""
    try:
        # Remove status file
        status_file = STATUS_DIR / f"{job_id}.json"
        if status_file.exists():
            status_file.unlink()
        
        # Remove uploaded file
        for upload_file in UPLOAD_DIR.glob(f"{job_id}.*"):
            upload_file.unlink()
        
        # Remove output directory
        output_dir = OUTPUT_DIR / job_id
        if output_dir.exists():
            shutil.rmtree(output_dir)
        
        return {"message": f"Job {job_id} deleted successfully"}
        
    except Exception as e:
        logger.error(f"Failed to delete job {job_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
