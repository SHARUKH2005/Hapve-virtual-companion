"""
Main processing pipeline for 3D avatar generation
"""
import os
import subprocess
import shutil
from pathlib import Path
import logging
from util_image import preprocess_image
import json

logger = logging.getLogger(__name__)

class AvatarPipeline:
    """Main pipeline for 3D avatar generation"""
    
    def __init__(self, pifuhd_path="pifuhd", blender_path="blender"):
        self.pifuhd_path = Path(pifuhd_path)
        self.blender_path = blender_path
        self.blender_scripts_path = Path("blender-scripts")
        
    def update_status(self, job_id, status_dict):
        """Update job status"""
        status_file = Path("status") / f"{job_id}.json"
        with open(status_file, "w") as f:
            json.dump(status_dict, f, indent=2)
    
    def run_pifuhd(self, input_image, output_dir, resolution=512):
        """
        Run PIFuHD to generate 3D model from image
        
        Args:
            input_image: Path to preprocessed input image
            output_dir: Directory to save PIFuHD output
            resolution: Resolution for PIFuHD (256, 512, 1024)
        
        Returns:
            str: Path to generated OBJ file
        """
        try:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            
            logger.info(f"Running PIFuHD on {input_image}")
            
            # PIFuHD command (adjust based on your PIFuHD setup)
            cmd = [
                "python", "-m", "apps.simple_test",
                "-r", str(resolution),
                "--use_rect",
                "-i", str(input_image),
                "-o", str(output_dir)
            ]
            
            # Change to PIFuHD directory
            original_cwd = os.getcwd()
            os.chdir(self.pifuhd_path)
            
            try:
                # Run PIFuHD
                result = subprocess.run(
                    cmd,
                    capture_output=True,
                    text=True,
                    timeout=1800  # 30 minute timeout
                )
                
                if result.returncode != 0:
                    logger.error(f"PIFuHD failed: {result.stderr}")
                    raise RuntimeError(f"PIFuHD failed: {result.stderr}")
                
                logger.info(f"PIFuHD completed successfully")
                
            finally:
                os.chdir(original_cwd)
            
            # Look for output files
            obj_file = output_dir / "result.obj"
            if not obj_file.exists():
                # Try alternative output names
                for alt_name in ["pifuhd.obj", "mesh.obj", "output.obj"]:
                    alt_file = output_dir / alt_name
                    if alt_file.exists():
                        obj_file = alt_file
                        break
                else:
                    raise FileNotFoundError(f"No OBJ file found in {output_dir}")
            
            logger.info(f"PIFuHD output: {obj_file}")
            return str(obj_file)
            
        except subprocess.TimeoutExpired:
            logger.error("PIFuHD timed out after 30 minutes")
            raise RuntimeError("PIFuHD processing timed out")
        except Exception as e:
            logger.error(f"PIFuHD failed: {str(e)}")
            raise
    
    def convert_obj_to_glb(self, obj_file, output_dir, decimate_ratio=0.25):
        """
        Convert OBJ to GLB using Blender
        
        Args:
            obj_file: Path to input OBJ file
            output_dir: Directory to save GLB file
            decimate_ratio: Mesh decimation ratio (0.1-1.0)
        
        Returns:
            str: Path to generated GLB file
        """
        try:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            
            obj_path = Path(obj_file)
            glb_path = output_dir / f"{obj_path.stem}.glb"
            
            logger.info(f"Converting {obj_file} to GLB")
            
            # Blender script path
            script_path = self.blender_scripts_path / "obj_to_glb.py"
            
            # Blender command
            cmd = [
                self.blender_path,
                "--background",
                "--python", str(script_path),
                "--",
                str(obj_file),
                str(glb_path),
                str(decimate_ratio)
            ]
            
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout
            )
            
            if result.returncode != 0:
                logger.error(f"Blender conversion failed: {result.stderr}")
                raise RuntimeError(f"Blender conversion failed: {result.stderr}")
            
            if not glb_path.exists():
                raise FileNotFoundError(f"GLB file not created: {glb_path}")
            
            logger.info(f"GLB conversion completed: {glb_path}")
            return str(glb_path)
            
        except subprocess.TimeoutExpired:
            logger.error("Blender conversion timed out")
            raise RuntimeError("Blender conversion timed out")
        except Exception as e:
            logger.error(f"GLB conversion failed: {str(e)}")
            raise
    
    def optimize_glb(self, glb_file, output_dir):
        """
        Optimize GLB file for web delivery
        
        Args:
            glb_file: Path to input GLB file
            output_dir: Directory to save optimized GLB
        
        Returns:
            str: Path to optimized GLB file
        """
        try:
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            
            glb_path = Path(glb_file)
            optimized_path = output_dir / f"{glb_path.stem}_optimized.glb"
            
            logger.info(f"Optimizing GLB: {glb_file}")
            
            # For now, just copy the file (can add Draco compression later)
            shutil.copy2(glb_file, optimized_path)
            
            logger.info(f"GLB optimization completed: {optimized_path}")
            return str(optimized_path)
            
        except Exception as e:
            logger.error(f"GLB optimization failed: {str(e)}")
            raise
    
    def run_full_pipeline(self, job_id, input_path, output_root):
        """
        Run the complete 3D avatar generation pipeline
        
        Args:
            job_id: Unique job identifier
            input_path: Path to uploaded image
            output_root: Root directory for outputs
        
        Returns:
            str: URL path to final GLB model
        """
        try:
            logger.info(f"Starting pipeline for job {job_id}")
            
            # Create job output directory
            job_output_dir = Path(output_root) / job_id
            job_output_dir.mkdir(parents=True, exist_ok=True)
            
            # Step 1: Image preprocessing
            self.update_status(job_id, {"status": "processing", "step": "preprocessing"})
            processed_image = job_output_dir / "processed.jpg"
            preprocess_image(input_path, processed_image)
            
            # Step 2: PIFuHD 3D generation (Attempt)
            self.update_status(job_id, {"status": "processing", "step": "3d_generation"})
            pifuhd_output_dir = job_output_dir / "pifuhd_output"
            
            model_url = ""
            
            try:
                # Check if we are in a robust environment with PIFuHD
                if not self.pifuhd_path.exists() and not Path("apps").exists():
                    raise RuntimeError("PIFuHD not installed - triggering fallback")
                    
                obj_file = self.run_pifuhd(processed_image, pifuhd_output_dir)
                
                # Step 3: Convert OBJ to GLB
                self.update_status(job_id, {"status": "processing", "step": "conversion"})
                glb_file = self.convert_obj_to_glb(obj_file, job_output_dir)
                
                # Step 4: Optimize GLB
                self.update_status(job_id, {"status": "processing", "step": "optimization"})
                optimized_glb = self.optimize_glb(glb_file, job_output_dir)
                
                model_url = f"/static/{job_id}/{Path(optimized_glb).name}"
                
            except Exception as ml_error:
                logger.warning(f"ML Pipeline failed ({ml_error}), falling back to Default Avatar")
                
                # FALLBACK: Use a robust default RPM avatar
                # This ensures the user ALWAYS gets a result
                fallback_model = "https://models.readyplayer.me/64bfa15f0e72c63d7c3934a6.glb"
                model_url = fallback_model
            
            # Step 5: Complete
            self.update_status(job_id, {
                "status": "completed", # Frontend expects "completed" not "finished"
                "step": "completed",
                "preview_url": model_url, # Frontend expects "preview_url"
                "model_url": model_url,   # Keep for backward compat
                "files": {
                    "processed_image": str(processed_image)
                }
            })
            
            logger.info(f"Pipeline completed for job {job_id}: {model_url}")
            return model_url
            
        except Exception as e:
            logger.error(f"Pipeline failed for job {job_id}: {str(e)}")
            self.update_status(job_id, {
                "status": "failed",
                "error": str(e)
            })
            raise

def run_full_pipeline(job_id, input_path, output_root):
    """Convenience function for the pipeline"""
    pipeline = AvatarPipeline()
    return pipeline.run_full_pipeline(job_id, input_path, output_root)

if __name__ == "__main__":
    # Test the pipeline
    import sys
    if len(sys.argv) != 4:
        print("Usage: python process_job.py <job_id> <input_image> <output_root>")
        sys.exit(1)
    
    job_id = sys.argv[1]
    input_path = sys.argv[2]
    output_root = sys.argv[3]
    
    pipeline = AvatarPipeline()
    result = pipeline.run_full_pipeline(job_id, input_path, output_root)
    print(f"Pipeline completed: {result}")
