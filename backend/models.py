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
class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    user_id: str
    email: EmailStr
    name: str
    picture: Optional[str] = None
    user_type: str  # 'client', 'provider', 'admin'
    created_at: datetime

class UserCreate(BaseModel):
    email: EmailStr
    name: str
    picture: Optional[str] = None
    user_type: str = 'client'

# Provider Profile Models
class ProviderProfile(BaseModel):
    model_config = ConfigDict(extra="ignore")
    provider_id: str
    user_id: str
    business_name: str
    category: str  # DJ, Photographer, Caterer, etc.
    description: str
    location: str
    services: List[str]
    pricing_range: str  # e.g., "€500-€2000"
    portfolio_images: List[str] = []
    portfolio_videos: List[str] = []
    phone: Optional[str] = None
    verified: bool = False
    rating: float = 0.0
    total_reviews: int = 0
    created_at: datetime

class ProviderProfileCreate(BaseModel):
    business_name: str
    category: str
    description: str
    location: str
    services: List[str]
    pricing_range: str
    portfolio_images: List[str] = []
    portfolio_videos: List[str] = []
    phone: Optional[str] = None

class ProviderProfileUpdate(BaseModel):
    business_name: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    services: Optional[List[str]] = None
    pricing_range: Optional[str] = None
    portfolio_images: Optional[List[str]] = None
    portfolio_videos: Optional[List[str]] = None
    phone: Optional[str] = None

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
    total_amount: float
    notes: Optional[str] = None

class BookingUpdate(BaseModel):
    status: Optional[str] = None
    payment_status: Optional[str] = None
    deposit_paid: Optional[float] = None

# Review Models
class Review(BaseModel):
    model_config = ConfigDict(extra="ignore")
    review_id: str
    booking_id: str
    client_id: str
    provider_id: str
    rating: int  # 1-5
    comment: str
    created_at: datetime

class ReviewCreate(BaseModel):
    booking_id: str
    provider_id: str
    rating: int
    comment: str

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
    title: str
    description: str
    category: str  # audio, lighting, decor, furniture, etc.
    price: float
    rental_available: bool = False
    rental_price_per_day: Optional[float] = None
    images: List[str] = []
    location: str
    condition: str  # new, like_new, good, fair
    available: bool = True
    created_at: datetime

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
    available: Optional[bool] = None

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
