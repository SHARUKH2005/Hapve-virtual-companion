"""
Image preprocessing utilities for face detection and alignment
"""
import cv2
import numpy as np
from PIL import Image
import mediapipe as mp
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

class ImagePreprocessor:
    """Handles image preprocessing for 3D avatar generation"""
    
    def __init__(self, target_size=1024):
        self.target_size = target_size
        self.mp_face = mp.solutions.face_mesh
        self.mp_drawing = mp.solutions.drawing_utils
        
    def detect_face_landmarks(self, image):
        """Detect face landmarks using MediaPipe"""
        with self.mp_face.FaceMesh(
            static_image_mode=True,
            max_num_faces=1,
            refine_landmarks=True,
            min_detection_confidence=0.5
        ) as face_mesh:
            
            # Convert BGR to RGB
            rgb_image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = face_mesh.process(rgb_image)
            
            return results.multi_face_landmarks[0] if results.multi_face_landmarks else None
    
    def get_face_bounding_box(self, landmarks, image_shape):
        """Get bounding box from face landmarks"""
        h, w = image_shape[:2]
        
        # Extract x, y coordinates
        xs = [landmark.x for landmark in landmarks.landmark]
        ys = [landmark.y for landmark in landmarks.landmark]
        
        # Convert to pixel coordinates
        min_x = int(min(xs) * w)
        max_x = int(max(xs) * w)
        min_y = int(min(ys) * h)
        max_y = int(max(ys) * h)
        
        return min_x, min_y, max_x, max_y
    
    def expand_bbox(self, bbox, image_shape, padding_factor=0.3):
        """Expand bounding box with padding"""
        min_x, min_y, max_x, max_y = bbox
        h, w = image_shape[:2]
        
        # Calculate padding
        width = max_x - min_x
        height = max_y - min_y
        padding = int(max(width, height) * padding_factor)
        
        # Apply padding with bounds checking
        min_x = max(0, min_x - padding)
        min_y = max(0, min_y - padding)
        max_x = min(w, max_x + padding)
        max_y = min(h, max_y + padding)
        
        return min_x, min_y, max_x, max_y
    
    def center_crop_fallback(self, image):
        """Fallback center crop when face detection fails"""
        h, w = image.shape[:2]
        
        # Make it square by taking the larger dimension
        size = max(h, w)
        
        # Calculate crop coordinates
        start_x = max(0, (w - size) // 2)
        start_y = max(0, (h - size) // 2)
        
        # Crop and resize
        crop = image[start_y:start_y + size, start_x:start_x + size]
        crop = cv2.resize(crop, (self.target_size, self.target_size))
        
        return crop
    
    def align_and_crop_face(self, input_path, output_path):
        """
        Main preprocessing function: detect face and create aligned crop
        
        Args:
            input_path: Path to input image
            output_path: Path to save processed image
            
        Returns:
            str: Path to processed image
        """
        try:
            # Load image
            image = cv2.imread(str(input_path))
            if image is None:
                raise ValueError(f"Could not load image: {input_path}")
            
            logger.info(f"Processing image: {input_path}")
            
            # Detect face landmarks
            landmarks = self.detect_face_landmarks(image)
            
            if landmarks is None:
                logger.warning(f"No face detected in {input_path}, using center crop")
                processed_image = self.center_crop_fallback(image)
            else:
                # Get face bounding box
                bbox = self.get_face_bounding_box(landmarks, image.shape)
                
                # Expand bounding box
                expanded_bbox = self.expand_bbox(bbox, image.shape)
                min_x, min_y, max_x, max_y = expanded_bbox
                
                # Crop face region
                face_crop = image[min_y:max_y, min_x:max_x]
                
                # Resize to target size
                processed_image = cv2.resize(face_crop, (self.target_size, self.target_size))
                
                logger.info(f"Face detected and cropped: {bbox} -> {expanded_bbox}")
            
            # Save processed image
            cv2.imwrite(str(output_path), processed_image)
            logger.info(f"Processed image saved: {output_path}")
            
            return str(output_path)
            
        except Exception as e:
            logger.error(f"Image preprocessing failed for {input_path}: {str(e)}")
            # Fallback to center crop
            try:
                image = cv2.imread(str(input_path))
                processed_image = self.center_crop_fallback(image)
                cv2.imwrite(str(output_path), processed_image)
                logger.info(f"Fallback processing completed: {output_path}")
                return str(output_path)
            except Exception as fallback_error:
                logger.error(f"Fallback processing also failed: {str(fallback_error)}")
                raise e
    
    def validate_image(self, image_path):
        """Validate that image is suitable for processing"""
        try:
            image = cv2.imread(str(image_path))
            if image is None:
                return False, "Could not load image"
            
            h, w = image.shape[:2]
            if h < 256 or w < 256:
                return False, "Image too small (minimum 256x256)"
            
            if h > 4096 or w > 4096:
                return False, "Image too large (maximum 4096x4096)"
            
            return True, "Image valid"
            
        except Exception as e:
            return False, f"Validation error: {str(e)}"

def preprocess_image(input_path, output_path, target_size=1024):
    """
    Convenience function for image preprocessing
    
    Args:
        input_path: Path to input image
        output_path: Path to save processed image
        target_size: Target size for processed image
        
    Returns:
        str: Path to processed image
    """
    preprocessor = ImagePreprocessor(target_size)
    return preprocessor.align_and_crop_face(input_path, output_path)

if __name__ == "__main__":
    # Test the preprocessor
    import sys
    if len(sys.argv) != 3:
        print("Usage: python util_image.py <input_image> <output_image>")
        sys.exit(1)
    
    input_path = sys.argv[1]
    output_path = sys.argv[2]
    
    preprocessor = ImagePreprocessor()
    result = preprocessor.align_and_crop_face(input_path, output_path)
    print(f"Processed image saved to: {result}")
