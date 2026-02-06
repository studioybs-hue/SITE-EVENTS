"""
Admin Panel Module
Handles administration features: users, providers, stats, subscriptions
"""
from fastapi import APIRouter, HTTPException, Request, Response, Depends
from datetime import datetime, timezone, timedelta
import uuid
import bcrypt
import os
from typing import Optional

router = APIRouter(prefix="/api/admin", tags=["admin"])


def get_db():
    """Get database connection"""
    from server import db
    return db


async def get_admin_user(request: Request):
    """Verify admin authentication"""
    import logging
    logger = logging.getLogger(__name__)
    
    db = get_db()
    
    # Check admin session token
    admin_token = request.cookies.get('admin_session_token')
    logger.info(f"Admin token from cookie: {admin_token}")
    logger.info(f"All cookies: {request.cookies}")
    
    if not admin_token:
        auth_header = request.headers.get('Authorization')
        if auth_header and auth_header.startswith('Bearer '):
            admin_token = auth_header.split(' ')[1]
    
    if not admin_token:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    # Find admin session
    session = await db.admin_sessions.find_one(
        {"session_token": admin_token},
        {"_id": 0}
    )
    
    if not session:
        raise HTTPException(status_code=401, detail="Session invalide")
    
    # Check expiration
    expires_at = session["expires_at"]
    if isinstance(expires_at, str):
        expires_at = datetime.fromisoformat(expires_at)
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    
    if expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=401, detail="Session expirée")
    
    # Get admin user
    admin = await db.admin_users.find_one(
        {"admin_id": session["admin_id"]},
        {"_id": 0, "password_hash": 0}
    )
    
    if not admin or not admin.get("is_active"):
        raise HTTPException(status_code=401, detail="Compte admin désactivé")
    
    return admin


# ============ AUTH ROUTES ============

@router.post("/login")
async def admin_login(request: Request, response: Response):
    """Admin login with email and password"""
    db = get_db()
    body = await request.json()
    
    email = body.get("email")
    password = body.get("password")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email et mot de passe requis")
    
    # Find admin user
    admin = await db.admin_users.find_one({"email": email}, {"_id": 0})
    
    if not admin:
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), admin['password_hash'].encode('utf-8')):
        raise HTTPException(status_code=401, detail="Identifiants invalides")
    
    if not admin.get("is_active"):
        raise HTTPException(status_code=401, detail="Compte désactivé")
    
    # Create session
    session_token = f"admin_session_{uuid.uuid4().hex}"
    expires_at = datetime.now(timezone.utc) + timedelta(hours=12)
    
    session_doc = {
        "admin_id": admin["admin_id"],
        "session_token": session_token,
        "expires_at": expires_at.isoformat(),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.admin_sessions.insert_one(session_doc)
    
    # Update last login
    await db.admin_users.update_one(
        {"admin_id": admin["admin_id"]},
        {"$set": {"last_login": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Set cookie
    response.set_cookie(
        key="admin_session_token",
        value=session_token,
        httponly=True,
        secure=True,
        samesite="none",
        path="/",
        max_age=12*60*60
    )
    
    return {
        "success": True,
        "admin": {
            "admin_id": admin["admin_id"],
            "email": admin["email"],
            "name": admin["name"],
            "role": admin.get("role", "admin")
        }
    }


@router.post("/logout")
async def admin_logout(request: Request, response: Response):
    """Admin logout"""
    db = get_db()
    
    admin_token = request.cookies.get('admin_session_token')
    if admin_token:
        await db.admin_sessions.delete_one({"session_token": admin_token})
    
    response.delete_cookie("admin_session_token", path="/")
    return {"success": True}


@router.get("/me")
async def get_admin_me(admin: dict = Depends(get_admin_user)):
    """Get current admin info"""
    return admin


# ============ STATS ROUTES ============

@router.get("/stats")
async def get_admin_stats(admin: dict = Depends(get_admin_user)):
    """Get dashboard statistics"""
    db = get_db()
    
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    # Total counts
    total_users = await db.users.count_documents({})
    total_providers = await db.provider_profiles.count_documents({})
    total_clients = await db.users.count_documents({"user_type": "client"})
    total_bookings = await db.bookings.count_documents({})
    
    # This month stats
    new_users_this_month = await db.users.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    new_bookings_this_month = await db.bookings.count_documents({
        "created_at": {"$gte": month_start.isoformat()}
    })
    
    # Revenue calculation
    payments = await db.payment_transactions.find({
        "payment_status": "paid"
    }, {"_id": 0, "amount": 1, "created_at": 1}).to_list(10000)
    
    total_revenue = sum(p.get("amount", 0) for p in payments)
    
    revenue_this_month = sum(
        p.get("amount", 0) for p in payments 
        if p.get("created_at", "") >= month_start.isoformat()
    )
    
    # Subscription stats
    subscriptions = await db.subscriptions.find(
        {"status": "active"},
        {"_id": 0, "plan_id": 1}
    ).to_list(1000)
    
    subscription_counts = {"free": 0, "pro": 0, "premium": 0}
    for sub in subscriptions:
        plan = sub.get("plan_id", "free")
        if plan in subscription_counts:
            subscription_counts[plan] += 1
    
    # Providers without active subscription = free
    providers_with_sub = len(subscriptions)
    subscription_counts["free"] = total_providers - providers_with_sub
    
    return {
        "total_users": total_users,
        "total_providers": total_providers,
        "total_clients": total_clients,
        "total_bookings": total_bookings,
        "total_revenue": total_revenue,
        "new_users_this_month": new_users_this_month,
        "new_bookings_this_month": new_bookings_this_month,
        "revenue_this_month": revenue_this_month,
        "active_subscriptions": subscription_counts,
        "month": month_start.strftime("%B %Y")
    }


# ============ USERS MANAGEMENT ============

@router.get("/users")
async def get_users(
    admin: dict = Depends(get_admin_user),
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    user_type: Optional[str] = None
):
    """Get all users with pagination"""
    db = get_db()
    
    query = {}
    if search:
        query["$or"] = [
            {"name": {"$regex": search, "$options": "i"}},
            {"email": {"$regex": search, "$options": "i"}}
        ]
    if user_type:
        query["user_type"] = user_type
    
    skip = (page - 1) * limit
    
    total = await db.users.count_documents(query)
    users = await db.users.find(
        query,
        {"_id": 0, "password_hash": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    return {
        "users": users,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/users/{user_id}")
async def get_user_detail(user_id: str, admin: dict = Depends(get_admin_user)):
    """Get detailed user info"""
    db = get_db()
    
    user = await db.users.find_one({"user_id": user_id}, {"_id": 0, "password_hash": 0})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Get additional info based on user type
    provider = None
    bookings = []
    
    if user.get("user_type") == "provider":
        provider = await db.provider_profiles.find_one(
            {"user_id": user_id},
            {"_id": 0}
        )
        if provider:
            bookings = await db.bookings.find(
                {"provider_id": provider["provider_id"]},
                {"_id": 0}
            ).sort("created_at", -1).limit(10).to_list(10)
    else:
        bookings = await db.bookings.find(
            {"client_id": user_id},
            {"_id": 0}
        ).sort("created_at", -1).limit(10).to_list(10)
    
    return {
        "user": user,
        "provider": provider,
        "recent_bookings": bookings
    }


@router.patch("/users/{user_id}/block")
async def block_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Block/unblock a user"""
    db = get_db()
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    is_blocked = user.get("is_blocked", False)
    
    await db.users.update_one(
        {"user_id": user_id},
        {"$set": {"is_blocked": not is_blocked}}
    )
    
    # Invalidate user sessions
    if not is_blocked:  # If blocking
        await db.user_sessions.delete_many({"user_id": user_id})
    
    return {
        "success": True,
        "is_blocked": not is_blocked,
        "message": "Utilisateur bloqué" if not is_blocked else "Utilisateur débloqué"
    }


@router.delete("/users/{user_id}")
async def delete_user(user_id: str, admin: dict = Depends(get_admin_user)):
    """Delete a user account"""
    db = get_db()
    
    user = await db.users.find_one({"user_id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="Utilisateur non trouvé")
    
    # Delete provider profile if exists
    provider = await db.provider_profiles.find_one({"user_id": user_id})
    if provider:
        provider_id = provider["provider_id"]
        await db.services.delete_many({"provider_id": provider_id})
        await db.availability.delete_many({"provider_id": provider_id})
        await db.country_presences.delete_many({"provider_id": provider_id})
        await db.marketplace_items.delete_many({"seller_id": provider_id})
        await db.portfolio_items.delete_many({"provider_id": provider_id})
        await db.provider_packs.delete_many({"provider_id": provider_id})
        await db.subscriptions.delete_many({"provider_id": provider_id})
        await db.provider_profiles.delete_one({"provider_id": provider_id})
    
    # Delete user data
    await db.bookings.delete_many({"$or": [{"client_id": user_id}, {"provider_id": provider.get("provider_id") if provider else None}]})
    await db.messages.delete_many({"$or": [{"sender_id": user_id}, {"receiver_id": user_id}]})
    await db.favorites.delete_many({"user_id": user_id})
    await db.quote_requests.delete_many({"client_id": user_id})
    await db.user_sessions.delete_many({"user_id": user_id})
    await db.users.delete_one({"user_id": user_id})
    
    return {"success": True, "message": "Utilisateur supprimé"}


# ============ PROVIDERS MANAGEMENT ============

@router.get("/providers")
async def get_providers(
    admin: dict = Depends(get_admin_user),
    page: int = 1,
    limit: int = 20,
    search: Optional[str] = None,
    verified: Optional[bool] = None
):
    """Get all providers with pagination"""
    db = get_db()
    
    query = {}
    if search:
        query["$or"] = [
            {"business_name": {"$regex": search, "$options": "i"}},
            {"category": {"$regex": search, "$options": "i"}}
        ]
    if verified is not None:
        query["verified"] = verified
    
    skip = (page - 1) * limit
    
    total = await db.provider_profiles.count_documents(query)
    providers = await db.provider_profiles.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Get subscription info for each provider
    for p in providers:
        sub = await db.subscriptions.find_one(
            {"provider_id": p["provider_id"], "status": "active"},
            {"_id": 0, "plan_id": 1}
        )
        p["subscription_plan"] = sub["plan_id"] if sub else "free"
    
    return {
        "providers": providers,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.patch("/providers/{provider_id}/verify")
async def verify_provider(provider_id: str, admin: dict = Depends(get_admin_user)):
    """Toggle provider verification status"""
    db = get_db()
    
    provider = await db.provider_profiles.find_one({"provider_id": provider_id})
    if not provider:
        raise HTTPException(status_code=404, detail="Prestataire non trouvé")
    
    is_verified = provider.get("verified", False)
    
    await db.provider_profiles.update_one(
        {"provider_id": provider_id},
        {"$set": {"verified": not is_verified}}
    )
    
    return {
        "success": True,
        "verified": not is_verified,
        "message": "Prestataire vérifié" if not is_verified else "Vérification retirée"
    }


# ============ SUBSCRIPTIONS MANAGEMENT ============

@router.get("/subscriptions")
async def get_all_subscriptions(
    admin: dict = Depends(get_admin_user),
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None,
    plan_id: Optional[str] = None
):
    """Get all subscriptions"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    if plan_id:
        query["plan_id"] = plan_id
    
    skip = (page - 1) * limit
    
    total = await db.subscriptions.count_documents(query)
    subscriptions = await db.subscriptions.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    # Enrich with provider info
    for sub in subscriptions:
        provider = await db.provider_profiles.find_one(
            {"provider_id": sub["provider_id"]},
            {"_id": 0, "business_name": 1, "category": 1}
        )
        sub["provider"] = provider
    
    return {
        "subscriptions": subscriptions,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.patch("/subscriptions/{subscription_id}")
async def update_subscription(
    subscription_id: str,
    request: Request,
    admin: dict = Depends(get_admin_user)
):
    """Update a subscription (admin override)"""
    db = get_db()
    body = await request.json()
    
    subscription = await db.subscriptions.find_one({"subscription_id": subscription_id})
    if not subscription:
        raise HTTPException(status_code=404, detail="Abonnement non trouvé")
    
    update_fields = {}
    if "status" in body:
        update_fields["status"] = body["status"]
    if "plan_id" in body:
        update_fields["plan_id"] = body["plan_id"]
    if "current_period_end" in body:
        update_fields["current_period_end"] = body["current_period_end"]
    
    if update_fields:
        update_fields["updated_at"] = datetime.now(timezone.utc).isoformat()
        await db.subscriptions.update_one(
            {"subscription_id": subscription_id},
            {"$set": update_fields}
        )
    
    return {"success": True, "message": "Abonnement mis à jour"}


# ============ BOOKINGS MANAGEMENT ============

@router.get("/bookings")
async def get_all_bookings(
    admin: dict = Depends(get_admin_user),
    page: int = 1,
    limit: int = 20,
    status: Optional[str] = None
):
    """Get all bookings"""
    db = get_db()
    
    query = {}
    if status:
        query["status"] = status
    
    skip = (page - 1) * limit
    
    total = await db.bookings.count_documents(query)
    bookings = await db.bookings.find(
        query,
        {"_id": 0}
    ).skip(skip).limit(limit).sort("created_at", -1).to_list(limit)
    
    return {
        "bookings": bookings,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


# ============ SETUP ============

@router.post("/setup")
async def setup_admin_account(request: Request):
    """Initial admin setup - creates first admin account"""
    db = get_db()
    
    # Check if admin already exists
    existing = await db.admin_users.count_documents({})
    if existing > 0:
        raise HTTPException(status_code=400, detail="Un compte admin existe déjà")
    
    body = await request.json()
    email = body.get("email")
    password = body.get("password")
    name = body.get("name", "Administrateur")
    
    if not email or not password:
        raise HTTPException(status_code=400, detail="Email et mot de passe requis")
    
    if len(password) < 8:
        raise HTTPException(status_code=400, detail="Mot de passe: 8 caractères minimum")
    
    # Hash password
    password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt())
    
    # Create admin
    admin_id = f"admin_{uuid.uuid4().hex[:12]}"
    admin_doc = {
        "admin_id": admin_id,
        "email": email,
        "name": name,
        "password_hash": password_hash.decode('utf-8'),
        "role": "super_admin",
        "permissions": ["manage_users", "manage_providers", "view_stats", "manage_subscriptions"],
        "is_active": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "last_login": None
    }
    
    await db.admin_users.insert_one(admin_doc)
    
    return {
        "success": True,
        "message": "Compte administrateur créé",
        "admin_id": admin_id
    }
