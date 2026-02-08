"""
Events Module - Publication d'événements par les prestataires
Les prestataires peuvent publier des événements, les utilisateurs peuvent liker et commenter
"""
from fastapi import APIRouter, HTTPException, Request, Query
from datetime import datetime, timezone
from typing import Optional
import uuid

router = APIRouter(prefix="/api/events", tags=["events"])


def get_db():
    """Get database connection"""
    from server import db
    return db


async def get_current_user_optional(request: Request):
    """Get current user if authenticated, None otherwise"""
    try:
        from server import get_current_user
        return await get_current_user(request)
    except:
        return None


# ============ EVENTS CRUD ============

@router.get("")
async def get_events(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=50),
    category: Optional[str] = None,
    upcoming_only: bool = True
):
    """Get all published events"""
    db = get_db()
    
    query = {"status": "published"}
    
    if upcoming_only:
        query["event_date"] = {"$gte": datetime.now(timezone.utc).isoformat()}
    
    if category:
        query["category"] = category
    
    skip = (page - 1) * limit
    
    events = await db.community_events.find(query, {"_id": 0}).sort("event_date", 1).skip(skip).limit(limit).to_list(limit)
    total = await db.community_events.count_documents(query)
    
    # Add provider info and stats for each event
    for event in events:
        # Get provider info
        provider = await db.provider_profiles.find_one(
            {"provider_id": event.get("provider_id")},
            {"_id": 0, "business_name": 1, "profile_image": 1, "category": 1}
        )
        event["provider"] = provider
        
        # Get likes count
        event["likes_count"] = await db.event_likes.count_documents({"event_id": event["event_id"]})
        
        # Get comments count
        event["comments_count"] = await db.event_comments.count_documents({"event_id": event["event_id"]})
    
    return {
        "events": events,
        "total": total,
        "page": page,
        "pages": (total + limit - 1) // limit
    }


@router.get("/{event_id}")
async def get_event(event_id: str, request: Request):
    """Get single event with details"""
    db = get_db()
    
    event = await db.community_events.find_one({"event_id": event_id}, {"_id": 0})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    # Get provider info
    provider = await db.provider_profiles.find_one(
        {"provider_id": event.get("provider_id")},
        {"_id": 0, "business_name": 1, "profile_image": 1, "category": 1, "location": 1}
    )
    event["provider"] = provider
    
    # Get likes
    event["likes_count"] = await db.event_likes.count_documents({"event_id": event_id})
    
    # Check if current user liked
    current_user = await get_current_user_optional(request)
    if current_user:
        user_like = await db.event_likes.find_one({
            "event_id": event_id,
            "user_id": current_user.user_id
        })
        event["user_liked"] = user_like is not None
    else:
        event["user_liked"] = False
    
    # Get comments
    comments = await db.event_comments.find(
        {"event_id": event_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Add user info to comments
    for comment in comments:
        user = await db.users.find_one(
            {"user_id": comment.get("user_id")},
            {"_id": 0, "name": 1}
        )
        comment["user_name"] = user.get("name") if user else "Utilisateur"
    
    event["comments"] = comments
    event["comments_count"] = len(comments)
    
    return event


@router.post("")
async def create_event(request: Request):
    """Create a new event (providers only)"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    if current_user.user_type != "provider":
        raise HTTPException(status_code=403, detail="Seuls les prestataires peuvent créer des événements")
    
    # Get provider profile
    provider = await db.provider_profiles.find_one(
        {"user_id": current_user.user_id},
        {"_id": 0}
    )
    
    if not provider:
        raise HTTPException(status_code=404, detail="Profil prestataire non trouvé")
    
    body = await request.json()
    
    event = {
        "event_id": str(uuid.uuid4()),
        "provider_id": provider["provider_id"],
        "user_id": current_user.user_id,
        "title": body.get("title"),
        "description": body.get("description"),
        "event_date": body.get("event_date"),
        "event_time": body.get("event_time", ""),
        "location": body.get("location"),
        "address": body.get("address", ""),
        "category": body.get("category", provider.get("category")),
        "image_url": body.get("image_url", ""),
        "ticket_link": body.get("ticket_link", ""),
        "price_info": body.get("price_info", ""),
        "status": "published",
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.community_events.insert_one(event)
    
    # Remove MongoDB _id before returning
    event.pop("_id", None)
    
    return event


@router.put("/{event_id}")
async def update_event(event_id: str, request: Request):
    """Update an event (owner only)"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    event = await db.community_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    body = await request.json()
    
    update_data = {
        "title": body.get("title", event["title"]),
        "description": body.get("description", event["description"]),
        "event_date": body.get("event_date", event["event_date"]),
        "event_time": body.get("event_time", event.get("event_time", "")),
        "location": body.get("location", event["location"]),
        "address": body.get("address", event.get("address", "")),
        "image_url": body.get("image_url", event.get("image_url", "")),
        "ticket_link": body.get("ticket_link", event.get("ticket_link", "")),
        "price_info": body.get("price_info", event.get("price_info", "")),
        "updated_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.community_events.update_one(
        {"event_id": event_id},
        {"$set": update_data}
    )
    
    return {"message": "Événement mis à jour"}


@router.delete("/{event_id}")
async def delete_event(event_id: str, request: Request):
    """Delete an event (owner only)"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    event = await db.community_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    if event["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.community_events.delete_one({"event_id": event_id})
    await db.event_likes.delete_many({"event_id": event_id})
    await db.event_comments.delete_many({"event_id": event_id})
    
    return {"message": "Événement supprimé"}


# ============ LIKES ============

@router.post("/{event_id}/like")
async def toggle_like(event_id: str, request: Request):
    """Toggle like on an event"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    # Check event exists
    event = await db.community_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    # Check if already liked
    existing_like = await db.event_likes.find_one({
        "event_id": event_id,
        "user_id": current_user.user_id
    })
    
    if existing_like:
        # Unlike
        await db.event_likes.delete_one({
            "event_id": event_id,
            "user_id": current_user.user_id
        })
        liked = False
    else:
        # Like
        await db.event_likes.insert_one({
            "event_id": event_id,
            "user_id": current_user.user_id,
            "created_at": datetime.now(timezone.utc).isoformat()
        })
        liked = True
    
    likes_count = await db.event_likes.count_documents({"event_id": event_id})
    
    return {"liked": liked, "likes_count": likes_count}


# ============ COMMENTS ============

@router.post("/{event_id}/comments")
async def add_comment(event_id: str, request: Request):
    """Add a comment to an event"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    # Check event exists
    event = await db.community_events.find_one({"event_id": event_id})
    if not event:
        raise HTTPException(status_code=404, detail="Événement non trouvé")
    
    body = await request.json()
    content = body.get("content", "").strip()
    
    if not content:
        raise HTTPException(status_code=400, detail="Commentaire vide")
    
    comment = {
        "comment_id": str(uuid.uuid4()),
        "event_id": event_id,
        "user_id": current_user.user_id,
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.event_comments.insert_one(comment)
    
    # Get user name
    user = await db.users.find_one({"user_id": current_user.user_id}, {"_id": 0, "name": 1})
    comment["user_name"] = user.get("name") if user else "Utilisateur"
    comment.pop("_id", None)
    
    return comment


@router.delete("/{event_id}/comments/{comment_id}")
async def delete_comment(event_id: str, comment_id: str, request: Request):
    """Delete a comment (owner only)"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    comment = await db.event_comments.find_one({"comment_id": comment_id})
    if not comment:
        raise HTTPException(status_code=404, detail="Commentaire non trouvé")
    
    if comment["user_id"] != current_user.user_id:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.event_comments.delete_one({"comment_id": comment_id})
    
    return {"message": "Commentaire supprimé"}


# ============ MY EVENTS (for providers) ============

@router.get("/my/events")
async def get_my_events(request: Request):
    """Get events created by current provider"""
    from server import get_current_user
    db = get_db()
    
    current_user = await get_current_user(request)
    
    events = await db.community_events.find(
        {"user_id": current_user.user_id},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    for event in events:
        event["likes_count"] = await db.event_likes.count_documents({"event_id": event["event_id"]})
        event["comments_count"] = await db.event_comments.count_documents({"event_id": event["event_id"]})
    
    return events
