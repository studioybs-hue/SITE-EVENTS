from fastapi import FastAPI, APIRouter, HTTPException, Request, Response, Depends, Query, UploadFile, File
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
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
import base64
import aiofiles
import mimetypes

from models import (
    User, UserCreate, UserUpdate, UserPreferences, NotificationSettings,
    ProviderProfile, ProviderProfileCreate, ProviderProfileUpdate,
    Availability, AvailabilityCreate, Booking, BookingCreate, BookingUpdate,
    Review, ReviewCreate, Message, MessageCreate, MarketplaceItem,
    MarketplaceItemCreate, MarketplaceItemUpdate, MarketplaceInquiry, MarketplaceInquiryCreate,
    UserSession, EventPackage, EventPackageCreate, EventPackageUpdate, PackageProvider,
    Service, ServiceCreate, ServiceUpdate, ServiceOption,
    QuoteRequest, QuoteRequestCreate, QuoteRequestUpdate, QuoteServiceItem,
    MessageAttachment, Notification, FavoriteProvider, FavoriteProviderCreate,
    PaymentTransaction, PaymentTransactionCreate
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

@api_router.post("/auth/change-password")
async def change_password(
    current_password: str,
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    """Change user password"""
    # Get user with password hash
    user_doc = await db.users.find_one({"user_id": current_user.user_id})
    if not user_doc:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Check if user has a password (might be Google OAuth only)
    if 'password_hash' not in user_doc or not user_doc['password_hash']:
        raise HTTPException(
            status_code=400, 
            detail="Votre compte utilise la connexion Google. Vous ne pouvez pas définir de mot de passe."
        )
    
    # Verify current password
    if not bcrypt.checkpw(current_password.encode(), user_doc['password_hash'].encode()):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères")
    
    # Hash and save new password
    new_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"password_hash": new_hash}}
    )
    
    return {"message": "Mot de passe modifié avec succès"}

@api_router.post("/auth/set-password")
async def set_password(
    new_password: str,
    current_user: User = Depends(get_current_user)
):
    """Set password for OAuth users who don't have one"""
    user_doc = await db.users.find_one({"user_id": current_user.user_id})
    
    # Check if user already has a password
    if user_doc.get('password_hash'):
        raise HTTPException(
            status_code=400, 
            detail="Vous avez déjà un mot de passe. Utilisez la fonction de changement de mot de passe."
        )
    
    # Validate new password
    if len(new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
    
    # Hash and save password
    password_hash = bcrypt.hashpw(new_password.encode(), bcrypt.gensalt()).decode()
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"password_hash": password_hash}}
    )
    
    return {"message": "Mot de passe défini avec succès"}

@api_router.get("/users/{user_id}", response_model=User)
async def get_user_by_id(user_id: str, current_user: User = Depends(get_current_user)):
    """Get user details by user_id (requires authentication)"""
    user_doc = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found")
    
    if isinstance(user_doc['created_at'], str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    return User(**user_doc)

@api_router.patch("/users/me", response_model=User)
async def update_current_user(
    update_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update current user's profile"""
    update_dict = {}
    
    if update_data.name is not None:
        update_dict["name"] = update_data.name
    if update_data.phone is not None:
        update_dict["phone"] = update_data.phone
    if update_data.picture is not None:
        update_dict["picture"] = update_data.picture
    if update_data.preferences is not None:
        update_dict["preferences"] = update_data.preferences.model_dump()
    if update_data.notification_settings is not None:
        update_dict["notification_settings"] = update_data.notification_settings.model_dump()
    
    if update_dict:
        await db.users.update_one(
            {"user_id": current_user.user_id},
            {"$set": update_dict}
        )
    
    updated_user = await db.users.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0, "password_hash": 0}
    )
    
    if isinstance(updated_user['created_at'], str):
        updated_user['created_at'] = datetime.fromisoformat(updated_user['created_at'])
    
    return User(**updated_user)

@api_router.post("/users/me/avatar")
async def upload_avatar(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload user avatar/profile picture"""
    content = await file.read()
    
    if len(content) > 5 * 1024 * 1024:  # 5MB limit for avatars
        raise HTTPException(status_code=400, detail="Image trop volumineuse (max 5MB)")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        raise HTTPException(status_code=400, detail="Format d'image non supporté")
    
    # Generate unique filename
    file_id = f"avatar_{current_user.user_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = UPLOAD_DIR / file_id
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Update user with new avatar URL
    avatar_url = f"/api/files/{file_id}"
    await db.users.update_one(
        {"user_id": current_user.user_id},
        {"$set": {"picture": avatar_url}}
    )
    
    return {"picture": avatar_url}

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
    
    bookings = await db.bookings.find(query, {"_id": 0}).sort("event_date", 1).to_list(100)
    
    # Enrich bookings with names if missing
    for b in bookings:
        if isinstance(b['created_at'], str):
            b['created_at'] = datetime.fromisoformat(b['created_at'])
        if isinstance(b['updated_at'], str):
            b['updated_at'] = datetime.fromisoformat(b['updated_at'])
        
        # Add provider name if missing
        if not b.get('provider_name'):
            provider_doc = await db.provider_profiles.find_one({"provider_id": b['provider_id']}, {"_id": 0})
            b['provider_name'] = provider_doc['business_name'] if provider_doc else 'Prestataire'
        
        # Add client name if missing
        if not b.get('client_name'):
            client_doc = await db.users.find_one({"user_id": b['client_id']}, {"_id": 0})
            b['client_name'] = client_doc['name'] if client_doc else 'Client'
        
        # Ensure services field exists
        if 'services' not in b:
            b['services'] = []
        if 'deposit_required' not in b:
            b['deposit_required'] = round(b.get('total_amount', 0) * 0.3, 2)
            
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

# ============ SERVICE/PRESTATION ROUTES ============

@api_router.post("/services", response_model=Service)
async def create_service(
    service_data: ServiceCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new service/prestation for a provider"""
    # Get provider profile
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Provider profile required")
    
    # Get max display order
    max_order = await db.services.find_one(
        {"provider_id": provider['provider_id']},
        sort=[("display_order", -1)]
    )
    next_order = (max_order['display_order'] + 1) if max_order else 0
    
    service_id = f"svc_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    service_doc = service_data.model_dump()
    service_doc.update({
        "service_id": service_id,
        "provider_id": provider['provider_id'],
        "is_active": True,
        "display_order": next_order,
        "created_at": now,
        "updated_at": now
    })
    
    await db.services.insert_one(service_doc)
    
    service_doc['created_at'] = datetime.fromisoformat(service_doc['created_at'])
    service_doc['updated_at'] = datetime.fromisoformat(service_doc['updated_at'])
    return Service(**service_doc)

@api_router.get("/services/provider/{provider_id}", response_model=List[Service])
async def get_provider_services(provider_id: str, include_inactive: bool = False):
    """Get all services for a provider"""
    query = {"provider_id": provider_id}
    if not include_inactive:
        query["is_active"] = True
    
    services = await db.services.find(query, {"_id": 0}).sort("display_order", 1).to_list(100)
    for s in services:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
        if isinstance(s['updated_at'], str):
            s['updated_at'] = datetime.fromisoformat(s['updated_at'])
    return [Service(**s) for s in services]

@api_router.get("/services/me", response_model=List[Service])
async def get_my_services(
    include_inactive: bool = True,
    current_user: User = Depends(get_current_user)
):
    """Get all services for the current provider"""
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Provider profile required")
    
    query = {"provider_id": provider['provider_id']}
    if not include_inactive:
        query["is_active"] = True
    
    services = await db.services.find(query, {"_id": 0}).sort("display_order", 1).to_list(100)
    for s in services:
        if isinstance(s['created_at'], str):
            s['created_at'] = datetime.fromisoformat(s['created_at'])
        if isinstance(s['updated_at'], str):
            s['updated_at'] = datetime.fromisoformat(s['updated_at'])
    return [Service(**s) for s in services]

@api_router.get("/services/{service_id}", response_model=Service)
async def get_service(service_id: str):
    """Get a specific service"""
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    if isinstance(service['created_at'], str):
        service['created_at'] = datetime.fromisoformat(service['created_at'])
    if isinstance(service['updated_at'], str):
        service['updated_at'] = datetime.fromisoformat(service['updated_at'])
    return Service(**service)

@api_router.patch("/services/{service_id}", response_model=Service)
async def update_service(
    service_id: str,
    update_data: ServiceUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a service"""
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Verify ownership
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider or service['provider_id'] != provider['provider_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.services.update_one(
            {"service_id": service_id},
            {"$set": update_dict}
        )
    
    updated = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return Service(**updated)

@api_router.delete("/services/{service_id}")
async def delete_service(
    service_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a service"""
    service = await db.services.find_one({"service_id": service_id}, {"_id": 0})
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    # Verify ownership
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider or service['provider_id'] != provider['provider_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    await db.services.delete_one({"service_id": service_id})
    return {"message": "Service deleted"}

@api_router.post("/services/reorder")
async def reorder_services(
    service_orders: List[dict],  # [{"service_id": "xxx", "display_order": 0}, ...]
    current_user: User = Depends(get_current_user)
):
    """Reorder services by updating display_order"""
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Provider profile required")
    
    for item in service_orders:
        await db.services.update_one(
            {"service_id": item['service_id'], "provider_id": provider['provider_id']},
            {"$set": {"display_order": item['display_order'], "updated_at": datetime.now(timezone.utc).isoformat()}}
        )
    
    return {"message": "Services reordered"}

# ============ QUOTE REQUEST ROUTES ============

@api_router.post("/quotes", response_model=QuoteRequest)
async def create_quote_request(
    quote_data: QuoteRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new quote request from client to provider"""
    # Verify provider exists
    provider = await db.provider_profiles.find_one({"provider_id": quote_data.provider_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=404, detail="Provider not found")
    
    quote_id = f"quote_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    quote_doc = quote_data.model_dump()
    quote_doc.update({
        "quote_id": quote_id,
        "client_id": current_user.user_id,
        "status": "pending",
        "response_message": None,
        "response_amount": None,
        "created_at": now,
        "updated_at": now
    })
    
    await db.quote_requests.insert_one(quote_doc)
    
    # Send notification message to provider
    message_id = f"msg_{uuid.uuid4().hex[:12]}"
    services_list = "\n• ".join([s.title for s in quote_data.services])
    notification_content = f"📋 Nouvelle demande de devis !\n\nType: {quote_data.event_type}\nDate: {quote_data.event_date}\nLieu: {quote_data.event_location}\n\nPrestations demandées:\n• {services_list}"
    if quote_data.message:
        notification_content += f"\n\nMessage: {quote_data.message}"
    
    await db.messages.insert_one({
        "message_id": message_id,
        "sender_id": current_user.user_id,
        "receiver_id": provider['user_id'],
        "content": notification_content,
        "read": False,
        "created_at": now
    })
    
    quote_doc['created_at'] = datetime.fromisoformat(quote_doc['created_at'])
    quote_doc['updated_at'] = datetime.fromisoformat(quote_doc['updated_at'])
    return QuoteRequest(**quote_doc)

@api_router.get("/quotes/received", response_model=List[QuoteRequest])
async def get_received_quotes(current_user: User = Depends(get_current_user)):
    """Get all quote requests received by a provider"""
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider:
        raise HTTPException(status_code=403, detail="Provider profile required")
    
    quotes = await db.quote_requests.find(
        {"provider_id": provider['provider_id']},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for q in quotes:
        if isinstance(q['created_at'], str):
            q['created_at'] = datetime.fromisoformat(q['created_at'])
        if isinstance(q['updated_at'], str):
            q['updated_at'] = datetime.fromisoformat(q['updated_at'])
    
    return [QuoteRequest(**q) for q in quotes]

@api_router.get("/quotes/sent", response_model=List[QuoteRequest])
async def get_sent_quotes(current_user: User = Depends(get_current_user)):
    """Get all quote requests sent by a client"""
    quotes = await db.quote_requests.find(
        {"client_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for q in quotes:
        if isinstance(q['created_at'], str):
            q['created_at'] = datetime.fromisoformat(q['created_at'])
        if isinstance(q['updated_at'], str):
            q['updated_at'] = datetime.fromisoformat(q['updated_at'])
    
    return [QuoteRequest(**q) for q in quotes]

@api_router.patch("/quotes/{quote_id}", response_model=QuoteRequest)
async def respond_to_quote(
    quote_id: str,
    update_data: QuoteRequestUpdate,
    current_user: User = Depends(get_current_user)
):
    """Provider responds to a quote request with price"""
    quote = await db.quote_requests.find_one({"quote_id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Verify ownership (must be the provider)
    provider = await db.provider_profiles.find_one({"user_id": current_user.user_id}, {"_id": 0})
    if not provider or quote['provider_id'] != provider['provider_id']:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if update_dict:
        update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.quote_requests.update_one(
            {"quote_id": quote_id},
            {"$set": update_dict}
        )
    
    updated = await db.quote_requests.find_one({"quote_id": quote_id}, {"_id": 0})
    if isinstance(updated['created_at'], str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated['updated_at'], str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return QuoteRequest(**updated)

@api_router.post("/quotes/{quote_id}/accept")
async def client_accept_quote(
    quote_id: str,
    current_user: User = Depends(get_current_user)
):
    """Client accepts a quote - creates a confirmed booking"""
    quote = await db.quote_requests.find_one({"quote_id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Verify ownership (must be the client)
    if quote['client_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if quote['status'] != 'responded':
        raise HTTPException(status_code=400, detail="Can only accept responded quotes")
    
    now = datetime.now(timezone.utc).isoformat()
    
    # Update quote status
    await db.quote_requests.update_one(
        {"quote_id": quote_id},
        {"$set": {"status": "accepted", "updated_at": now}}
    )
    
    # Get provider info
    provider = await db.provider_profiles.find_one({"provider_id": quote['provider_id']}, {"_id": 0})
    provider_name = provider['business_name'] if provider else 'Prestataire'
    
    # Create a confirmed booking from the quote
    booking_id = f"booking_{uuid.uuid4().hex[:12]}"
    total_amount = quote.get('response_amount', 0)
    deposit_required = round(total_amount * 0.3, 2)  # 30% deposit
    
    booking_doc = {
        "booking_id": booking_id,
        "client_id": quote['client_id'],
        "provider_id": quote['provider_id'],
        "quote_id": quote_id,
        "event_type": quote['event_type'],
        "event_date": quote['event_date'],
        "event_location": quote['event_location'],
        "status": "confirmed",
        "total_amount": total_amount,
        "deposit_required": deposit_required,
        "deposit_paid": 0.0,
        "payment_status": "pending",
        "services": quote.get('services', []),
        "notes": quote.get('message', ''),
        "provider_name": provider_name,
        "client_name": current_user.name,
        "created_at": now,
        "updated_at": now
    }
    
    await db.bookings.insert_one(booking_doc)
    
    # Block the date for the provider
    await db.availability.update_one(
        {"provider_id": quote['provider_id'], "date": quote['event_date']},
        {"$set": {
            "availability_id": f"avail_{uuid.uuid4().hex[:12]}",
            "provider_id": quote['provider_id'],
            "date": quote['event_date'],
            "is_available": False,
            "notes": f"Réservé: {quote['event_type']}"
        }},
        upsert=True
    )
    
    # Notify provider via message
    if provider:
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        await db.messages.insert_one({
            "message_id": message_id,
            "sender_id": current_user.user_id,
            "receiver_id": provider['user_id'],
            "content": f"🎉 Réservation confirmée !\n\n{current_user.name} a accepté votre devis de {total_amount}€ pour {quote['event_type']} le {quote['event_date']} à {quote['event_location']}.\n\nUn acompte de {deposit_required}€ (30%) est demandé pour finaliser la réservation.\n\nRéférence: {booking_id}",
            "read": False,
            "created_at": now
        })
    
    return {
        "message": "Quote accepted and booking created",
        "status": "accepted",
        "booking_id": booking_id,
        "total_amount": total_amount,
        "deposit_required": deposit_required
    }

@api_router.post("/quotes/{quote_id}/decline")
async def client_decline_quote(
    quote_id: str,
    current_user: User = Depends(get_current_user)
):
    """Client declines a quote"""
    quote = await db.quote_requests.find_one({"quote_id": quote_id}, {"_id": 0})
    if not quote:
        raise HTTPException(status_code=404, detail="Quote not found")
    
    # Verify ownership (must be the client)
    if quote['client_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    if quote['status'] != 'responded':
        raise HTTPException(status_code=400, detail="Can only decline responded quotes")
    
    now = datetime.now(timezone.utc).isoformat()
    await db.quote_requests.update_one(
        {"quote_id": quote_id},
        {"$set": {"status": "declined", "updated_at": now}}
    )
    
    return {"message": "Quote declined", "status": "declined"}

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
    
    # Prepare response
    response_doc = message_doc.copy()
    response_doc['created_at'] = datetime.fromisoformat(message_doc['created_at'])
    
    # Emit via Socket.IO if receiver is connected
    receiver_id = message_data.receiver_id
    if receiver_id in connected_users:
        await sio.emit('new_message', message_doc, room=receiver_id)
    
    return Message(**response_doc)

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
        raise HTTPException(status_code=403, detail="Seuls les prestataires peuvent vendre des articles")
    
    item_id = f"item_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    item_doc = item_data.model_dump()
    item_doc.update({
        "item_id": item_id,
        "seller_id": current_user.user_id,
        "seller_name": current_user.name,
        "status": "available",
        "available": True,
        "views_count": 0,
        "inquiries_count": 0,
        "created_at": now,
        "updated_at": now
    })
    
    await db.marketplace_items.insert_one(item_doc)
    item_doc['created_at'] = datetime.fromisoformat(item_doc['created_at'])
    item_doc['updated_at'] = datetime.fromisoformat(item_doc['updated_at'])
    return MarketplaceItem(**item_doc)

@api_router.get("/marketplace", response_model=List[MarketplaceItem])
async def get_marketplace_items(
    category: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    rental: Optional[bool] = Query(None),
    status: Optional[str] = Query(None)
):
    query = {}
    if status:
        query["status"] = status
    else:
        query["status"] = {"$in": ["available", "reserved"]}  # Hide sold items by default
    if category:
        query["category"] = category
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    if rental is not None:
        query["rental_available"] = rental
    
    items = await db.marketplace_items.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return [MarketplaceItem(**item) for item in items]

@api_router.get("/marketplace/my-items", response_model=List[MarketplaceItem])
async def get_my_marketplace_items(
    current_user: User = Depends(get_current_user)
):
    """Get all items for the current seller (including sold items)"""
    items = await db.marketplace_items.find(
        {"seller_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for item in items:
        if isinstance(item.get('created_at'), str):
            item['created_at'] = datetime.fromisoformat(item['created_at'])
        if isinstance(item.get('updated_at'), str):
            item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return [MarketplaceItem(**item) for item in items]

@api_router.get("/marketplace/{item_id}", response_model=MarketplaceItem)
async def get_marketplace_item(item_id: str):
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Increment view count
    await db.marketplace_items.update_one(
        {"item_id": item_id},
        {"$inc": {"views_count": 1}}
    )
    
    if isinstance(item.get('created_at'), str):
        item['created_at'] = datetime.fromisoformat(item['created_at'])
    if isinstance(item.get('updated_at'), str):
        item['updated_at'] = datetime.fromisoformat(item['updated_at'])
    return MarketplaceItem(**item)

@api_router.patch("/marketplace/{item_id}", response_model=MarketplaceItem)
async def update_marketplace_item(
    item_id: str,
    update_data: MarketplaceItemUpdate,
    current_user: User = Depends(get_current_user)
):
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if item['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    update_dict["updated_at"] = datetime.now(timezone.utc).isoformat()
    
    # Handle status changes
    if 'status' in update_dict:
        if update_dict['status'] == 'sold':
            update_dict['available'] = False
        elif update_dict['status'] == 'available':
            update_dict['available'] = True
    
    if update_dict:
        await db.marketplace_items.update_one(
            {"item_id": item_id},
            {"$set": update_dict}
        )
    
    updated = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if isinstance(updated.get('created_at'), str):
        updated['created_at'] = datetime.fromisoformat(updated['created_at'])
    if isinstance(updated.get('updated_at'), str):
        updated['updated_at'] = datetime.fromisoformat(updated['updated_at'])
    return MarketplaceItem(**updated)

@api_router.delete("/marketplace/{item_id}")
async def delete_marketplace_item(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    if item['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.marketplace_items.delete_one({"item_id": item_id})
    # Also delete related inquiries
    await db.marketplace_inquiries.delete_many({"item_id": item_id})
    return {"message": "Article supprimé"}

# ============ MARKETPLACE INQUIRIES ROUTES ============

@api_router.post("/marketplace/{item_id}/inquiries")
async def create_inquiry(
    item_id: str,
    inquiry_data: MarketplaceInquiryCreate,
    current_user: User = Depends(get_current_user)
):
    """Send an inquiry about a marketplace item"""
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    if item['seller_id'] == current_user.user_id:
        raise HTTPException(status_code=400, detail="Vous ne pouvez pas contacter votre propre annonce")
    
    inquiry_id = f"inq_{uuid.uuid4().hex[:12]}"
    inquiry_doc = {
        "inquiry_id": inquiry_id,
        "item_id": item_id,
        "item_title": item['title'],
        "buyer_id": current_user.user_id,
        "buyer_name": current_user.name,
        "seller_id": item['seller_id'],
        "message": inquiry_data.message,
        "inquiry_type": inquiry_data.inquiry_type,
        "offer_amount": inquiry_data.offer_amount,
        "rental_dates": inquiry_data.rental_dates,
        "status": "pending",
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.marketplace_inquiries.insert_one(inquiry_doc)
    
    # Increment inquiry count
    await db.marketplace_items.update_one(
        {"item_id": item_id},
        {"$inc": {"inquiries_count": 1}}
    )
    
    return {"message": "Message envoyé", "inquiry_id": inquiry_id}

@api_router.get("/marketplace/{item_id}/inquiries")
async def get_item_inquiries(
    item_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get inquiries for an item (seller only)"""
    item = await db.marketplace_items.find_one({"item_id": item_id}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    if item['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    inquiries = await db.marketplace_inquiries.find(
        {"item_id": item_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return inquiries

@api_router.get("/marketplace-inquiries/received")
async def get_received_inquiries(
    current_user: User = Depends(get_current_user)
):
    """Get all inquiries received by the current user (seller)"""
    inquiries = await db.marketplace_inquiries.find(
        {"seller_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return inquiries

@api_router.get("/marketplace-inquiries/sent")
async def get_sent_inquiries(
    current_user: User = Depends(get_current_user)
):
    """Get all inquiries sent by the current user (buyer)"""
    inquiries = await db.marketplace_inquiries.find(
        {"buyer_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return inquiries

@api_router.patch("/marketplace-inquiries/{inquiry_id}")
async def update_inquiry_status(
    inquiry_id: str,
    status: str,
    current_user: User = Depends(get_current_user)
):
    """Update inquiry status (seller only)"""
    inquiry = await db.marketplace_inquiries.find_one({"inquiry_id": inquiry_id}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Message non trouvé")
    
    if inquiry['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    if status not in ['pending', 'replied', 'accepted', 'declined']:
        raise HTTPException(status_code=400, detail="Statut invalide")
    
    await db.marketplace_inquiries.update_one(
        {"inquiry_id": inquiry_id},
        {"$set": {"status": status}}
    )
    
    # If accepted, update item status to reserved
    if status == 'accepted':
        await db.marketplace_items.update_one(
            {"item_id": inquiry['item_id']},
            {"$set": {"status": "reserved"}}
        )
    
    return {"message": "Statut mis à jour"}

# ============ MARKETPLACE PAYMENT ============

@api_router.post("/marketplace/payment/create-checkout")
async def create_marketplace_checkout(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Create a Stripe checkout session for marketplace item purchase"""
    body = await request.json()
    inquiry_id = body.get('inquiry_id')
    origin_url = body.get('origin_url')
    
    if not inquiry_id or not origin_url:
        raise HTTPException(status_code=400, detail="inquiry_id and origin_url required")
    
    # Fetch inquiry
    inquiry = await db.marketplace_inquiries.find_one({"inquiry_id": inquiry_id}, {"_id": 0})
    if not inquiry:
        raise HTTPException(status_code=404, detail="Offre non trouvée")
    
    # Verify buyer owns this inquiry
    if inquiry['buyer_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Check inquiry is accepted
    if inquiry.get('status') != 'accepted':
        raise HTTPException(status_code=400, detail="Cette offre n'a pas encore été acceptée")
    
    # Fetch item
    item = await db.marketplace_items.find_one({"item_id": inquiry['item_id']}, {"_id": 0})
    if not item:
        raise HTTPException(status_code=404, detail="Article non trouvé")
    
    # Determine amount (offer amount if exists, otherwise item price)
    amount = inquiry.get('offer_amount') or item['price']
    amount = round(float(amount), 2)
    
    # Initialize Stripe
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Paiement non configuré")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    success_url = f"{origin_url}/marketplace/payment/success?inquiry_id={inquiry_id}"
    cancel_url = f"{origin_url}/marketplace"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    transaction_id = f"mkt_txn_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    metadata = {
        "type": "marketplace",
        "inquiry_id": inquiry_id,
        "item_id": inquiry['item_id'],
        "buyer_id": current_user.user_id,
        "seller_id": inquiry['seller_id'],
        "transaction_id": transaction_id
    }
    
    try:
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction
        transaction_doc = {
            "transaction_id": transaction_id,
            "type": "marketplace",
            "inquiry_id": inquiry_id,
            "item_id": inquiry['item_id'],
            "buyer_id": current_user.user_id,
            "seller_id": inquiry['seller_id'],
            "session_id": session.session_id,
            "amount": amount,
            "currency": "eur",
            "payment_status": "pending",
            "item_title": item['title'],
            "created_at": now,
            "updated_at": now
        }
        await db.marketplace_transactions.insert_one(transaction_doc)
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "transaction_id": transaction_id,
            "amount": amount
        }
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur de paiement: {str(e)}")

@api_router.get("/marketplace/payment/status/{inquiry_id}")
async def get_marketplace_payment_status(
    inquiry_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Check marketplace payment status"""
    # Find transaction
    transaction = await db.marketplace_transactions.find_one(
        {"inquiry_id": inquiry_id},
        {"_id": 0}
    )
    
    if not transaction:
        return {"status": "not_found", "paid": False}
    
    # Verify ownership
    if transaction['buyer_id'] != current_user.user_id and transaction['seller_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # If already paid, return cached status
    if transaction['payment_status'] == 'paid':
        return {
            "status": "paid",
            "paid": True,
            "amount": transaction['amount'],
            "item_title": transaction['item_title']
        }
    
    # Poll Stripe for status
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key or not transaction.get('session_id'):
        return {"status": transaction['payment_status'], "paid": False}
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(transaction['session_id'])
        
        if checkout_status.payment_status == "paid":
            # Update transaction
            await db.marketplace_transactions.update_one(
                {"inquiry_id": inquiry_id},
                {"$set": {
                    "payment_status": "paid",
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # Update item status to sold
            await db.marketplace_items.update_one(
                {"item_id": transaction['item_id']},
                {"$set": {"status": "sold"}}
            )
            
            # Update inquiry status
            await db.marketplace_inquiries.update_one(
                {"inquiry_id": inquiry_id},
                {"$set": {"status": "paid"}}
            )
            
            return {
                "status": "paid",
                "paid": True,
                "amount": transaction['amount'],
                "item_title": transaction['item_title']
            }
    except Exception as e:
        logger.error(f"Error checking payment: {e}")
    
    return {"status": transaction['payment_status'], "paid": False}

# ============ MARKETPLACE IMAGE UPLOAD ============

@api_router.post("/marketplace/upload-image")
async def upload_marketplace_image(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload an image for a marketplace item"""
    content = await file.read()
    
    if len(content) > 5 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image trop volumineuse (max 5MB)")
    
    ext = Path(file.filename).suffix.lower()
    if ext not in ['.jpg', '.jpeg', '.png', '.gif', '.webp']:
        raise HTTPException(status_code=400, detail="Format d'image non supporté")
    
    file_id = f"marketplace_{current_user.user_id}_{uuid.uuid4().hex[:8]}{ext}"
    file_path = UPLOAD_DIR / file_id
    
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    image_url = f"/api/files/{file_id}"
    return {"image_url": image_url}

# ============ FAVORITES ROUTES ============

@api_router.get("/favorites")
async def get_favorites(current_user: User = Depends(get_current_user)):
    """Get all favorite providers for current user"""
    favorites = await db.favorites.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Enrich with current provider data
    for fav in favorites:
        provider = await db.provider_profiles.find_one(
            {"provider_id": fav['provider_id']},
            {"_id": 0}
        )
        if provider:
            fav['provider_name'] = provider.get('business_name', fav.get('provider_name'))
            fav['provider_category'] = provider.get('category', fav.get('provider_category'))
            fav['provider_picture'] = provider.get('profile_image')
            fav['provider_rating'] = provider.get('rating', 0.0)
            fav['provider_location'] = provider.get('location')
            fav['provider_verified'] = provider.get('verified', False)
    
    return favorites

@api_router.post("/favorites")
async def add_favorite(
    favorite_data: FavoriteProviderCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a provider to favorites"""
    # Check if already favorited
    existing = await db.favorites.find_one({
        "user_id": current_user.user_id,
        "provider_id": favorite_data.provider_id
    })
    
    if existing:
        raise HTTPException(status_code=400, detail="Ce prestataire est déjà dans vos favoris")
    
    # Get provider info
    provider = await db.provider_profiles.find_one(
        {"provider_id": favorite_data.provider_id},
        {"_id": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Prestataire non trouvé")
    
    favorite_id = f"fav_{uuid.uuid4().hex[:12]}"
    favorite_doc = {
        "favorite_id": favorite_id,
        "user_id": current_user.user_id,
        "provider_id": favorite_data.provider_id,
        "provider_name": provider.get('business_name', ''),
        "provider_category": provider.get('category', ''),
        "provider_picture": provider.get('profile_image'),
        "provider_rating": provider.get('rating', 0.0),
        "alert_availability": favorite_data.alert_availability,
        "notes": favorite_data.notes,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.favorites.insert_one(favorite_doc)
    
    return {"message": "Ajouté aux favoris", "favorite_id": favorite_id}

@api_router.delete("/favorites/{provider_id}")
async def remove_favorite(
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Remove a provider from favorites"""
    result = await db.favorites.delete_one({
        "user_id": current_user.user_id,
        "provider_id": provider_id
    })
    
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Favori non trouvé")
    
    return {"message": "Retiré des favoris"}

@api_router.get("/favorites/check/{provider_id}")
async def check_favorite(
    provider_id: str,
    current_user: User = Depends(get_current_user)
):
    """Check if a provider is in favorites"""
    favorite = await db.favorites.find_one({
        "user_id": current_user.user_id,
        "provider_id": provider_id
    })
    
    return {"is_favorite": favorite is not None}

@api_router.patch("/favorites/{provider_id}")
async def update_favorite(
    provider_id: str,
    alert_availability: Optional[bool] = None,
    notes: Optional[str] = None,
    current_user: User = Depends(get_current_user)
):
    """Update favorite settings (alerts, notes)"""
    update_dict = {}
    if alert_availability is not None:
        update_dict["alert_availability"] = alert_availability
    if notes is not None:
        update_dict["notes"] = notes
    
    if update_dict:
        result = await db.favorites.update_one(
            {"user_id": current_user.user_id, "provider_id": provider_id},
            {"$set": update_dict}
        )
        
        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Favori non trouvé")
    
    return {"message": "Favori mis à jour"}

@api_router.get("/favorites/with-alerts")
async def get_favorites_with_alerts(current_user: User = Depends(get_current_user)):
    """Get favorites that have availability alerts enabled"""
    favorites = await db.favorites.find(
        {"user_id": current_user.user_id, "alert_availability": True},
        {"_id": 0}
    ).to_list(100)
    
    return favorites

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

# ============ PAYMENT ROUTES (STRIPE) ============

from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

@api_router.post("/payments/create-checkout")
async def create_checkout_session(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """
    Create a Stripe checkout session for booking payment.
    Supports full payment, deposit, or installment payments.
    """
    body = await request.json()
    booking_id = body.get('booking_id')
    payment_type = body.get('payment_type', 'full')  # full, deposit, installment
    installment_number = body.get('installment_number', 1)
    total_installments = body.get('total_installments', 1)
    origin_url = body.get('origin_url')
    
    if not booking_id or not origin_url:
        raise HTTPException(status_code=400, detail="booking_id and origin_url required")
    
    # Fetch booking
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    # Verify user owns this booking
    if booking['client_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # Check booking status
    if booking['status'] not in ['confirmed', 'pending']:
        raise HTTPException(status_code=400, detail="Cannot pay for this booking status")
    
    # Calculate amount based on payment type
    total_amount = float(booking['total_amount'])
    deposit_required = float(booking.get('deposit_required', total_amount * 0.3))
    deposit_paid = float(booking.get('deposit_paid', 0))
    remaining = total_amount - deposit_paid
    
    if payment_type == 'full':
        # Pay full remaining amount
        amount = remaining
    elif payment_type == 'deposit':
        # Pay deposit (30% of total)
        amount = min(deposit_required - deposit_paid, remaining)
    elif payment_type == 'installment':
        # Calculate installment amount
        if total_installments == 2:
            # 2x payment: 50% each
            amount = remaining / 2
        elif total_installments == 3:
            # 3x payment: ~33% each
            amount = remaining / 3
        else:
            amount = remaining
    else:
        raise HTTPException(status_code=400, detail="Invalid payment type")
    
    # Ensure amount is positive
    if amount <= 0:
        raise HTTPException(status_code=400, detail="Nothing to pay")
    
    # Round to 2 decimals
    amount = round(amount, 2)
    
    # Initialize Stripe
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    
    # Build webhook and redirect URLs
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    success_url = f"{origin_url}/payment/success?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/dashboard"
    
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    # Create transaction record BEFORE creating checkout session
    transaction_id = f"txn_{uuid.uuid4().hex[:12]}"
    now = datetime.now(timezone.utc).isoformat()
    
    # Metadata for tracking
    metadata = {
        "booking_id": booking_id,
        "user_id": current_user.user_id,
        "payment_type": payment_type,
        "transaction_id": transaction_id
    }
    if payment_type == 'installment':
        metadata["installment_number"] = str(installment_number)
        metadata["total_installments"] = str(total_installments)
    
    try:
        # Create Stripe checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="eur",
            success_url=success_url,
            cancel_url=cancel_url,
            metadata=metadata
        )
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in database
        transaction_doc = {
            "transaction_id": transaction_id,
            "booking_id": booking_id,
            "user_id": current_user.user_id,
            "session_id": session.session_id,
            "amount": amount,
            "currency": "eur",
            "payment_type": payment_type,
            "installment_number": installment_number if payment_type == 'installment' else None,
            "total_installments": total_installments if payment_type == 'installment' else None,
            "payment_status": "pending",
            "metadata": metadata,
            "created_at": now,
            "updated_at": now
        }
        await db.payment_transactions.insert_one(transaction_doc)
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "transaction_id": transaction_id,
            "amount": amount
        }
    except Exception as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment error: {str(e)}")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(
    session_id: str,
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Check payment status and update booking if paid"""
    # Find transaction
    transaction = await db.payment_transactions.find_one(
        {"session_id": session_id},
        {"_id": 0}
    )
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Verify ownership
    if transaction['user_id'] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    
    # If already processed, return cached status
    if transaction['payment_status'] in ['paid', 'failed', 'refunded']:
        return {
            "status": transaction['payment_status'],
            "amount": transaction['amount'],
            "booking_id": transaction['booking_id']
        }
    
    # Poll Stripe for status
    api_key = os.environ.get('STRIPE_API_KEY')
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        new_status = "pending"
        if checkout_status.payment_status == "paid":
            new_status = "paid"
        elif checkout_status.status == "expired":
            new_status = "expired"
        
        # Update transaction if status changed
        if new_status != transaction['payment_status']:
            await db.payment_transactions.update_one(
                {"session_id": session_id},
                {"$set": {
                    "payment_status": new_status,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # If paid, update booking
            if new_status == "paid":
                booking = await db.bookings.find_one(
                    {"booking_id": transaction['booking_id']},
                    {"_id": 0}
                )
                if booking:
                    new_deposit_paid = float(booking.get('deposit_paid', 0)) + transaction['amount']
                    total_amount = float(booking['total_amount'])
                    
                    # Determine new payment status
                    if new_deposit_paid >= total_amount:
                        booking_payment_status = "paid"
                    elif new_deposit_paid >= float(booking.get('deposit_required', total_amount * 0.3)):
                        booking_payment_status = "partial"
                    else:
                        booking_payment_status = "pending"
                    
                    await db.bookings.update_one(
                        {"booking_id": transaction['booking_id']},
                        {"$set": {
                            "deposit_paid": new_deposit_paid,
                            "payment_status": booking_payment_status,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
                    
                    # Send notification message to provider
                    provider = await db.provider_profiles.find_one(
                        {"provider_id": booking['provider_id']},
                        {"_id": 0}
                    )
                    if provider:
                        message_id = f"msg_{uuid.uuid4().hex[:12]}"
                        payment_msg = f"💳 Paiement reçu !\n\n{current_user.name} a effectué un paiement de {transaction['amount']}€"
                        if transaction['payment_type'] == 'installment':
                            payment_msg += f" (versement {transaction['installment_number']}/{transaction['total_installments']})"
                        payment_msg += f"\n\nRéférence: {transaction['booking_id']}\nTotal payé: {new_deposit_paid}€ / {total_amount}€"
                        
                        await db.messages.insert_one({
                            "message_id": message_id,
                            "sender_id": current_user.user_id,
                            "receiver_id": provider['user_id'],
                            "content": payment_msg,
                            "read": False,
                            "created_at": datetime.now(timezone.utc).isoformat()
                        })
        
        return {
            "status": new_status,
            "payment_status": checkout_status.payment_status,
            "amount": transaction['amount'],
            "booking_id": transaction['booking_id']
        }
    except Exception as e:
        logger.error(f"Error checking payment status: {e}")
        return {
            "status": transaction['payment_status'],
            "amount": transaction['amount'],
            "booking_id": transaction['booking_id']
        }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    api_key = os.environ.get('STRIPE_API_KEY')
    if not api_key:
        raise HTTPException(status_code=500, detail="Payment not configured")
    
    host_url = str(request.base_url).rstrip('/')
    webhook_url = f"{host_url}/api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=api_key, webhook_url=webhook_url)
    
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Process webhook event
        if webhook_response.payment_status == "paid":
            session_id = webhook_response.session_id
            
            # Find and update transaction
            transaction = await db.payment_transactions.find_one(
                {"session_id": session_id},
                {"_id": 0}
            )
            
            if transaction and transaction['payment_status'] != 'paid':
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {"$set": {
                        "payment_status": "paid",
                        "updated_at": datetime.now(timezone.utc).isoformat()
                    }}
                )
                
                # Update booking
                booking = await db.bookings.find_one(
                    {"booking_id": transaction['booking_id']},
                    {"_id": 0}
                )
                if booking:
                    new_deposit_paid = float(booking.get('deposit_paid', 0)) + transaction['amount']
                    total_amount = float(booking['total_amount'])
                    
                    if new_deposit_paid >= total_amount:
                        booking_payment_status = "paid"
                    elif new_deposit_paid >= float(booking.get('deposit_required', total_amount * 0.3)):
                        booking_payment_status = "partial"
                    else:
                        booking_payment_status = "pending"
                    
                    await db.bookings.update_one(
                        {"booking_id": transaction['booking_id']},
                        {"$set": {
                            "deposit_paid": new_deposit_paid,
                            "payment_status": booking_payment_status,
                            "updated_at": datetime.now(timezone.utc).isoformat()
                        }}
                    )
        
        return {"status": "received"}
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}

@api_router.get("/payments/booking/{booking_id}")
async def get_booking_payments(
    booking_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get all payment transactions for a booking"""
    # Verify booking ownership
    booking = await db.bookings.find_one({"booking_id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    
    if booking['client_id'] != current_user.user_id:
        # Check if user is the provider
        provider = await db.provider_profiles.find_one(
            {"user_id": current_user.user_id},
            {"_id": 0}
        )
        if not provider or booking['provider_id'] != provider['provider_id']:
            raise HTTPException(status_code=403, detail="Not authorized")
    
    transactions = await db.payment_transactions.find(
        {"booking_id": booking_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    return transactions

# ============ FILE UPLOAD ROUTES ============

UPLOAD_DIR = ROOT_DIR / 'uploads'
UPLOAD_DIR.mkdir(exist_ok=True)
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {
    'image': ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
    'document': ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.txt'],
    'contract': ['.pdf', '.doc', '.docx']
}

def get_file_type(filename: str) -> str:
    """Determine file type from extension"""
    ext = Path(filename).suffix.lower()
    for file_type, extensions in ALLOWED_EXTENSIONS.items():
        if ext in extensions:
            return file_type
    return 'document'

@api_router.post("/upload-file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload a file and return its URL"""
    # Check file size by reading content
    content = await file.read()
    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail="Le fichier est trop volumineux (max 10MB)")
    
    # Validate extension
    ext = Path(file.filename).suffix.lower()
    all_extensions = [e for exts in ALLOWED_EXTENSIONS.values() for e in exts]
    if ext not in all_extensions:
        raise HTTPException(status_code=400, detail=f"Type de fichier non autorisé: {ext}")
    
    # Generate unique filename
    file_id = f"file_{uuid.uuid4().hex[:12]}"
    safe_filename = f"{file_id}{ext}"
    file_path = UPLOAD_DIR / safe_filename
    
    # Save file
    async with aiofiles.open(file_path, 'wb') as f:
        await f.write(content)
    
    # Get file info
    file_type = get_file_type(file.filename)
    file_url = f"/api/files/{safe_filename}"
    
    return {
        "file_id": file_id,
        "file_name": file.filename,
        "file_type": file_type,
        "file_url": file_url,
        "file_size": len(content)
    }

@api_router.get("/files/{filename}")
async def get_file(filename: str):
    """Serve uploaded files"""
    file_path = UPLOAD_DIR / filename
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="Fichier non trouvé")
    
    # Get mime type
    mime_type, _ = mimetypes.guess_type(str(file_path))
    if not mime_type:
        mime_type = 'application/octet-stream'
    
    # Read and return file
    async with aiofiles.open(file_path, 'rb') as f:
        content = await f.read()
    
    return Response(
        content=content,
        media_type=mime_type,
        headers={
            "Content-Disposition": f"inline; filename={filename}"
        }
    )

# ============ REAL-TIME MESSAGING WITH SOCKET.IO ============

# Track connected users: {user_id: sid}
connected_users = {}

@sio.event
async def connect(sid, environ):
    logger.info(f"Client {sid} connected")

@sio.event
async def disconnect(sid):
    # Remove user from connected_users
    user_to_remove = None
    for user_id, s in connected_users.items():
        if s == sid:
            user_to_remove = user_id
            break
    if user_to_remove:
        del connected_users[user_to_remove]
    logger.info(f"Client {sid} disconnected")

@sio.event
async def join_room(sid, data):
    """User joins their personal room for receiving messages"""
    user_id = data.get('user_id')
    if user_id:
        connected_users[user_id] = sid
        await sio.enter_room(sid, user_id)
        logger.info(f"User {user_id} joined room (sid: {sid})")

@sio.event
async def leave_room(sid, data):
    """User leaves their room"""
    user_id = data.get('user_id')
    if user_id:
        await sio.leave_room(sid, user_id)
        if user_id in connected_users:
            del connected_users[user_id]
        logger.info(f"User {user_id} left room")

@sio.event
async def send_message(sid, data):
    """Handle real-time message sending"""
    try:
        sender_id = data.get('sender_id')
        receiver_id = data.get('receiver_id')
        content = data.get('content', '')
        attachments = data.get('attachments', [])
        
        if not sender_id or not receiver_id:
            await sio.emit('error', {'message': 'sender_id and receiver_id required'}, room=sid)
            return
        
        if not content and not attachments:
            await sio.emit('error', {'message': 'Message content or attachment required'}, room=sid)
            return
        
        # Create message in database
        message_id = f"msg_{uuid.uuid4().hex[:12]}"
        now = datetime.now(timezone.utc).isoformat()
        
        message_doc = {
            "message_id": message_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "attachments": attachments,
            "read": False,
            "created_at": now
        }
        
        await db.messages.insert_one(message_doc)
        
        # Prepare response message
        response_msg = {
            "message_id": message_id,
            "sender_id": sender_id,
            "receiver_id": receiver_id,
            "content": content,
            "attachments": attachments,
            "read": False,
            "created_at": now
        }
        
        # Emit to sender (confirmation)
        await sio.emit('message_sent', response_msg, room=sid)
        
        # Emit to receiver (if connected)
        if receiver_id in connected_users:
            await sio.emit('new_message', response_msg, room=receiver_id)
        
        logger.info(f"Message sent from {sender_id} to {receiver_id}")
        
    except Exception as e:
        logger.error(f"Error sending message: {e}")
        await sio.emit('error', {'message': str(e)}, room=sid)

@sio.event
async def mark_read(sid, data):
    """Mark messages as read"""
    try:
        reader_id = data.get('reader_id')
        sender_id = data.get('sender_id')
        
        if reader_id and sender_id:
            await db.messages.update_many(
                {"sender_id": sender_id, "receiver_id": reader_id, "read": False},
                {"$set": {"read": True}}
            )
            
            # Notify sender that messages were read
            if sender_id in connected_users:
                await sio.emit('messages_read', {
                    'reader_id': reader_id,
                    'sender_id': sender_id
                }, room=sender_id)
                
    except Exception as e:
        logger.error(f"Error marking messages read: {e}")

@sio.event
async def typing(sid, data):
    """Broadcast typing indicator"""
    sender_id = data.get('sender_id')
    receiver_id = data.get('receiver_id')
    is_typing = data.get('is_typing', False)
    
    if receiver_id in connected_users:
        await sio.emit('user_typing', {
            'user_id': sender_id,
            'is_typing': is_typing
        }, room=receiver_id)

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
