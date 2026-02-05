"""
SIWE (Sign-In With Ethereum) authentication module
"""

from fastapi import APIRouter, HTTPException, Depends, Header
from pydantic import BaseModel
from sqlalchemy.orm import Session
from eth_account.messages import encode_defunct
from web3 import Web3
import secrets
from datetime import datetime, timedelta
import jwt
import os
import logging
from typing import Optional

# Changed relative imports to absolute
from database import get_db, Nonce, User

logger = logging.getLogger(__name__)

router = APIRouter()

# JWT configuration
JWT_SECRET = os.getenv("JWT_SECRET", "your-secret-key-change-in-production")
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Web3 instance
w3 = Web3()


class NonceRequest(BaseModel):
    """Request model for nonce generation"""
    address: str


class NonceResponse(BaseModel):
    """Response model for nonce"""
    nonce: str
    message: str


class VerifyRequest(BaseModel):
    """Request model for signature verification"""
    address: str
    signature: str
    message: str


class VerifyResponse(BaseModel):
    """Response model for verification"""
    token: str
    address: str
    expires_at: str


@router.post("/nonce", response_model=NonceResponse)
async def get_nonce(request: NonceRequest, db: Session = Depends(get_db)):
    """
    Generate a nonce for SIWE authentication
    """
    address = request.address.lower()
    
    # Validate Ethereum address
    if not w3.is_address(address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    
    # Generate secure nonce
    nonce_value = secrets.token_hex(32)
    
    # Create nonce record
    nonce = Nonce(
        nonce=nonce_value,
        wallet_address=address
    )
    db.add(nonce)
    db.commit()
    
    # Create SIWE message
    message = f"""Hapve wants you to sign in with your Ethereum account:
{address}

Welcome to Hapve - Your Decentralized AI Avatar Platform!

URI: https://hapve.ai
Version: 1
Chain ID: 137
Nonce: {nonce_value}
Issued At: {datetime.utcnow().isoformat()}"""
    
    logger.info(f"Nonce generated for {address}")
    
    return NonceResponse(
        nonce=nonce_value,
        message=message
    )


@router.post("/verify", response_model=VerifyResponse)
async def verify_signature(request: VerifyRequest, db: Session = Depends(get_db)):
    """
    Verify SIWE signature and issue JWT token
    """
    address = request.address.lower()
    
    # Validate Ethereum address
    if not w3.is_address(address):
        raise HTTPException(status_code=400, detail="Invalid Ethereum address")
    
    # Extract nonce from message
    try:
        # Simplistic parsing, robust SIWE parsing recommended for production
        nonce_line = [line for line in request.message.split('\n') if 'Nonce:' in line][0]
        nonce_value = nonce_line.split('Nonce: ')[1].strip()
    except (IndexError, Exception):
        raise HTTPException(status_code=400, detail="Invalid message format")
    
    # Verify nonce exists and is unused
    nonce = db.query(Nonce).filter(
        Nonce.nonce == nonce_value,
        Nonce.wallet_address == address,
        Nonce.used == False
    ).first()
    
    if not nonce:
        raise HTTPException(
            status_code=400,
            detail="Invalid or expired nonce"
        )
    
    # Check nonce age (expire after 5 minutes)
    nonce_age = datetime.utcnow() - nonce.created_at
    if nonce_age > timedelta(minutes=5):
        raise HTTPException(
            status_code=400,
            detail="Nonce expired. Please request a new one."
        )
    
    # Verify signature
    try:
        message_hash = encode_defunct(text=request.message)
        recovered_address = w3.eth.account.recover_message(
            message_hash,
            signature=request.signature
        )
        
        if recovered_address.lower() != address:
            raise HTTPException(
                status_code=401,
                detail="Signature verification failed"
            )
    except Exception as e:
        logger.error(f"Signature verification error: {str(e)}")
        raise HTTPException(
            status_code=401,
            detail="Invalid signature"
        )
    
    # Mark nonce as used
    nonce.used = True
    nonce.used_at = datetime.utcnow()
    db.commit()
    
    # Create or update user
    user = db.query(User).filter(User.wallet_address == address).first()
    if not user:
        user = User(wallet_address=address)
        db.add(user)
    
    user.last_login = datetime.utcnow()
    db.commit()
    
    # Generate JWT token
    expiration = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    token_data = {
        "address": address,
        "exp": expiration,
        "iat": datetime.utcnow()
    }
    
    token = jwt.encode(token_data, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    logger.info(f"User authenticated: {address}")
    
    return VerifyResponse(
        token=token,
        address=address,
        expires_at=expiration.isoformat()
    )


# Dependency to verify token
def verify_token(authorization: Optional[str] = Header(None)):
    """
    Dependency to verify JWT token
    """
    if not authorization:
        raise HTTPException(
            status_code=401,
            detail="Authorization header missing"
        )
    
    try:
        # Extract token from "Bearer <token>"
        scheme, token = authorization.split()
        if scheme.lower() != "bearer":
            raise HTTPException(
                status_code=401,
                detail="Invalid authentication scheme"
            )
        
        # Decode and verify token
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
        
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=401,
            detail="Token expired"
        )
    except jwt.InvalidTokenError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Authentication failed"
        )

@router.get("/me")
async def get_current_user(token_data: dict = Depends(verify_token), db: Session = Depends(get_db)):
    """
    Get current authenticated user
    """
    return {
        "address": token_data["address"],
        "authenticated": True
    }

@router.post("/logout")
async def logout():
    """
    Logout endpoint (client should delete token)
    """
    return {
        "message": "Logged out successfully",
        "note": "Please delete the token from client storage"
    }
