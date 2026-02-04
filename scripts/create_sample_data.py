#!/usr/bin/env python3
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from datetime import datetime, timezone
import os
import bcrypt

async def create_sample_data():
    mongo_url = "mongodb://localhost:27017"
    client = AsyncIOMotorClient(mongo_url)
    db = client["test_database"]
    
    print("🗑️  Cleaning existing data...")
    await db.provider_profiles.delete_many({})
    await db.event_packages.delete_many({})
    
    print("👤 Creating sample users for providers...")
    
    # Create users for providers first
    sample_users = [
        {
            "user_id": "user_sample_001",
            "email": "photo@eventwiz.com",
            "name": "Pierre Martin",
            "picture": None,
            "user_type": "provider",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_sample_002",
            "email": "dj@eventwiz.com",
            "name": "Thomas Durand",
            "picture": None,
            "user_type": "provider",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_sample_003",
            "email": "traiteur@eventwiz.com",
            "name": "Marie Laurent",
            "picture": None,
            "user_type": "provider",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_sample_004",
            "email": "fleuriste@eventwiz.com",
            "name": "Sophie Bernard",
            "picture": None,
            "user_type": "provider",
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "user_id": "user_sample_005",
            "email": "video@eventwiz.com",
            "name": "Antoine Rousseau",
            "picture": None,
            "user_type": "provider",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    for user in sample_users:
        existing = await db.users.find_one({"user_id": user["user_id"]})
        if not existing:
            await db.users.insert_one(user)
    
    print(f"✅ Created/verified {len(sample_users)} provider users")
    
    print("👥 Creating sample providers...")
    
    providers_data = [
        {
            "provider_id": "prov_001_photo",
            "user_id": "user_sample_001",
            "business_name": "Moments Précieux Photographie",
            "category": "Photographe",
            "description": "Photographe professionnel spécialisé dans les mariages et événements. 10 ans d'expérience, style élégant et intemporel.",
            "location": "Paris",
            "services": ["Photographie de mariage", "Shooting engagement", "Album photo premium", "Retouches professionnelles"],
            "pricing_range": "€1500-€3000",
            "portfolio_images": ["https://images.unsplash.com/photo-1606800052052-a08af7148866?q=80&w=800"],
            "portfolio_videos": [],
            "phone": "+33 6 12 34 56 78",
            "verified": True,
            "rating": 4.8,
            "total_reviews": 45,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "provider_id": "prov_002_dj",
            "user_id": "user_sample_002",
            "business_name": "DJ Sonic Events",
            "category": "DJ",
            "description": "DJ professionnel pour mariages et soirées. Matériel haut de gamme, playlist personnalisée, animation de qualité.",
            "location": "Paris",
            "services": ["Animation DJ", "Sonorisation complète", "Éclairage LED", "Karaoké"],
            "pricing_range": "€800-€1500",
            "portfolio_images": ["https://images.unsplash.com/photo-1571266028243-d220c02fccca?q=80&w=800"],
            "portfolio_videos": [],
            "phone": "+33 6 23 45 67 89",
            "verified": True,
            "rating": 4.9,
            "total_reviews": 67,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "provider_id": "prov_003_catering",
            "user_id": "user_sample_003",
            "business_name": "Saveurs d'Exception Traiteur",
            "category": "Traiteur",
            "description": "Traiteur gastronomique pour événements prestigieux. Cuisine française raffinée, service impeccable.",
            "location": "Paris",
            "services": ["Menu gastronomique", "Vin d'honneur", "Buffet cocktail", "Service à table"],
            "pricing_range": "€80-€150/personne",
            "portfolio_images": ["https://images.unsplash.com/photo-1555244162-803834f70033?q=80&w=800"],
            "portfolio_videos": [],
            "phone": "+33 6 34 56 78 90",
            "verified": True,
            "rating": 4.7,
            "total_reviews": 38,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "provider_id": "prov_004_flowers",
            "user_id": "user_sample_004",
            "business_name": "Fleurs de Rêve",
            "category": "Fleuriste",
            "description": "Créations florales sur-mesure pour vos événements. Bouquets, centres de table, arches florales.",
            "location": "Paris",
            "services": ["Bouquet de mariée", "Décoration florale", "Centres de table", "Arche de cérémonie"],
            "pricing_range": "€800-€2000",
            "portfolio_images": ["https://images.unsplash.com/photo-1490750967868-88aa4486c946?q=80&w=800"],
            "portfolio_videos": [],
            "phone": "+33 6 45 67 89 01",
            "verified": True,
            "rating": 4.9,
            "total_reviews": 52,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.provider_profiles.insert_many(providers_data)
    print(f"✅ Created {len(providers_data)} providers")
    
    print("📦 Creating event packages...")
    
    packages_data = [
        {
            "package_id": "pkg_mariage_complet",
            "name": "Pack Mariage Complet",
            "description": "Le pack complet pour un mariage inoubliable. Photographie, musique, décoration florale et gastronomie réunis pour un tarif exceptionnel.",
            "event_type": "Mariage",
            "providers": [
                {
                    "provider_id": "prov_001_photo",
                    "business_name": "Moments Précieux Photographie",
                    "category": "Photographe",
                    "services": ["Photographie de mariage", "Album photo premium"]
                },
                {
                    "provider_id": "prov_002_dj",
                    "business_name": "DJ Sonic Events",
                    "category": "DJ",
                    "services": ["Animation DJ", "Sonorisation complète", "Éclairage LED"]
                },
                {
                    "provider_id": "prov_003_catering",
                    "business_name": "Saveurs d'Exception Traiteur",
                    "category": "Traiteur",
                    "services": ["Menu gastronomique", "Service à table"]
                },
                {
                    "provider_id": "prov_004_flowers",
                    "business_name": "Fleurs de Rêve",
                    "category": "Fleuriste",
                    "services": ["Bouquet de mariée", "Décoration florale"]
                }
            ],
            "original_price": 12000.0,
            "discounted_price": 8900.0,
            "discount_percentage": 26,
            "services_included": [
                "Photographie complète de la journée + album premium",
                "Animation DJ avec sonorisation et éclairage",
                "Menu gastronomique 3 services pour 100 personnes",
                "Décoration florale complète (bouquet + centres de table)",
                "Coordination entre tous les prestataires"
            ],
            "image_url": "https://images.unsplash.com/photo-1519225421980-715cb0215aed?q=80&w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "package_id": "pkg_mariage_essentiel",
            "name": "Pack Mariage Essentiel",
            "description": "Les essentiels pour votre mariage à prix avantageux. Photographie et animation musicale professionnelles.",
            "event_type": "Mariage",
            "providers": [
                {
                    "provider_id": "prov_001_photo",
                    "business_name": "Moments Précieux Photographie",
                    "category": "Photographe",
                    "services": ["Photographie de mariage"]
                },
                {
                    "provider_id": "prov_002_dj",
                    "business_name": "DJ Sonic Events",
                    "category": "DJ",
                    "services": ["Animation DJ", "Sonorisation"]
                }
            ],
            "original_price": 3500.0,
            "discounted_price": 2800.0,
            "discount_percentage": 20,
            "services_included": [
                "Photographie de mariage journée complète",
                "Animation DJ avec sonorisation professionnelle",
                "Retouches photos incluses",
                "Playlist personnalisée"
            ],
            "image_url": "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?q=80&w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        },
        {
            "package_id": "pkg_anniversaire_premium",
            "name": "Pack Anniversaire Premium",
            "description": "Organisez un anniversaire mémorable avec notre pack tout inclus : animation, traiteur et décoration.",
            "event_type": "Anniversaire",
            "providers": [
                {
                    "provider_id": "prov_002_dj",
                    "business_name": "DJ Sonic Events",
                    "category": "DJ",
                    "services": ["Animation DJ", "Éclairage LED"]
                },
                {
                    "provider_id": "prov_003_catering",
                    "business_name": "Saveurs d'Exception Traiteur",
                    "category": "Traiteur",
                    "services": ["Buffet cocktail"]
                }
            ],
            "original_price": 4500.0,
            "discounted_price": 3500.0,
            "discount_percentage": 22,
            "services_included": [
                "Animation DJ 5 heures avec éclairage LED",
                "Buffet cocktail pour 50 personnes",
                "Service de serveurs professionnels",
                "Coordination de l'événement"
            ],
            "image_url": "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?q=80&w=800",
            "is_active": True,
            "created_at": datetime.now(timezone.utc).isoformat()
        }
    ]
    
    await db.event_packages.insert_many(packages_data)
    print(f"✅ Created {len(packages_data)} event packages")
    
    print("\n🎉 Sample data created successfully!")
    print(f"   - {len(providers_data)} providers")
    print(f"   - {len(packages_data)} event packages")
    
    client.close()

if __name__ == "__main__":
    asyncio.run(create_sample_data())
