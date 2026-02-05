import requests
import os
import time
import logging
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

class HeyGenService:
    """
    HeyGen integration for high-quality talking avatars.
    Handles cloud-based video generation and streaming to save local CPU/GPU.
    """
    def __init__(self):
        self.api_key = os.getenv("HEYGEN_API_KEY")
        self.base_url = "https://api.heygen.com/v2"
        self.headers = {
            "X-Api-Key": self.api_key,
            "Content-Type": "application/json"
        }

    def create_talking_video(self, avatar_image_url, text_content):
        """
        Creates a talking video from an image and text.
        """
        if not self.api_key:
            return {"error": "HeyGen API Key is missing"}

        endpoint = f"{self.base_url}/video/generate"
        
        payload = {
            "video_inputs": [
                {
                    "character": {
                        "type": "talking_photo",
                        "talking_photo_url": avatar_image_url
                    },
                    "input_text": text_content,
                    "voice": {
                        "type": "text",
                        "input_text": text_content,
                        "voice_id": "en-US-JennyNeural" # Default professional voice
                    }
                }
            ],
            "dimension": "720p"
        }

        try:
            logger.info("Requesting HeyGen talking video generation...")
            response = requests.post(endpoint, json=payload, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            video_id = data.get("data", {}).get("video_id")
            logger.info(f"HeyGen Video ID: {video_id}")
            return {"video_id": video_id, "status": "processing"}
            
        except Exception as e:
            logger.error(f"HeyGen API Error: {str(e)}")
            return {"error": str(e)}

    def get_video_status(self, video_id):
        """
        Check if the video is ready.
        """
        endpoint = f"{self.base_url}/video/{video_id}"
        try:
            response = requests.get(endpoint, headers=self.headers)
            response.raise_for_status()
            data = response.json()
            
            status = data.get("data", {}).get("status")
            video_url = data.get("data", {}).get("video_url")
            
            return {
                "status": status,
                "video_url": video_url
            }
        except Exception as e:
            logger.error(f"HeyGen Status Sync Error: {str(e)}")
            return {"error": str(e)}

# Singleton instance
heygen_service = HeyGenService()
