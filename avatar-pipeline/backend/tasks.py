"""
Task definitions for RQ worker
"""
from process_job import run_full_pipeline
from main import write_status
import logging

logger = logging.getLogger(__name__)

def process_job(job_id, input_path, output_root):
    """
    RQ job function for processing 3D avatar generation
    
    Args:
        job_id: Unique job identifier
        input_path: Path to uploaded image
        output_root: Root directory for outputs
    
    Returns:
        str: URL path to final GLB model
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
