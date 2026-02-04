from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query
from fastapi.responses import JSONResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from datetime import datetime, timezone, timedelta
import uuid
import requests
from typing import Optional, List
import socketio
import bcrypt

from models import (
    User, UserCreate, ProviderProfile, ProviderProfileCreate, ProviderProfileUpdate,
    Availability, AvailabilityCreate, Booking, BookingCreate, BookingUpdate,
    Review, ReviewCreate, Message, MessageCreate, MarketplaceItem,
    MarketplaceItemCreate, MarketplaceItemUpdate, UserSession,
    EventPackage, EventPackageCreate, EventPackageUpdate, PackageProvider
)

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Socket.IO setup
sio = socketio.AsyncServer(
    async_mode='asgi',
    cors_allowed_origins='*',
    logger=False,
    engineio_logger=False
)
socket_app = socketio.ASGIApp(sio, other_asgi_app=app)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Auth Helper
async def get_current_user(request: Request) -> User:
    # Check cookie first, then Authorization header
    session_token = request.cookies.get('session_token')
    if not session_token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            session_token = auth_header.split(' ')[1]
    
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    session_doc = await db.user_sessions.find_one(
        {"session_token": session_token},
        {"_id": 0}
    )
    
    if not session_doc:
        raise HTTPException(status_code=401, detail="Invalid session")
    
    expires_at = session_doc["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expired")
    
    user_doc = await db.users.find_one(
        {"user_id": session_doc["user_id"]},
        {"_id": 0}
    )
    
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# Optional auth (doesn't throw error if not authenticated)
async def get_current_user_optional(request: Request) -> Optional[User]:
    try:
        return await get_current_user(request)
    except HTTPException:
        return None

# ============ AUTH ROUTES ============

@api_router.post("/auth/register")
async def register(request: Request, response: Response):
    """Register with email and password"""
    body = await request.json()
    email = body.get('email')
    password = body.get('password')
    name = body.get('name')
    
    if not email or not password or not name:
        raise HTTPException(status_code=400, detail="Email, password and name required")
    
    # Check if user exists
    existing_user = await db.users.find_one({"email": email}, {"_id": 0})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Create user
    user_id = f"user_{uuid.uuid4().hex[:12]}"
    user_doc = {
        "user_id": user_id,
        "email": email,
        "name": name,
        "password_hash": password_hash.decode('utf-8'),
        "picture": None,
        "user_type": "client",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Return user without password
    del user_doc['password_hash']
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

@api_router.post("/auth/login")
async def login(request: Request, response: Response):
    """Login with email and password"""
    body = await request.json()
    email = body.get('email')
    password = body.get('password')
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password required")
    
    # Find user
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Check if user has password (OAuth users don't have password_hash)
    if 'password_hash' not in user_doc:
        raise HTTPException(status_code=401, detail="Please login with Google")
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user_doc['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create session
    session_token = f"session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_doc['user_id'],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    # Return user without password
    del user_doc['password_hash']
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

@api_router.post("/auth/forgot-password")
async def forgot_password(request: Request):
    """Request password reset"""
    body = await request.json()
    email = body.get('email')
    
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    # Find user
    user_doc = await db.users.find_one({"email": email}, {"_id": 0})
    if not user_doc:
        # Don't reveal if email exists
        return {"message": "If this email exists, a reset link will be sent"}
    
    # Check if user has password (OAuth users can't reset password)
    if 'password_hash' not in user_doc:
        return {"message": "If this email exists, a reset link will be sent"}
    
    # Generate reset token
    reset_token = f"reset_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    reset_doc = {
        "user_id": user_doc['user_id'],
        "reset_token": reset_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "used": False
    }
    await db.password_resets.insert_one(reset_doc)
    
    # In production, send email with reset link
    # For now, log the token
    logger.info(f"Password reset token for {email}: {reset_token}")
    
    return {
        "message": "If this email exists, a reset link will be sent",
        "reset_token": reset_token,  # Only for development - remove in production
        "reset_link": f"/reset-password?token={reset_token}"
    }

@api_router.post("/auth/reset-password")
async def reset_password(request: Request):
    """Reset password with token"""
    body = await request.json()
    token = body.get('token')
    new_password = body.get('new_password')
    
    if not token or not new_password:
        raise HTTPException(status_code=400, detail="Token and new password required")
    
    if len(new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Find reset token
    reset_doc = await db.password_resets.find_one(
        {"reset_token": token, "used": False},
        {"_id": 0}
    )
    
    if not reset_doc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiration
    expires_at = reset_doc['expires_at']
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    # Hash new password
    password_hash = bcrypt.hashpw(new_password.encode('utf-8'), bcrypt.gensalt())
    
    # Update user password
    await db.users.update_one(
        {"user_id": reset_doc['user_id']},
        {"$set": {"password_hash": password_hash.decode('utf-8')}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"reset_token": token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password reset successful"}

@api_router.post("/auth/session")
async def create_session(request: Request, response: Response):
    """Exchange session_id for session_token via Emergent Auth"""
    body = await request.json()
    session_id = body.get('session_id')
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id required")
    
    # Call Emergent auth service
    try:
        auth_response = requests.get(
            "https://demobackend.emergentagent.com/auth/v1/env/oauth/session-data",
            headers={"X-Session-ID": session_id},
            timeout=10
        )
        auth_response.raise_for_status()
        user_data = auth_response.json()
    except Exception as e:
        logger.error(f"Emergent auth error: {e}")
        raise HTTPException(status_code=401, detail="Invalid session_id")
    
    # Check if user exists
    existing_user = await db.users.find_one(
        {"email": user_data['email']},
        {"_id": 0}
    )
    
    if existing_user:
        user_id = existing_user['user_id']
        # Update user info
        await db.users.update_one(
            {"user_id": user_id},
            {"$set": {
                "name": user_data['name'],
                "picture": user_data.get('picture')
            }}
        )
    else:
        # Create new user
        user_id = f"user_{uuid.uuid4().hex[:12]}"
        user_doc = {
            "user_id": user_id,
            "email": user_data['email'],
            "name": user_data['name'],
            "picture": user_data.get('picture'),
            "user_type": "client",  # Default type
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.users.insert_one(user_doc)
    
    # Create session
    session_token = user_data['session_token']
    expires_at = datetime.now(timezone.utc) + timedelta(days=7)
    
    session_doc = {
        "user_id": user_id,
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.user_sessions.insert_one(session_doc)
    
    # Set cookie
    response.set_cookie(
        key="session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=7*24*60*60
    )
    
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

@api_router.get("/auth/me", response_model=User)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@api_router.post("/auth/logout")
async def logout(request: Request, response: Response, current_user: User = Depends(get_current_user)):
    session_token = request.cookies.get('session_token')
    if session_token:
        await db.user_sessions.delete_one({"session_token": session_token})
    response.delete_cookie("session_token", path="/")
    return {"message": "Logged out"}

@api_router.patch("/auth/profile")
async def update_user_type(user_type: str, current_user: User = Depends(get_current_user)):
    """Update user type (client/provider)"""
    if user_type not in ['client', 'provider']:
        raise HTTPException(status_code=400, detail="Invalid user type")
    
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"user_type": user_type}}
    )
    
    return {"message": "User type updated", "user_type": user_type}

@api_router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user details by user_id (requires authentication)"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

# ============ PROVIDER ROUTES ============

@api_router.post("/providers", response_model=ProviderProfile)
async def create_provider_profile(
    profile_data: ProviderProfileCreate,
    current_user: User = Depends(get_current_user)
):
    # Check if profile already exists
    existing = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Provider profile already exists")
    
    # Update user type to provider
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"user_type": "provider"}}
    )
    
    provider_id = f"provider_{uuid.uuid4().hex[:12]}"
    profile_doc = profile_data.model_dump()
    profile_doc.update({
        "provider_id": provider_id,
        "user_id": current_user.user_id,
        "verified": False,
        "rating": 0.0,
        "total_reviews": 0,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.provider_profiles.insert_one(profile_doc)
    profile_doc['created_at'] = datetime.fromisoformat(profile_doc['created_at'])
    return ProviderProfile(**profile_doc)

@api_router.get("/providers", response_model=List[ProviderProfile])
async def get_providers(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    search: Optional[str] = Query(None)
):
    query = {}
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"description": {"$regex": search, "$options": "i"}}
        ]
    
    providers = await db.provider_profiles.find(query, {"_id": 0}).to_list(100)
    for p in providers:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return [ProviderProfile(**p) for p in providers]

@api_router.get("/providers/{provider_id}", response_model=ProviderProfile)
async def get_provider(provider_id: str):
    provider = await db.provider_profiles.find_one(
        {"provider_id": provider_id},
        {"_id": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    if isinstance(provider['created_at'], str):
        provider['created_at'] = datetime.fromisoformat(provider['created_at'])
    return ProviderProfile(**provider)

@api_router.get("/providers/user/{user_id}", response_model=ProviderProfile)
async def get_provider_by_user(user_id: str):
    provider = await db.provider_profiles.find_one(
        {"user_id": user_id},
        {"_id": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    if isinstance(provider['created_at'], str):
        provider['created_at'] = datetime.fromisoformat(provider['created_at'])
    return ProviderProfile(**provider)

@api_router.patch("/providers/{provider_id}", response_model=ProviderProfile)
async def update_provider(
    provider_id: str,
    update_data: ProviderProfileUpdate,
    current_user: User = Depends(get_current_user)
):
    provider = await db.provider_profiles.find_one({"provider_id": provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    if provider['user_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.provider_profiles.update_one(
            {"provider_id": provider_id},
            {"$set": update_dict}
        )
    
    updated = await db.provider_profiles.find_one({"provider_id": provider_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return ProviderProfile(**updated)

# ============ AVAILABILITY ROUTES ============

@api_router.post("/availability")
async def set_availability(
    availability_data: AvailabilityCreate,
    current_user: User = Depends(get_current_user)
):
    # Get provider profile
    provider = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    if not provider:
        raise HTTPException(status_code=404, detail="Provider profile not found")
    
    availability_id = f"avail_{uuid.uuid4().hex[:12]}"
    avail_doc = availability_data.model_dump()
    avail_doc.update({
        "availability_id": availability_id,
        "provider_id": provider['provider_id']
    })
    
    # Check if availability already exists for this date
    existing = await db.availability.find_one({
        "provider_id": provider['provider_id'],
        "date": availability_data.date
    })
    
    if existing:
        await db.availability.update_one(
            {"provider_id": provider['provider_id'], "date": availability_data.date},
            {"$set": avail_doc}
        )
    else:
        await db.availability.insert_one(avail_doc)
    
    return {"message": "Availability updated"}

@api_router.get("/availability/{provider_id}")
async def get_availability(provider_id: str, month: Optional[str] = Query(None)):
    query = {"provider_id": provider_id}
    if month:
        # Filter by month (format: YYYY-MM)
        query["date"] = {"$regex": f"^{month}"}
    
    availabilities = await db.availability.find(query, {"_id": 0}).to_list(100)
    return availabilities

# ============ BOOKING ROUTES ============

@api_router.post("/bookings", response_model=Booking)
async def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc)
    
    booking_doc = booking_data.model_dump()
    booking_doc.update({
        "booking_id": booking_id,
        "client_id": current_user.user_id,
        "status": "pending",
        "deposit_paid": 0.0,
        "payment_status": "pending",
        "created_at": now.isoformat(),
        "updated_at": now.isoformat()
    })
    
    await db.bookings.insert_one(booking_doc)
    booking_doc['created_at'] = now
    booking_doc['updated_at'] = now
    return Booking(**booking_doc)

@api_router.get("/bookings", response_model=List[Booking])
async def get_bookings(
    current_user: User = Depends(get_current_user),
    role: Optional[str] = Query(None)  # 'client' or 'provider'
):
    if role == "provider":
        # Get provider's bookings
        provider = await db.provider_profiles.find_one(
            {"user_id": current_user.user_id},
            {"_id": 0}
        )
        if not provider:
            return []
        query = {"provider_id": provider['provider_id']}
    else:
        # Get client's bookings
        query = {"client_id": current_user.user_id}
    
    bookings = await db.bookings.find(query, {"_id": 0}).to_list(100)
    for b in bookings:
        if isinstance(b['created_at'], str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
        if isinstance(b['updated_at'], str):
            b['updated_at'] = datetime.fromisoformat(b['updated_at'])
    return [Booking(**b) for b in bookings]

@api_router.get("/bookings/{booking_id}", response_model=Booking)
async def get_booking(booking_id: str, current_user: User = Depends(get_current_user)):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if booking['client_id'] != current_user.user_id and (not provider or booking['provider_id'] != provider['provider_id']):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if isinstance(booking['created_at'], str):
        booking['created_at'] = datetime.fromisoformat(booking['created_at'])
    if isinstance(booking['updated_at'], str):
        booking['updated_at'] = datetime.fromisoformat(booking['updated_at'])
    return Booking(**booking)

@api_router.patch("/bookings/{booking_id}", response_model=Booking)
async def update_booking(
    booking_id: str,
    update_data: BookingUpdate,
    current_user: User = Depends(get_current_user)
):
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Check authorization
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if booking['client_id'] != current_user.user_id and (not provider or booking['provider_id'] != provider['provider_id']):
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.bookings.update_one(
            {"booking_id": booking_id},
            {"$set": update_dict}
        )
    
    updated = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return Booking(**updated)

# ============ REVIEW ROUTES ============

@api_router.post("/reviews", response_model=Review)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify booking exists and is completed
    booking = await db.bookings.find_one({"booking_id": review_data.booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking['client_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    if booking['status'] != 'completed':
        raise HTTPException(status_code=400, detail="Can only review completed bookings")
    
    # Check if review already exists
    existing = await db.reviews.find_one({"booking_id": review_data.booking_id})
    if existing:
        raise HTTPException(status_code=400, detail="Review already exists for this booking")
    
    review_id = f"review_{uuid.uuid4().hex[:12]}"
    review_doc = review_data.model_dump()
    review_doc.update({
        "review_id": review_id,
        "client_id": current_user.user_id,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.reviews.insert_one(review_doc)
    
    # Update provider rating
    reviews = await db.reviews.find({"provider_id": review_data.provider_id}, {"_id": 0}).to_list(1000)
    avg_rating = sum(r['rating'] for r in reviews) / len(reviews)
    await db.provider_profiles.update_one(
        {"provider_id": review_data.provider_id},
        {"$set": {"rating": round(avg_rating, 1), "total_reviews": len(reviews)}}
    )
    
    review_doc['created_at'] = datetime.fromisoformat(review_doc['created_at'])
    return Review(**review_doc)

@api_router.get("/reviews/{provider_id}", response_model=List[Review])
async def get_provider_reviews(provider_id: str):
    reviews = await db.reviews.find({"provider_id": provider_id}, {"_id": 0}).to_list(100)
    for r in reviews:
        if isinstance(r['created_at'], str):
            r['created_at'] = datetime.fromisoformat(r['created_at'])
    return [Review(**r) for r in reviews]

# ============ MESSAGING ROUTES ============

@api_router.post("/messages", response_model=Message)
async def send_message(
    message_data: MessageCreate,
    current_user: User = Depends(get_current_user)
):
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    message_doc = message_data.model_dump()
    message_doc.update({
        "message_id": message_id,
        "sender_id": current_user.user_id,
        "read": False,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.messages.insert_one(message_doc)
    message_doc['created_at'] = datetime.fromisoformat(message_doc['created_at'])
    
    # Emit socket event
    await sio.emit('new_message', message_doc, room=message_data.receiver_id)
    
    return Message(**message_doc)

@api_router.get("/messages/conversations")
async def get_conversations(current_user: User = Depends(get_current_user)):
    """Get list of users the current user has conversations with"""
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user.user_id},
            {"receiver_id": current_user.user_id}
        ]},
        {"_id": 0}
    ).to_list(1000)
    
    # Get unique user IDs
    user_ids = set()
    for msg in messages:
        if msg['sender_id'] != current_user.user_id:
            user_ids.add(msg['sender_id'])
        if msg['receiver_id'] != current_user.user_id:
            user_ids.add(msg['receiver_id'])
    
    # Get user details
    users = []
    for user_id in user_ids:
        user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0})
        if user_doc:
            if isinstance(user_doc['created_at'], str):
                user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
            users.append(User(**user_doc))
    
    return users

@api_router.get("/messages/recent")
async def get_recent_messages(current_user: User = Depends(get_current_user)):
    """Get 5 most recent messages with sender info and unread count"""
    # Get recent messages (received by current user)
    recent_messages = await db.messages.find(
        {"receiver_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).limit(5).to_list(5)
    
    # Get total unread count
    unread_count = await db.messages.count_documents({
        "receiver_id": current_user.user_id,
        "read": False
    })
    
    # Enrich messages with sender info
    enriched_messages = []
    for msg in recent_messages:
        sender = await db.users.find_one({"user_id": msg['sender_id']}, {"_id": 0, "password_hash": 0})
        if sender:
            # Check if sender is a provider
            provider = await db.provider_profiles.find_one({"user_id": msg['sender_id']}, {"_id": 0})
            enriched_messages.append({
                "message_id": msg['message_id'],
                "content": msg['content'][:100] + "..." if len(msg['content']) > 100 else msg['content'],
                "read": msg['read'],
                "created_at": msg['created_at'],
                "sender": {
                    "user_id": sender['user_id'],
                    "name": sender['name'],
                    "picture": sender.get('picture'),
                    "business_name": provider['business_name'] if provider else None
                }
            })
    
    return {
        "messages": enriched_messages,
        "unread_count": unread_count
    }

@api_router.get("/messages/{other_user_id}", response_model=List[Message])
async def get_messages(
    other_user_id: str,
    current_user: User = Depends(get_current_user)
):
    messages = await db.messages.find(
        {"$or": [
            {"sender_id": current_user.user_id, "receiver_id": other_user_id},
            {"sender_id": other_user_id, "receiver_id": current_user.user_id}
        ]},
        {"_id": 0}
    ).sort("created_at", 1).to_list(1000)
    
    # Mark as read
    await db.messages.update_many(
        {"sender_id": other_user_id, "receiver_id": current_user.user_id, "read": False},
        {"$set": {"read": True}}
    )
    
    for m in messages:
        if isinstance(m['created_at'], str):
            m['created_at'] = datetime.fromisoformat(m['created_at'])
    return [Message(**m) for m in messages]

# ============ MARKETPLACE ROUTES ============

@api_router.post("/marketplace", response_model=MarketplaceItem)
async def create_marketplace_item(
    item_data: MarketplaceItemCreate,
    current_user: User = Depends(get_current_user)
):
    # Verify user is a provider
    if current_user.user_type != 'provider':
        raise HTTPException(status_code=403, detail="Only providers can sell items")
    
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    item_doc = item_data.model_dump()
    item_doc.update({
        "item_id": item_id,
        "seller_id": current_user.user_id,
        "available": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    })
    
    await db.marketplace_items.insert_one(item_doc)
    item_doc['created_at'] = datetime.fromisoformat(item_doc['created_at'])
    return MarketplaceItem(**item_doc)

@api_router.get("/marketplace", response_model=List[MarketplaceItem])
async def get_marketplace_items(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    rental: Optional[bool] = Query(None)
):
    query = {"available": True}
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if rental is not None:
        query["rental_available"] = rental
    
    items = await db.marketplace_items.find(query, {"_id": 0}).to_list(100)
    for item in items:
        if isinstance(item['created_at'], str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
    return [MarketplaceItem(**item) for item in items]

@api_router.get("/marketplace/{item_id}", response_model=MarketplaceItem)
async def get_marketplace_item(item_id: str):
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if isinstance(item['created_at'], str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    return MarketplaceItem(**item)

@api_router.patch("/marketplace/{item_id}", response_model=MarketplaceItem)
async def update_marketplace_item(
    item_id: str,
    update_data: MarketplaceItemUpdate,
    current_user: User = Depends(get_current_user)
):
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.marketplace_items.update_one(
            {"item_id": item_id},
            {"$set": update_dict}
        )
    
    updated = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return MarketplaceItem(**updated)

@api_router.delete("/marketplace/{item_id}")
async def delete_marketplace_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Item not found")
    if item['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.marketplace_items.delete_one({"item_id": item_id})
    return {"message": "Item deleted"}

# ============ EVENT PACKAGES ROUTES ============

@api_router.post("/packages", response_model=EventPackage)
async def create_package(
    package_data: EventPackageCreate,
    current_user: User = Depends(get_current_user)
):
    # Only admins or verified providers can create packages
    if current_user.user_type not in ['admin', 'provider']:
        raise HTTPException(status_code=403, detail="Only providers can create packages")
    
    # Fetch provider details
    providers = []
    for provider_id in package_data.provider_ids:
        provider = await db.provider_profiles.find_one({"provider_id": provider_id}, {"_id": 0})
        if provider:
            providers.append(PackageProvider(
                provider_id=provider['provider_id'],
                business_name=provider['business_name'],
                category=provider['category'],
                services=provider['services']
            ))
    
    if len(providers) == 0:
        raise HTTPException(status_code=400, detail="No valid providers found")
    
    # Calculate discount percentage
    discount_pct = int(((package_data.original_price - package_data.discounted_price) / package_data.original_price) * 100)
    
    package_id = f"pkg_{uuid.uuid4().hex[:12]}"
    package_doc = {
        "package_id": package_id,
        "name": package_data.name,
        "description": package_data.description,
        "event_type": package_data.event_type,
        "providers": [p.model_dump() for p in providers],
        "original_price": package_data.original_price,
        "discounted_price": package_data.discounted_price,
        "discount_percentage": discount_pct,
        "services_included": package_data.services_included,
        "image_url": package_data.image_url,
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.event_packages.insert_one(package_doc)
    package_doc['created_at'] = datetime.fromisoformat(package_doc['created_at'])
    return EventPackage(**package_doc)

@api_router.get("/packages", response_model=List[EventPackage])
async def get_packages(event_type: Optional[str] = Query(None)):
    query = {"is_active": True}
    if event_type:
        query["event_type"] = event_type
    
    packages = await db.event_packages.find(query, {"_id": 0}).to_list(100)
    for p in packages:
        if isinstance(p['created_at'], str):
            p['created_at'] = datetime.fromisoformat(p['created_at'])
    return [EventPackage(**p) for p in packages]

@api_router.get("/packages/{package_id}", response_model=EventPackage)
async def get_package(package_id: str):
    package = await db.event_packages.find_one({"package_id": package_id}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    if isinstance(package['created_at'], str):
        package['created_at'] = datetime.fromisoformat(package['created_at'])
    return EventPackage(**package)

@api_router.patch("/packages/{package_id}", response_model=EventPackage)
async def update_package(
    package_id: str,
    update_data: EventPackageUpdate,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type not in ['admin', 'provider']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    package = await db.event_packages.find_one({"package_id": package_id}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        await db.event_packages.update_one(
            {"package_id": package_id},
            {"$set": update_dict}
        )
    
    updated = await db.event_packages.find_one({"package_id": package_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    return EventPackage(**updated)

@api_router.post("/packages/{package_id}/book", response_model=Booking)
async def book_package(
    package_id: str,
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user)
):
    # Get package
    package = await db.event_packages.find_one({"package_id": package_id}, {"_id": 0})
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    
    # Create a booking for each provider in the package
    now = datetime.now(timezone.utc)
    booking_ids = []
    
    for provider in package['providers']:
        booking_id = f"booking_{uuid.uuid4().hex[:12]}"
        booking_doc = {
            "booking_id": booking_id,
            "client_id": current_user.user_id,
            "provider_id": provider['provider_id'],
            "event_type": booking_data.event_type,
            "event_date": booking_data.event_date,
            "event_location": booking_data.event_location,
            "status": "pending",
            "total_amount": booking_data.total_amount / len(package['providers']),  # Split amount
            "deposit_paid": 0.0,
            "payment_status": "pending",
            "notes": f"Pack: {package['name']} - {booking_data.notes or ''}",
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        await db.bookings.insert_one(booking_doc)
        booking_ids.append(booking_id)
    
    # Return first booking as reference
    first_booking = await db.bookings.find_one({"booking_id": booking_ids[0]}, {"_id": 0})
    first_booking['created_at'] = now
    first_booking['updated_at'] = now
    return Booking(**first_booking)

# ============ ADMIN ROUTES ============

@api_router.get("/admin/stats")
async def get_admin_stats(current_user: User = Depends(get_current_user)):
    if current_user.user_type != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    total_users = await db.users.count_documents({})
    total_providers = await db.provider_profiles.count_documents({})
    total_bookings = await db.bookings.count_documents({})
    total_revenue = await db.bookings.aggregate([
        {"$group": {"_id": None, "total": {"$sum": "$deposit_paid"}}}
    ]).to_list(1)
    
    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue[0]['total'] if total_revenue else 0
    }

@api_router.patch("/admin/providers/{provider_id}/verify")
async def verify_provider(
    provider_id: str,
    verified: bool,
    current_user: User = Depends(get_current_user)
):
    if current_user.user_type != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    
    await db.provider_profiles.update_one(
        {"provider_id": provider_id},
        {"$set": {"verified": verified}}
    )
    
    return {"message": "Provider verification updated"}

# Socket.IO events
@sio.event
async def connect(sid, environ):
    logger.info(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    logger.info(f"Client {sid} disconnected")

@sio.event
async def join_room(sid, data):
    user_id = data.get('user_id')
    sio.enter_room(sid, user_id)
    logger.info(f"Client {sid} joined room {user_id}")

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
