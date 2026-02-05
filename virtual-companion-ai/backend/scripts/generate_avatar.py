import sys
import os
import argparse
import shutil

def main():
    """
    Simplified avatar generation script.
    Always returns the default avatar since TRELLIS dependencies are not available.
    """
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="Input image path (ignored in fallback mode)")
    parser.add_argument("--output", required=True, help="Output GLB path")
    args = parser.parse_args()

    print(f"[Avatar Generator] Starting in fallback mode...")
    print(f"[Avatar Generator] Input: {args.input} (will be ignored)")
    print(f"[Avatar Generator] Output: {args.output}")

    try:
        # Path to default avatar
        script_dir = os.path.dirname(os.path.abspath(__file__))
        default_model_path = os.path.join(script_dir, "../public/models/default_avatar.glb")
        default_model_path = os.path.abspath(default_model_path)
        
        print(f"[Avatar Generator] Looking for default model at: {default_model_path}")
        
        if os.path.exists(default_model_path):
            # Copy default avatar to output location
            shutil.copy(default_model_path, args.output)
            print(f"[Avatar Generator] ✅ Successfully copied default avatar to {args.output}")
            sys.exit(0)
        else:
            print(f"[Avatar Generator] ❌ Default model not found at {default_model_path}")
            print(f"[Avatar Generator] Creating placeholder file...")
            
            # Create output directory if it doesn't exist
            os.makedirs(os.path.dirname(args.output), exist_ok=True)
            
            # Create a minimal placeholder
            with open(args.output, 'w') as f:
                f.write("GLB-PLACEHOLDER")
            
            print(f"[Avatar Generator] ⚠️ Created placeholder at {args.output}")
            sys.exit(0)
            
    except Exception as e:
        print(f"[Avatar Generator] ❌ Error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()
