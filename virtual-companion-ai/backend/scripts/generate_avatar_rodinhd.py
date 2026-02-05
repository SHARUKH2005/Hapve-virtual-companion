"""
RodinHD Avatar Generator - Integration Script
Generates high-fidelity 3D avatars from photos using trained RodinHD models
"""

import sys
import os
import argparse
import torch
import numpy as np
from PIL import Image
import shutil

# Add RodinHD to Python path
RODINHD_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '../../RodinHD'))
if os.path.exists(RODINHD_PATH):
    sys.path.insert(0, RODINHD_PATH)
    print(f"[RodinHD] Using RodinHD from: {RODINHD_PATH}")
else:
    print(f"[RodinHD] ⚠️ RodinHD not found at {RODINHD_PATH}")
    print(f"[RodinHD] Using fallback avatar generation")

class RodinHDGenerator:
    """High-fidelity avatar generator using RodinHD"""
    
    def __init__(self, base_model_path=None, upsample_model_path=None):
        """
        Initialize RodinHD generator
        
        Args:
            base_model_path: Path to trained base diffusion model
            upsample_model_path: Path to trained upsample model
        """
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        self.models_loaded = False
        
        print(f"[RodinHD] Using device: {self.device}")
        
        # Try to load models if paths provided
        if base_model_path and upsample_model_path:
            try:
                self._load_models(base_model_path, upsample_model_path)
            except Exception as e:
                print(f"[RodinHD] ⚠️ Failed to load models: {e}")
                print(f"[RodinHD] Will use fallback generation")
    
    def _load_models(self, base_model_path, upsample_model_path):
        """Load trained RodinHD models"""
        print("[RodinHD] Loading models...")
        
        # Import RodinHD modules
        try:
            from scripts.base_sample import BaseDiffusionSampler
            from scripts.upsample_sample import UpsampleDiffusionSampler
            
            # Load base model
            print(f"[RodinHD] Loading base model from {base_model_path}")
            self.base_sampler = BaseDiffusionSampler(base_model_path, self.device)
            
            # Load upsample model
            print(f"[RodinHD] Loading upsample model from {upsample_model_path}")
            self.upsample_sampler = UpsampleDiffusionSampler(upsample_model_path, self.device)
            
            self.models_loaded = True
            print("[RodinHD] ✅ Models loaded successfully")
            
        except ImportError as e:
            print(f"[RodinHD] ⚠️ RodinHD modules not available: {e}")
            raise
    
    def generate_avatar(self, image_path, output_path):
        """
        Generate 3D avatar from photo
        
        Args:
            image_path: Path to input photo
            output_path: Path to save output GLB file
            
        Returns:
            bool: True if successful, False otherwise
        """
        print(f"[RodinHD] Generating avatar from {image_path}")
        
        if not self.models_loaded:
            print("[RodinHD] Models not loaded, using fallback")
            return self._fallback_generation(image_path, output_path)
        
        try:
            # Load and preprocess image
            image = self._load_image(image_path)
            
            # Generate base triplane
            print("[RodinHD] Step 1/3: Generating base triplane...")
            base_triplane = self._generate_base_triplane(image)
            
            # Upsample triplane
            print("[RodinHD] Step 2/3: Upsampling triplane...")
            high_res_triplane = self._upsample_triplane(base_triplane)
            
            # Convert to mesh
            print("[RodinHD] Step 3/3: Converting to mesh...")
            self._triplane_to_mesh(high_res_triplane, output_path)
            
            print(f"[RodinHD] ✅ Avatar generated successfully: {output_path}")
            return True
            
        except Exception as e:
            print(f"[RodinHD] ❌ Generation failed: {e}")
            print(f"[RodinHD] Falling back to default avatar")
            return self._fallback_generation(image_path, output_path)
    
    def _load_image(self, image_path):
        """Load and preprocess image"""
        image = Image.open(image_path).convert('RGB')
        image = image.resize((512, 512))
        
        # Convert to tensor
        image_array = np.array(image).astype(np.float32) / 255.0
        image_tensor = torch.from_numpy(image_array).permute(2, 0, 1).unsqueeze(0)
        image_tensor = image_tensor.to(self.device)
        
        return image_tensor
    
    def _generate_base_triplane(self, image):
        """Generate base resolution triplane"""
        with torch.no_grad():
            triplane = self.base_sampler.sample(
                image,
                num_steps=50,
                guidance_scale=7.5
            )
        return triplane
    
    def _upsample_triplane(self, base_triplane):
        """Upsample triplane to high resolution"""
        with torch.no_grad():
            high_res = self.upsample_sampler.sample(
                base_triplane,
                num_steps=50,
                guidance_scale=7.5
            )
        return high_res
    
    def _triplane_to_mesh(self, triplane, output_path):
        """Convert triplane to mesh and save as GLB"""
        from Renderer.render_utils import triplane_to_mesh
        
        mesh = triplane_to_mesh(
            triplane,
            resolution=512,
            threshold=0.0
        )
        
        # Export as GLB
        mesh.export(output_path, file_type='glb')
    
    def _fallback_generation(self, image_path, output_path):
        """Fallback to default avatar if RodinHD fails"""
        print("[RodinHD] Using default avatar fallback")
        
        # Find default avatar
        script_dir = os.path.dirname(os.path.abspath(__file__))
        default_avatar = os.path.join(script_dir, "../public/models/default_avatar.glb")
        
        if os.path.exists(default_avatar):
            shutil.copy(default_avatar, output_path)
            print(f"[RodinHD] ✅ Copied default avatar to {output_path}")
            return True
        else:
            print(f"[RodinHD] ❌ Default avatar not found at {default_avatar}")
            return False


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(description='Generate 3D avatar using RodinHD')
    parser.add_argument('--input', required=True, help='Input photo path')
    parser.add_argument('--output', required=True, help='Output GLB path')
    parser.add_argument('--base_model', help='Path to base diffusion model')
    parser.add_argument('--upsample_model', help='Path to upsample model')
    args = parser.parse_args()
    
    print("╔════════════════════════════════════════════════════════════════╗")
    print("║                                                                ║")
    print("║     RodinHD Avatar Generator                                   ║")
    print("║                                                                ║")
    print("╚════════════════════════════════════════════════════════════════╝")
    print()
    
    # Initialize generator
    generator = RodinHDGenerator(
        base_model_path=args.base_model,
        upsample_model_path=args.upsample_model
    )
    
    # Generate avatar
    success = generator.generate_avatar(args.input, args.output)
    
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
