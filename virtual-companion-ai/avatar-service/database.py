"""
Database models and configuration for Hapve backend
"""

from sqlalchemy import (
    create_engine,
    Column,
    String,
    Integer,
    Boolean,
    DateTime,
    Float,
    Text
)
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime
import os

# Database configuration
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "sqlite:///./hapve.db"  # Use SQLite as fallback/default 
)

# Connect args needed for SQLite only
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

# Create engine
engine = create_engine(DATABASE_URL, connect_args=connect_args, pool_pre_ping=True)

# Create session
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


class User(Base):
    """User model"""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    wallet_address = Column(String(42), unique=True, index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_login = Column(DateTime)
    total_avatars = Column(Integer, default=0)
    total_mints = Column(Integer, default=0)
    
    def __repr__(self):
        return f"<User {self.wallet_address}>"


class Job(Base):
    """Job model for avatar generation"""
    __tablename__ = "jobs"
    
    id = Column(String(36), primary_key=True, index=True)  # UUID
    user_address = Column(String(42), index=True)
    
    # Job status
    status = Column(
        String(20),
        default="queued",
        index=True
    )  # queued, processing, completed, failed, deleted
    progress = Column(Float, default=0)  # 0-100
    
    # Input
    file_path = Column(String(255))
    style = Column(String(20), default="realistic")
    consent_given = Column(Boolean, default=False)
    
    # Output
    metadata_cid = Column(String(100))
    glb_cid = Column(String(100))
    thumbnail_cid = Column(String(100))
    preview_url = Column(String(255))
    
    # NFT data
    token_id = Column(Integer)
    tx_hash = Column(String(66))
    minted = Column(Boolean, default=False)
    minted_at = Column(DateTime)
    
    # Error handling
    error_message = Column(Text)
    retry_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, onupdate=datetime.utcnow)
    
    def __repr__(self):
        return f"<Job {self.id} - {self.status}>"


class Nonce(Base):
    """Nonce model for SIWE authentication"""
    __tablename__ = "nonces"
    
    id = Column(Integer, primary_key=True, index=True)
    nonce = Column(String(64), unique=True, index=True, nullable=False)
    wallet_address = Column(String(42), index=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    used = Column(Boolean, default=False)
    used_at = Column(DateTime)
    
    def __repr__(self):
        return f"<Nonce {self.nonce[:8]}... for {self.wallet_address}>"


class MintNonce(Base):
    """Nonce model for gasless minting (relayer)"""
    __tablename__ = "mint_nonces"
    
    id = Column(Integer, primary_key=True, index=True)
    nonce = Column(String(64), unique=True, index=True, nullable=False)
    wallet_address = Column(String(42), index=True, nullable=False)
    job_id = Column(String(36), index=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    used = Column(Boolean, default=False)
    
    def __repr__(self):
        return f"<MintNonce {self.nonce} for {self.wallet_address}>"


class Analytics(Base):
    """Analytics model for tracking platform metrics"""
    __tablename__ = "analytics"
    
    id = Column(Integer, primary_key=True, index=True)
    event_type = Column(String(50), index=True)  # upload, mint, transfer, etc.
    user_address = Column(String(42), index=True)
    data = Column(Text)  # JSON data
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    
    def __repr__(self):
        return f"<Analytics {self.event_type} at {self.timestamp}>"


# Create all tables
def init_db():
    """Initialize database tables"""
    Base.metadata.create_all(bind=engine)
    print("Database tables created successfully")


# Database dependency for FastAPI
def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


if __name__ == "__main__":
    init_db()
