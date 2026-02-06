from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import Optional, List
from datetime import datetime
import uuid

# Quote Request Models
class QuoteServiceItem(BaseModel):
    service_id: str
    title: str
    options: List[str] = []

class QuoteRequest(BaseModel):
    model_config = ConfigDict(extra="ignore")
    quote_id: str
    client_id: str
    provider_id: str
    services: List[QuoteServiceItem]
    event_type: str
    event_date: str
    event_location: str
    message: Optional[str] = None
    status: str = "pending"  # pending, responded, accepted, declined
    response_message: Optional[str] = None
    response_amount: Optional[float] = None
    created_at: datetime
    updated_at: datetime

class QuoteRequestCreate(BaseModel):
    provider_id: str
    services: List[QuoteServiceItem]
    event_type: str
    event_date: str
    event_location: str
    message: Optional[str] = None

class QuoteRequestUpdate(BaseModel):
    status: Optional[str] = None
    response_message: Optional[str] = None
    response_amount: Optional[float] = None

# User Models
class UserPreferences(BaseModel):
    budget_min: Optional[float] = None
    budget_max: Optional[float] = None
    event_types: List[str] = []  # wedding, birthday, corporate, etc.
    preferred_location: Optional[str] = None

class NotificationSettings(BaseModel):
    email_new_message: bool = True
    email_quote_received: bool = True
    email_booking_update: bool = True
    email_marketing: bool = False
    push_enabled: bool = True

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    user_type: str  # 'client', 'provider', 'admin'
    country: Optional[str] = "FR"  # User's primary country
    countries: List[str] = ["FR"]  # For providers: countries where they operate
    preferences: Optional[UserPreferences] = None
    notification_settings: Optional[NotificationSettings] = None
    created_at: datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    phone: Optional[str] = None
    user_type: str = 'client'
    country: Optional[str] = "FR"
    countries: List[str] = ["FR"]

class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    picture: Optional[str] = None
    country: Optional[str] = None
    countries: Optional[List[str]] = None
    preferences: Optional[UserPreferences] = None
    notification_settings: Optional[NotificationSettings] = None

# Provider Profile Models
class ProviderProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider_id: str
    user_id: str
    business_name: str
    category: str  # DJ, Photographer, Caterer, etc.
    description: str
    location: str
    countries: List[str] = ["FR"]  # List of country codes (FR, ES, GB, US, etc.)
    services: List[str]
    pricing_range: str  # e.g., "€500-€2000"
    profile_image: Optional[str] = None  # Provider profile photo
    cover_image: Optional[str] = None  # Cover/banner image
    portfolio_images: List[str] = []
    portfolio_videos: List[str] = []
    phone: Optional[str] = None
    max_bookings_per_day: int = 1  # Number of clients the provider can take per day
    verified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime

class ProviderProfileCreate(BaseModel):
    business_name: str
    category: str
    description: str
    location: str
    countries: List[str] = ["FR"]
    services: List[str]
    pricing_range: str
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    portfolio_images: List[str] = []
    portfolio_videos: List[str] = []
    phone: Optional[str] = None
    max_bookings_per_day: int = 1

class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    countries: Optional[List[str]] = None
    services: Optional[List[str]] = None
    pricing_range: Optional[str] = None
    profile_image: Optional[str] = None
    cover_image: Optional[str] = None
    portfolio_images: Optional[List[str]] = None
    portfolio_videos: Optional[List[str]] = None
    phone: Optional[str] = None
    max_bookings_per_day: Optional[int] = None

# Availability Models
class Availability(BaseModel):
    model_config = ConfigDict(extra="ignore")
    availability_id: str
    provider_id: str
    date: str  # ISO date format
    is_available: bool
    notes: Optional[str] = None

class AvailabilityCreate(BaseModel):
    date: str
    is_available: bool
    notes: Optional[str] = None

# Country Presence Models (Provider location by date range)
class CountryPresence(BaseModel):
    model_config = ConfigDict(extra="ignore")
    presence_id: str
    provider_id: str
    country: str  # Country code (FR, KM, etc.)
    start_date: str  # ISO date format YYYY-MM-DD
    end_date: str  # ISO date format YYYY-MM-DD
    notes: Optional[str] = None
    created_at: datetime

class CountryPresenceCreate(BaseModel):
    country: str
    start_date: str
    end_date: str
    notes: Optional[str] = None

class CountryPresenceUpdate(BaseModel):
    country: Optional[str] = None
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    notes: Optional[str] = None

# Booking Models
class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    booking_id: str
    client_id: str
    provider_id: str
    quote_id: Optional[str] = None  # Link to original quote
    event_type: str  # wedding, birthday, corporate, etc.
    event_date: str
    event_location: str
    status: str  # pending, confirmed, cancelled, completed
    total_amount: float
    deposit_paid: float = 0.0
    deposit_required: float = 0.0  # Usually 30% of total
    payment_status: str  # pending, partial, paid
    services: List[dict] = []  # Services from the quote
    notes: Optional[str] = None
    provider_name: Optional[str] = None
    client_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime

class BookingCreate(BaseModel):
    provider_id: str
    event_type: str
    event_date: str
    event_location: str
    total_amount: Optional[float] = None
    total_price: Optional[float] = None  # Alias for total_amount
    pack_id: Optional[str] = None
    notes: Optional[str] = None

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    deposit_paid: Optional[float] = None

# Review Models
class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    booking_id: Optional[str] = None  # Optional - if None, not verified
    client_id: str
    client_name: Optional[str] = None
    client_picture: Optional[str] = None
    provider_id: str
    rating: int  # 1-5
    comment: str
    is_verified: bool = False  # True if linked to a completed booking
    event_type: Optional[str] = None  # wedding, birthday, etc.
    event_date: Optional[str] = None
    provider_response: Optional[str] = None  # Provider can respond to review
    created_at: datetime

class ReviewCreate(BaseModel):
    booking_id: Optional[str] = None  # If provided, will be marked as verified
    provider_id: str
    rating: int
    comment: str

# Portfolio Item Models (Stories - photos/videos)
class PortfolioItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str
    provider_id: str
    media_type: str  # "photo", "video", "youtube", "vimeo"
    media_url: str  # URL to the media file or embed URL
    thumbnail_url: Optional[str] = None  # For videos
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None  # wedding, birthday, corporate, etc.
    duration: Optional[int] = None  # Duration in seconds for videos
    views_count: int = 0
    display_order: int = 0
    is_active: bool = True
    created_at: datetime

class PortfolioItemCreate(BaseModel):
    media_type: str  # "photo", "video", "youtube", "vimeo"
    media_url: str
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    duration: Optional[int] = None

class PortfolioItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    event_type: Optional[str] = None
    thumbnail_url: Optional[str] = None
    display_order: Optional[int] = None
    is_active: Optional[bool] = None

# Message Models
class MessageAttachment(BaseModel):
    file_id: str
    file_name: str
    file_type: str  # image, document, contract
    file_url: str
    file_size: int = 0

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    message_id: str
    sender_id: str
    receiver_id: str
    content: str
    attachments: List[MessageAttachment] = []
    read: bool = False
    created_at: datetime

class MessageCreate(BaseModel):
    receiver_id: str
    content: str
    attachments: List[MessageAttachment] = []

# Notification Models
class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    notification_id: str
    user_id: str
    type: str  # message, quote, booking, payment
    title: str
    body: str
    data: dict = {}
    read: bool = False
    email_sent: bool = False
    created_at: datetime

# Marketplace Item Models
class MarketplaceItem(BaseModel):
    model_config = ConfigDict(extra="ignore")
    item_id: str
    seller_id: str
    seller_name: Optional[str] = None
    title: str
    description: str
    category: str  # audio, lighting, decor, furniture, etc.
    price: float
    rental_available: bool = False
    rental_price_per_day: Optional[float] = None
    images: List[str] = []
    location: str
    condition: str  # new, like_new, good, fair
    status: str = "available"  # available, reserved, sold, rented
    available: bool = True
    views_count: int = 0
    inquiries_count: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None

class MarketplaceItemCreate(BaseModel):
    title: str
    description: str
    category: str
    price: float
    rental_available: bool = False
    rental_price_per_day: Optional[float] = None
    images: List[str] = []
    location: str
    condition: str

class MarketplaceItemUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    price: Optional[float] = None
    rental_available: Optional[bool] = None
    rental_price_per_day: Optional[float] = None
    images: Optional[List[str]] = None
    location: Optional[str] = None
    condition: Optional[str] = None
    status: Optional[str] = None
    available: Optional[bool] = None

# Marketplace Inquiry Models (messages linked to items)
class MarketplaceInquiry(BaseModel):
    model_config = ConfigDict(extra="ignore")
    inquiry_id: str
    item_id: str
    item_title: str
    buyer_id: str
    buyer_name: str
    seller_id: str
    message: str
    inquiry_type: str = "question"  # question, offer, rental_request
    offer_amount: Optional[float] = None
    rental_dates: Optional[dict] = None  # {start: "2025-01-01", end: "2025-01-05"}
    status: str = "pending"  # pending, replied, accepted, declined
    created_at: datetime

class MarketplaceInquiryCreate(BaseModel):
    item_id: str
    message: str
    inquiry_type: str = "question"
    offer_amount: Optional[float] = None
    rental_dates: Optional[dict] = None

# Service/Prestation Models
class ServiceOption(BaseModel):
    name: str
    price: float = 0.0
    description: Optional[str] = None

class Service(BaseModel):
    model_config = ConfigDict(extra="ignore")
    service_id: str
    provider_id: str
    title: str
    description: str
    duration: Optional[str] = None  # e.g., "2h", "4h", "Journée"
    price: float
    options: List[ServiceOption] = []
    is_active: bool = True
    display_order: int = 0
    created_at: datetime
    updated_at: datetime

class ServiceCreate(BaseModel):
    title: str
    description: str
    duration: Optional[str] = None
    price: float
    options: List[ServiceOption] = []

class ServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration: Optional[str] = None
    price: Optional[float] = None
    options: Optional[List[ServiceOption]] = None
    is_active: Optional[bool] = None
    display_order: Optional[int] = None

# Session Model
class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    session_token: str
    expires_at: datetime
    created_at: datetime

# Event Package Models
class PackageProvider(BaseModel):
    provider_id: str
    business_name: str
    category: str
    services: List[str]

class EventPackage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    package_id: str
    name: str
    description: str
    event_type: str  # wedding, birthday, corporate, etc.
    providers: List[PackageProvider]
    original_price: float
    discounted_price: float
    discount_percentage: int
    services_included: List[str]
    image_url: Optional[str] = None
    is_active: bool = True
    created_at: datetime

class EventPackageCreate(BaseModel):
    name: str
    description: str
    event_type: str
    provider_ids: List[str]
    original_price: float
    discounted_price: float
    services_included: List[str]
    image_url: Optional[str] = None

class EventPackageUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    discounted_price: Optional[float] = None
    is_active: Optional[bool] = None
    image_url: Optional[str] = None


# Favorite Provider Models
class FavoriteProvider(BaseModel):
    model_config = ConfigDict(extra="ignore")
    favorite_id: str
    user_id: str
    provider_id: str
    provider_name: str
    provider_category: str
    provider_picture: Optional[str] = None
    provider_rating: float = 0.0
    alert_availability: bool = False  # Alert when provider becomes available
    notes: Optional[str] = None  # Personal notes about this provider
    created_at: datetime

class FavoriteProviderCreate(BaseModel):
    provider_id: str
    alert_availability: bool = False
    notes: Optional[str] = None


# Payment Transaction Models
class PaymentTransaction(BaseModel):
    model_config = ConfigDict(extra="ignore")
    transaction_id: str
    booking_id: str
    user_id: str
    session_id: str  # Stripe checkout session ID
    amount: float
    currency: str = "eur"
    payment_type: str  # "full", "deposit", "installment"
    installment_number: Optional[int] = None  # 1, 2, 3 for installments
    total_installments: Optional[int] = None  # e.g., 3 for 3x payment
    payment_status: str = "pending"  # pending, paid, failed, expired, refunded
    metadata: dict = {}
    created_at: datetime
    updated_at: Optional[datetime] = None

class PaymentTransactionCreate(BaseModel):
    booking_id: str
    amount: float
    payment_type: str = "full"  # "full", "deposit", "installment"
    installment_number: Optional[int] = None
    total_installments: Optional[int] = None


# Subscription Models
class SubscriptionPlan(BaseModel):
    """Définition des plans d'abonnement"""
    plan_id: str  # "free", "pro", "premium"
    name: str
    description: str
    price_monthly: float
    price_yearly: float
    features: List[str] = []
    limits: dict = {}  # {"max_bookings_per_month": 5, "max_portfolio_items": 5, "commission_rate": 0.15}
    stripe_price_id_monthly: Optional[str] = None
    stripe_price_id_yearly: Optional[str] = None
    paypal_plan_id_monthly: Optional[str] = None
    paypal_plan_id_yearly: Optional[str] = None
    is_active: bool = True

class Subscription(BaseModel):
    """Abonnement actif d'un prestataire"""
    model_config = ConfigDict(extra="ignore")
    subscription_id: str
    user_id: str
    provider_id: str
    plan_id: str  # "free", "pro", "premium"
    billing_cycle: str  # "monthly", "yearly"
    status: str = "active"  # active, cancelled, past_due, trialing
    payment_provider: str = "stripe"  # "stripe" or "paypal"
    external_subscription_id: Optional[str] = None  # Stripe or PayPal subscription ID
    current_period_start: datetime
    current_period_end: datetime
    cancel_at_period_end: bool = False
    created_at: datetime
    updated_at: Optional[datetime] = None

class SubscriptionCreate(BaseModel):
    plan_id: str
    billing_cycle: str  # "monthly", "yearly"
    payment_provider: str = "stripe"

class SubscriptionUpdate(BaseModel):
    plan_id: Optional[str] = None
    billing_cycle: Optional[str] = None
    status: Optional[str] = None
    cancel_at_period_end: Optional[bool] = None


# Admin Models
class AdminUser(BaseModel):
    """Utilisateur administrateur"""
    model_config = ConfigDict(extra="ignore")
    admin_id: str
    email: EmailStr
    name: str
    role: str = "admin"  # admin, super_admin
    permissions: List[str] = []  # ["manage_users", "manage_providers", "view_stats", "manage_subscriptions"]
    is_active: bool = True
    created_at: datetime
    last_login: Optional[datetime] = None

class AdminStats(BaseModel):
    """Statistiques pour le dashboard admin"""
    total_users: int = 0
    total_providers: int = 0
    total_clients: int = 0
    total_bookings: int = 0
    total_revenue: float = 0.0
    active_subscriptions: dict = {}  # {"free": 10, "pro": 5, "premium": 2}
    new_users_this_month: int = 0
    new_bookings_this_month: int = 0
    revenue_this_month: float = 0.0

