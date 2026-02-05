from pydantic import BaseModel
from typing import Optional, List, Dict, Any

class UploadResponse(BaseModel):
    job_id: str
    status: str
    message: str
    estimated_time: str
    preview_url: Optional[str] = None

class JobStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    created_at: str
    updated_at: Optional[str] = None
    metadata_cid: Optional[str] = None
    glb_cid: Optional[str] = None
    thumbnail_cid: Optional[str] = None
    preview_url: Optional[str] = None
    error_message: Optional[str] = None

class UserAvatarsResponse(BaseModel):
    user_address: str
    total_avatars: int
    avatars: List[Dict[str, Any]]

class MintRequest(BaseModel):
    job_id: str
    token_id: int
    tx_hash: str

class MintResponse(BaseModel):
    message: str
    job_id: str
    token_id: int
    tx_hash: str
