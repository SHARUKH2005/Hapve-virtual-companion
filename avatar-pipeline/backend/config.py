"""
Configuration settings for the 3D Avatar Generation Pipeline
"""
import os
from pathlib import Path

class Config:
    """Configuration class for the avatar generation pipeline"""
    
    # Base paths
    BASE_DIR = Path(__file__).parent.parent
    BACKEND_DIR = BASE_DIR / "backend"
    FRONTEND_DIR = BASE_DIR / "frontend"
    PIFUHD_DIR = BASE_DIR / "pifuhd"
    BLENDER_SCRIPTS_DIR = BASE_DIR / "blender-scripts"
    
    # Data directories
    UPLOAD_DIR = BASE_DIR / "uploads"
    MODELS_DIR = BASE_DIR / "models"
    STATUS_DIR = BASE_DIR / "status"
    
    # Redis configuration
    REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
    REDIS_DB = int(os.getenv("REDIS_DB", 0))
    REDIS_URL = f"redis://{REDIS_HOST}:{REDIS_PORT}/{REDIS_DB}"
    
    # FastAPI configuration
    API_HOST = os.getenv("API_HOST", "0.0.0.0")
    API_PORT = int(os.getenv("API_PORT", 8000))
    API_DEBUG = os.getenv("API_DEBUG", "false").lower() == "true"
    
    # Image processing settings
    IMAGE_TARGET_SIZE = int(os.getenv("IMAGE_TARGET_SIZE", 1024))
    IMAGE_MAX_SIZE = int(os.getenv("IMAGE_MAX_SIZE", 4096))
    IMAGE_MIN_SIZE = int(os.getenv("IMAGE_MIN_SIZE", 256))
    IMAGE_MAX_FILE_SIZE = int(os.getenv("IMAGE_MAX_FILE_SIZE", 10 * 1024 * 1024))  # 10MB
    
    # PIFuHD settings
    PIFUHD_RESOLUTION = int(os.getenv("PIFUHD_RESOLUTION", 512))
    PIFUHD_TIMEOUT = int(os.getenv("PIFUHD_TIMEOUT", 1800))  # 30 minutes
    PIFUHD_USE_RECT = os.getenv("PIFUHD_USE_RECT", "true").lower() == "true"
    
    # Blender settings
    BLENDER_PATH = os.getenv("BLENDER_PATH", "blender")
    BLENDER_TIMEOUT = int(os.getenv("BLENDER_TIMEOUT", 300))  # 5 minutes
    DECIMATE_RATIO = float(os.getenv("DECIMATE_RATIO", 0.25))
    TARGET_TRIANGLES = int(os.getenv("TARGET_TRIANGLES", 50000))
    
    # Job queue settings
    JOB_TIMEOUT = int(os.getenv("JOB_TIMEOUT", 1800))  # 30 minutes
    MAX_CONCURRENT_JOBS = int(os.getenv("MAX_CONCURRENT_JOBS", 2))
    POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", 2))  # seconds
    
    # Security settings
    ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000").split(",")
    ENABLE_CORS = os.getenv("ENABLE_CORS", "true").lower() == "true"
    
    # Storage settings
    USE_CLOUD_STORAGE = os.getenv("USE_CLOUD_STORAGE", "false").lower() == "true"
    AWS_S3_BUCKET = os.getenv("AWS_S3_BUCKET", "")
    AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
    
    # Logging settings
    LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO")
    LOG_FILE = os.getenv("LOG_FILE", "avatar_pipeline.log")
    
    # Performance settings
    ENABLE_GPU = os.getenv("ENABLE_GPU", "true").lower() == "true"
    GPU_MEMORY_FRACTION = float(os.getenv("GPU_MEMORY_FRACTION", 0.8))
    
    # Quality settings
    ENABLE_LODS = os.getenv("ENABLE_LODS", "false").lower() == "true"
    LOD_LEVELS = [0.5, 0.25, 0.1]  # Decimation ratios for LODs
    
    # Privacy settings
    REQUIRE_CONSENT = os.getenv("REQUIRE_CONSENT", "true").lower() == "true"
    AUTO_DELETE_AFTER_HOURS = int(os.getenv("AUTO_DELETE_AFTER_HOURS", 24))
    
    @classmethod
    def create_directories(cls):
        """Create necessary directories"""
        for directory in [cls.UPLOAD_DIR, cls.MODELS_DIR, cls.STATUS_DIR]:
            directory.mkdir(parents=True, exist_ok=True)
    
    @classmethod
    def validate_config(cls):
        """Validate configuration settings"""
        errors = []
        
        # Check if PIFuHD directory exists
        if not cls.PIFUHD_DIR.exists():
            errors.append(f"PIFuHD directory not found: {cls.PIFUHD_DIR}")
        
        # Check if Blender is available
        import shutil
        if not shutil.which(cls.BLENDER_PATH):
            errors.append(f"Blender not found at: {cls.BLENDER_PATH}")
        
        # Validate numeric settings
        if cls.IMAGE_TARGET_SIZE < cls.IMAGE_MIN_SIZE:
            errors.append(f"IMAGE_TARGET_SIZE ({cls.IMAGE_TARGET_SIZE}) must be >= IMAGE_MIN_SIZE ({cls.IMAGE_MIN_SIZE})")
        
        if cls.DECIMATE_RATIO <= 0 or cls.DECIMATE_RATIO > 1:
            errors.append(f"DECIMATE_RATIO ({cls.DECIMATE_RATIO}) must be between 0 and 1")
        
        if errors:
            raise ValueError("Configuration validation failed:\n" + "\n".join(errors))
        
        return True

# Environment-specific configurations
class DevelopmentConfig(Config):
    """Development configuration"""
    API_DEBUG = True
    LOG_LEVEL = "DEBUG"
    PIFUHD_RESOLUTION = 256  # Lower resolution for faster development
    DECIMATE_RATIO = 0.5  # Less aggressive decimation

class ProductionConfig(Config):
    """Production configuration"""
    API_DEBUG = False
    LOG_LEVEL = "INFO"
    PIFUHD_RESOLUTION = 512
    DECIMATE_RATIO = 0.25
    ENABLE_LODS = True
    REQUIRE_CONSENT = True

class TestingConfig(Config):
    """Testing configuration"""
    API_DEBUG = True
    LOG_LEVEL = "DEBUG"
    PIFUHD_RESOLUTION = 128  # Very low resolution for testing
    DECIMATE_RATIO = 0.8  # Minimal decimation
    JOB_TIMEOUT = 300  # 5 minutes for testing

# Configuration factory
def get_config():
    """Get configuration based on environment"""
    env = os.getenv("ENVIRONMENT", "development").lower()
    
    if env == "production":
        return ProductionConfig()
    elif env == "testing":
        return TestingConfig()
    else:
        return DevelopmentConfig()

# Global config instance
config = get_config()
