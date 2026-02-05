"""
RQ worker for background job processing
"""
import os
import sys
from pathlib import Path
import logging
from rq import Worker, Connection
from redis import Redis
from process_job import run_full_pipeline
from main import write_status

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

def process_job(job_id, input_path, output_root):
    """
    RQ job function for processing 3D avatar generation
    
    Args:
        job_id: Unique job identifier
        input_path: Path to uploaded image
        output_root: Root directory for outputs
    """
    try:
        logger.info(f"Starting job {job_id}")
        
        # Update status to processing
        write_status(job_id, {"status": "processing", "step": "starting"})
        
        # Run the full pipeline
        result = run_full_pipeline(job_id, input_path, output_root)
        
        logger.info(f"Job {job_id} completed successfully: {result}")
        return result
        
    except Exception as e:
        logger.error(f"Job {job_id} failed: {str(e)}")
        write_status(job_id, {
            "status": "failed",
            "error": str(e),
            "step": "error"
        })
        raise

if __name__ == "__main__":
    # Redis connection
    redis_conn = Redis(host='localhost', port=6379, db=0)
    
    # Create worker
    worker = Worker(['default'], connection=redis_conn)
    
    logger.info("Starting RQ worker...")
    logger.info("Press Ctrl+C to stop")
    
    try:
        worker.work()
    except KeyboardInterrupt:
        logger.info("Worker stopped by user")
    except Exception as e:
        logger.error(f"Worker error: {str(e)}")
        sys.exit(1)
