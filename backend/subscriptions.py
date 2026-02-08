"""
Subscription Management Module
Handles provider subscriptions with Stripe and PayPal
"""
from fastapi import APIRouter, HTTPException, Request, Depends
from datetime import datetime, timezone, timedelta
import uuid
import os
import stripe
from motor.motor_asyncio import AsyncIOMotorClient

# Stripe configuration
stripe.api_key = os.environ.get('STRIPE_SECRET_KEY')

router = APIRouter(prefix="/api/subscriptions", tags=["subscriptions"])

# Subscription Plans Configuration
SUBSCRIPTION_PLANS = {
    "free": {
        "plan_id": "free",
        "name": "Gratuit",
        "description": "Idéal pour démarrer",
        "price_monthly": 0,
        "price_yearly": 0,
        "features": [
            "Profil prestataire basique",
            "5 réservations par mois",
            "5 items portfolio",
            "Commission 15%",
            "Support standard"
        ],
        "limits": {
            "max_bookings_per_month": 5,
            "max_portfolio_items": 5,
            "commission_rate": 0.15,
            "priority_search": False,
            "support_level": "standard"
        }
    },
    "pro": {
        "plan_id": "pro",
        "name": "Pro",
        "description": "Pour les professionnels actifs",
        "price_monthly": 15,
        "price_yearly": 150,
        "features": [
            "Profil prestataire complet",
            "Réservations illimitées",
            "Portfolio illimité",
            "Commission 10%",
            "Priorité dans les recherches",
            "Support prioritaire"
        ],
        "limits": {
            "max_bookings_per_month": -1,  # -1 = unlimited
            "max_portfolio_items": -1,
            "commission_rate": 0.10,
            "priority_search": True,
            "support_level": "priority"
        }
    },
    "premium": {
        "plan_id": "premium",
        "name": "Premium",
        "description": "L'excellence pour votre activité",
        "price_monthly": 19,
        "price_yearly": 190,
        "features": [
            "Tout ce qui est inclus dans Pro",
            "Commission 5%",
            "Badge Premium visible",
            "Position top dans les recherches",
            "Support VIP dédié",
            "Statistiques avancées"
        ],
        "limits": {
            "max_bookings_per_month": -1,
            "max_portfolio_items": -1,
            "commission_rate": 0.05,
            "priority_search": True,
            "priority_level": 2,  # Higher = better ranking
            "support_level": "vip",
            "premium_badge": True
        }
    }
}


def get_db():
    """Get database connection"""
    from server import db
    return db


@router.get("/plans")
async def get_subscription_plans():
    """Get all available subscription plans from database or defaults"""
    db = get_db()
    
    # Try to get plans from database
    plans_doc = await db.site_settings.find_one({"key": "subscription_plans"}, {"_id": 0})
    
    if plans_doc and plans_doc.get("value"):
        plans = plans_doc["value"]
    else:
        # Use default plans
        plans = list(SUBSCRIPTION_PLANS.values())
    
    return {
        "plans": plans,
        "currency": "EUR"
    }


# Admin endpoints for managing subscription plans
@router.get("/admin/plans")
async def admin_get_plans(request: Request):
    """Admin: Get all subscription plans for editing"""
    from admin import get_admin_user
    admin = await get_admin_user(request)
    
    db = get_db()
    plans_doc = await db.site_settings.find_one({"key": "subscription_plans"}, {"_id": 0})
    
    if plans_doc and plans_doc.get("value"):
        return {"plans": plans_doc["value"]}
    else:
        return {"plans": list(SUBSCRIPTION_PLANS.values())}


@router.post("/admin/plans")
async def admin_update_plans(request: Request):
    """Admin: Update subscription plans"""
    from admin import get_admin_user
    admin = await get_admin_user(request)
    
    db = get_db()
    body = await request.json()
    plans = body.get("plans", [])
    
    await db.site_settings.update_one(
        {"key": "subscription_plans"},
        {"$set": {"key": "subscription_plans", "value": plans}},
        upsert=True
    )
    
    return {"message": "Plans mis à jour avec succès"}


@router.get("/my-subscription")
async def get_my_subscription(request: Request):
    """Get current user's subscription"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    # Get provider profile
    provider = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Profil prestataire non trouvé")
    
    # Get active subscription
    subscription = await db.subscriptions.find_one(
        {"provider_id": provider["provider_id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    if not subscription:
        # Return free plan by default
        return {
            "subscription": None,
            "plan": SUBSCRIPTION_PLANS["free"],
            "is_free": True
        }
    
    plan = SUBSCRIPTION_PLANS.get(subscription["plan_id"], SUBSCRIPTION_PLANS["free"])
    
    return {
        "subscription": subscription,
        "plan": plan,
        "is_free": subscription["plan_id"] == "free"
    }


@router.post("/create-checkout")
async def create_subscription_checkout(request: Request):
    """Create a Stripe checkout session for subscription"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    body = await request.json()
    
    plan_id = body.get("plan_id")
    billing_cycle = body.get("billing_cycle", "monthly")
    origin_url = body.get("origin_url", "")
    
    if plan_id not in SUBSCRIPTION_PLANS:
        raise HTTPException(status_code=400, detail="Plan invalide")
    
    if plan_id == "free":
        raise HTTPException(status_code=400, detail="Le plan gratuit ne nécessite pas de paiement")
    
    plan = SUBSCRIPTION_PLANS[plan_id]
    
    # Get provider profile
    provider = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Profil prestataire non trouvé")
    
    # Determine price
    if billing_cycle == "yearly":
        amount = plan["price_yearly"]
        interval = "year"
    else:
        amount = plan["price_monthly"]
        interval = "month"
    
    try:
        # Create Stripe checkout session for subscription
        checkout_session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            customer_email=current_user.email,
            line_items=[{
                "price_data": {
                    "currency": "eur",
                    "product_data": {
                        "name": f"Abonnement {plan['name']} - Lumière Events",
                        "description": plan["description"]
                    },
                    "unit_amount": int(amount * 100),
                    "recurring": {
                        "interval": interval
                    }
                },
                "quantity": 1
            }],
            success_url=f"{origin_url}/dashboard?subscription=success&session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{origin_url}/dashboard?subscription=cancelled",
            metadata={
                "user_id": current_user.user_id,
                "provider_id": provider["provider_id"],
                "plan_id": plan_id,
                "billing_cycle": billing_cycle
            }
        )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/activate")
async def activate_subscription(request: Request):
    """Activate subscription after successful payment"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    body = await request.json()
    
    session_id = body.get("session_id")
    
    if not session_id:
        raise HTTPException(status_code=400, detail="session_id requis")
    
    try:
        # Retrieve Stripe session
        session = stripe.checkout.Session.retrieve(session_id)
        
        if session.payment_status != "paid":
            raise HTTPException(status_code=400, detail="Paiement non complété")
        
        # Get metadata
        plan_id = session.metadata.get("plan_id")
        billing_cycle = session.metadata.get("billing_cycle")
        provider_id = session.metadata.get("provider_id")
        
        # Calculate period
        now = datetime.now(timezone.utc)
        if billing_cycle == "yearly":
            period_end = now + timedelta(days=365)
        else:
            period_end = now + timedelta(days=30)
        
        # Cancel any existing subscription
        await db.subscriptions.update_many(
            {"provider_id": provider_id, "status": "active"},
            {"$set": {"status": "cancelled", "updated_at": now.isoformat()}}
        )
        
        # Create new subscription
        subscription_id = f"sub_{uuid.uuid4().hex[:12]}"
        subscription_doc = {
            "subscription_id": subscription_id,
            "user_id": current_user.user_id,
            "provider_id": provider_id,
            "plan_id": plan_id,
            "billing_cycle": billing_cycle,
            "status": "active",
            "payment_provider": "stripe",
            "external_subscription_id": session.subscription,
            "current_period_start": now.isoformat(),
            "current_period_end": period_end.isoformat(),
            "cancel_at_period_end": False,
            "created_at": now.isoformat(),
            "updated_at": now.isoformat()
        }
        
        await db.subscriptions.insert_one(subscription_doc)
        
        # Update provider profile with subscription info
        await db.provider_profiles.update_one(
            {"provider_id": provider_id},
            {"$set": {
                "subscription_plan": plan_id,
                "subscription_status": "active"
            }}
        )
        
        return {
            "success": True,
            "subscription_id": subscription_id,
            "plan": SUBSCRIPTION_PLANS[plan_id]
        }
        
    except stripe.error.StripeError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/cancel")
async def cancel_subscription(request: Request):
    """Cancel subscription at end of billing period"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    # Get provider profile
    provider = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Profil prestataire non trouvé")
    
    # Get active subscription
    subscription = await db.subscriptions.find_one(
        {"provider_id": provider["provider_id"], "status": "active"},
        {"_id": 0}
    )
    
    if not subscription:
        raise HTTPException(status_code=404, detail="Aucun abonnement actif")
    
    # Cancel in Stripe if applicable
    if subscription.get("external_subscription_id") and subscription.get("payment_provider") == "stripe":
        try:
            stripe.Subscription.modify(
                subscription["external_subscription_id"],
                cancel_at_period_end=True
            )
        except stripe.error.StripeError:
            pass  # Continue even if Stripe fails
    
    # Update subscription
    await db.subscriptions.update_one(
        {"subscription_id": subscription["subscription_id"]},
        {"$set": {
            "cancel_at_period_end": True,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    return {
        "success": True,
        "message": "Votre abonnement sera annulé à la fin de la période en cours",
        "period_end": subscription["current_period_end"]
    }


@router.get("/check-limits")
async def check_subscription_limits(request: Request):
    """Check if user has reached their subscription limits"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    # Get provider profile
    provider = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Profil prestataire non trouvé")
    
    # Get active subscription
    subscription = await db.subscriptions.find_one(
        {"provider_id": provider["provider_id"], "status": {"$in": ["active", "trialing"]}},
        {"_id": 0}
    )
    
    plan_id = subscription["plan_id"] if subscription else "free"
    plan = SUBSCRIPTION_PLANS.get(plan_id, SUBSCRIPTION_PLANS["free"])
    limits = plan["limits"]
    
    # Count current month's bookings
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    
    bookings_this_month = await db.bookings.count_documents({
        "provider_id": provider["provider_id"],
        "created_at": {"$gte": month_start.isoformat()},
        "status": {"$in": ["confirmed", "pending"]}
    })
    
    # Count portfolio items
    portfolio_count = await db.portfolio_items.count_documents({
        "provider_id": provider["provider_id"]
    })
    
    max_bookings = limits.get("max_bookings_per_month", 5)
    max_portfolio = limits.get("max_portfolio_items", 5)
    
    return {
        "plan_id": plan_id,
        "plan_name": plan["name"],
        "bookings": {
            "current": bookings_this_month,
            "limit": max_bookings if max_bookings > 0 else "illimité",
            "can_accept_more": max_bookings == -1 or bookings_this_month < max_bookings
        },
        "portfolio": {
            "current": portfolio_count,
            "limit": max_portfolio if max_portfolio > 0 else "illimité",
            "can_add_more": max_portfolio == -1 or portfolio_count < max_portfolio
        },
        "commission_rate": limits.get("commission_rate", 0.15),
        "features": plan["features"]
    }
