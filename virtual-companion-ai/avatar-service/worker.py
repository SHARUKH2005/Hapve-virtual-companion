"""
Worker module for avatar generation job queue
"""

import logging
import os
import shutil
import time
from datetime import datetime
from threading import Thread
from typing import Literal, Optional

import redis
from rq import Queue

from airllm_avatar_service import AirLLMAvatarService
from database import SessionLocal, Job

logger = logging.getLogger(__name__)

Mode = Literal["fast", "pro", "ultra"]
Quality = Literal["medium", "high", "ultra"]

# Static output directory (must match avatar-service/main.py)
STATIC_DIR = os.getenv("STATIC_DIR", "static")

# Redis connection
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
REDIS_DB = int(os.getenv("REDIS_DB", 0))

# Try connecting to Redis, fallback to local thread simulation if unavailable
try:
    redis_conn = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, db=REDIS_DB)
    # Check connection
    redis_conn.ping()
    job_queue: Optional[Queue] = Queue(connection=redis_conn)
    USE_REDIS = True
    logger.info("Connected to Redis for job queueing")
except Exception as e:  # pragma: no cover - external service
    logger.warning("Redis not available (%s). Using local thread simulation.", e)
    USE_REDIS = False
    job_queue = None


_airllm_service: Optional[AirLLMAvatarService] = None


def _get_airllm_service() -> AirLLMAvatarService:
    global _airllm_service
    if _airllm_service is None:
        _airllm_service = AirLLMAvatarService()
    return _airllm_service


def process_avatar_job(job_id: str, file_path: str, style: str, mode: Mode = "fast", quality: Quality = "high"):
    """
    Background task for avatar generation.

    - FAST  mode: quick generation using a demo / Ready Player Me‑style avatar.
    - PRO   mode: AirLLM‑guided high‑quality generation (if available).
    - ULTRA mode: highest‑quality, longest‑running AirLLM pipeline.
    """
    db = SessionLocal()
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        db.close()
        return

    try:
        logger.info("Processing job %s (mode=%s, quality=%s)...", job_id, mode, quality)
        job.status = "processing"
        job.progress = 5
        db.commit()

        # FAST mode: keep quick, GPU‑free path (placeholder Ready Player Me avatar)
        if mode == "fast":
            _run_fast_mode(job, db)
        else:
            # PRO / ULTRA: AirLLM‑powered flow with longer processing window
            _run_airllm_mode(job, db, file_path, mode, quality)

        logger.info("Job %s completed.", job_id)

    except Exception as e:  # pragma: no cover - runtime errors
        logger.error("Job %s failed: %s", job_id, e)
        job.status = "failed"
        job.error_message = str(e)
        db.commit()
    finally:
        db.close()


def _run_fast_mode(job: Job, db):
    """Simulate FAST (cloud‑style) avatar generation."""
    # Light progress simulation to keep UX consistent
    for progress in (25, 60, 90):
        time.sleep(2)
        job.progress = progress
        db.commit()

    job.status = "completed"
    job.progress = 100
    job.metadata_cid = "QmDummyMetadataCidFast"
    job.glb_cid = "QmDummyGlbCidFast"
    job.thumbnail_cid = "QmDummyThumbnailCidFast"
    # Demo GLB (Ready Player Me) so the 3D viewer works out‑of‑the‑box
    job.preview_url = "https://models.readyplayer.me/64b73b6f82c444358509c690.glb"
    job.updated_at = datetime.utcnow()
    db.commit()


def _run_airllm_mode(job: Job, db, file_path: str, mode: Mode, quality: Quality):
    """Run PRO / ULTRA modes using AirLLMAvatarService."""
    import asyncio

    # Incremental progress updates for better UX
    job.progress = 15
    db.commit()

    service = _get_airllm_service()

    # Run the coroutine in this worker thread
    loop = asyncio.new_event_loop()
    try:
        asyncio.set_event_loop(loop)
        result = loop.run_until_complete(
            service.generate_avatar(
                job_id=job.id,
                photo_path=file_path,
                mode=mode,
                quality=quality,
            )
        )
    finally:
        loop.close()

    # If the 3D pipeline returned a GLB path, we could now pin it to IPFS.
    # For now we simply record a placeholder and mark the job as completed.
    job.progress = 95
    db.commit()

    job.status = "completed"
    job.progress = 100
    job.metadata_cid = "QmDummyMetadataCidAirLLM"
    job.glb_cid = "QmDummyGlbCidAirLLM"
    job.thumbnail_cid = "QmDummyThumbnailCidAirLLM"

    if result.glb_path and os.path.exists(result.glb_path):
        # Copy to static/ so the frontend can load it over HTTP
        job_static_dir = os.path.join(STATIC_DIR, job.id)
        os.makedirs(job_static_dir, exist_ok=True)
        dst_path = os.path.join(job_static_dir, "avatar.glb")
        try:
            shutil.copy2(result.glb_path, dst_path)
            job.preview_url = f"/static/{job.id}/avatar.glb"
        except Exception as e:
            logger.warning("Failed to copy GLB into static dir: %s", e)
            job.preview_url = "https://models.readyplayer.me/64b73b6f82c444358509c690.glb"
    else:
        # Fallback to the same demo GLB so the viewer still works.
        job.preview_url = "https://models.readyplayer.me/64b73b6f82c444358509c690.glb"

    job.updated_at = datetime.utcnow()
    db.commit()


def enqueue_avatar_job(job_id: str, file_path: str, style: str, mode: Mode = "fast", quality: Quality = "high"):
    """
    Enqueue avatar generation job.

    Args:
        job_id: Unique job identifier
        file_path: Path to uploaded image
        style: Avatar style (realistic, cartoon, anime)
        mode: "fast", "pro", or "ultra"
        quality: "medium", "high", or "ultra"
    """
    if USE_REDIS and job_queue:
        try:
            # Enqueue to Redis worker
            rq_job = job_queue.enqueue(
                "worker.process_avatar_job",
                job_id,
                file_path,
                style,
                mode,
                quality,
                job_timeout="3h",
            )
            logger.info("Job enqueued to Redis: %s (RQ job: %s)", job_id, rq_job.id)
            return rq_job.id
        except Exception as e:  # pragma: no cover - external service issues
            logger.error("Error enqueueing job to Redis %s: %s", job_id, e)
            logger.info("Falling back to local thread processing.")
            _start_local_thread(job_id, file_path, style, mode, quality)
    else:
        # Local Thread Fallback
        _start_local_thread(job_id, file_path, style, mode, quality)


def _start_local_thread(job_id: str, file_path: str, style: str, mode: Mode, quality: Quality):
    thread = Thread(target=process_avatar_job, args=(job_id, file_path, style, mode, quality))
    thread.daemon = True
    thread.start()
    logger.info("Job started in local thread: %s", job_id)


def get_job_status(rq_job_id: str):
    """
    Get RQ job status.
    """
    if not USE_REDIS:
        return None

    try:
        from rq.job import Job as RQJob

        job = RQJob.fetch(rq_job_id, connection=redis_conn)
        return {
            "status": job.get_status(),
            "result": job.result,
            "exc_info": job.exc_info,
        }
    except Exception as e:  # pragma: no cover - runtime / network
        logger.error("Error fetching job status: %s", e)
        return None

