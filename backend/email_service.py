# Email Notification Service
import os
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def get_db():
    from server import db
    return db

async def get_email_config():
    """Get email configuration from database"""
    db = get_db()
    config = await db.site_settings.find_one({"key": "email_config"}, {"_id": 0})
    if config:
        return config.get("value", {})
    # Default config
    return {
        "smtp_host": "smtp.ionos.fr",
        "smtp_port": 587,
        "smtp_user": "infos@creativindustry.com",
        "smtp_password": "",
        "sender_email": "infos@creativindustry.com",
        "receiver_email": "contact@creativindustry.com"
    }

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email via SMTP"""
    try:
        config = await get_email_config()
        
        if not config.get("smtp_password"):
            print(f"Email not sent (no SMTP password): {subject} -> {to_email}")
            return False
        
        message = MIMEMultipart("alternative")
        message["From"] = config["sender_email"]
        message["To"] = to_email
        message["Subject"] = subject
        
        html_part = MIMEText(html_content, "html")
        message.attach(html_part)
        
        await aiosmtplib.send(
            message,
            hostname=config["smtp_host"],
            port=config["smtp_port"],
            username=config["smtp_user"],
            password=config["smtp_password"],
            start_tls=True
        )
        print(f"Email sent: {subject} -> {to_email}")
        return True
    except Exception as e:
        print(f"Email error: {e}")
        return False

# ============ EMAIL TEMPLATES ============

def get_email_header():
    return """
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body { font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
            .container { max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 30px; text-align: center; }
            .header h1 { color: white; margin: 0; font-size: 28px; }
            .header p { color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px; }
            .content { background: #ffffff; padding: 30px; }
            .highlight-box { background: #f8f9fa; border-left: 4px solid #D4AF37; padding: 15px; margin: 20px 0; }
            .button { display: inline-block; background: #D4AF37; color: white !important; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 15px 0; }
            .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
            .footer a { color: #D4AF37; }
            ul { padding-left: 20px; }
            li { margin: 8px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>✨ Lumière Events</h1>
                <p>Votre plateforme événementielle</p>
            </div>
            <div class="content">
    """

def get_email_footer():
    return """
            </div>
            <div class="footer">
                <p><strong>Votre avis compte !</strong></p>
                <p>N'hésitez pas à nous communiquer votre expérience et vos suggestions.</p>
                <p>📩 <a href="mailto:contact@creativindustry.com">contact@creativindustry.com</a></p>
                <p>© 2025 Lumière Events - Tous droits réservés</p>
            </div>
        </div>
    </body>
    </html>
    """

# ============ WELCOME EMAILS ============

async def send_welcome_email_client(user_email: str, user_name: str):
    """Send welcome email to new client"""
    subject = "Bienvenue sur Lumière Events ✨"
    
    html_content = get_email_header() + f"""
    <h2>Bonjour {user_name} 👋</h2>
    
    <p>Bienvenue sur <strong>Lumière Events</strong> ! 🎉</p>
    
    <p>Lumière Events n'est pas un simple annuaire, c'est un <strong>véritable outil</strong> conçu pour vous accompagner dans la réussite de vos événements.</p>
    
    <div class="highlight-box">
        <strong>Ce que vous pouvez faire :</strong>
        <ul>
            <li>🔍 Rechercher des prestataires par catégorie et localisation</li>
            <li>💬 Contacter et échanger directement avec les prestataires</li>
            <li>📅 Réserver et payer en toute sécurité</li>
            <li>⭐ Partager votre expérience avec la communauté</li>
        </ul>
    </div>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/search" class="button">Découvrir les prestataires</a>
    </p>
    
    <p><strong>Votre avis compte !</strong><br>
    N'hésitez pas à nous communiquer votre expérience et ce que vous aimeriez voir sur la plateforme. Nous construisons Lumière Events avec vous !</p>
    
    <p>À très bientôt,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(user_email, subject, html_content)


async def send_welcome_email_provider(user_email: str, user_name: str):
    """Send welcome email to new provider"""
    subject = "Bienvenue dans la communauté Lumière Events 🌟"
    
    html_content = get_email_header() + f"""
    <h2>Bonjour {user_name} 👋</h2>
    
    <p>Félicitations et bienvenue dans la communauté <strong>Lumière Events</strong> ! 🎊</p>
    
    <p>Lumière Events n'est pas un simple annuaire, c'est un <strong>véritable outil de travail</strong> conçu pour développer votre activité événementielle.</p>
    
    <div class="highlight-box">
        <strong>Votre espace prestataire vous permet de :</strong>
        <ul>
            <li>📸 Présenter votre portfolio (photos, vidéos, stories)</li>
            <li>📦 Créer et gérer vos packs de services</li>
            <li>📍 Définir vos zones de déplacement</li>
            <li>💬 Échanger directement avec vos clients</li>
            <li>📊 Suivre vos réservations et paiements</li>
        </ul>
    </div>
    
    <div class="highlight-box" style="border-left-color: #28a745;">
        <strong>Démarrez du bon pied :</strong>
        <ol>
            <li>✅ Complétez votre profil à 100%</li>
            <li>📸 Ajoutez des visuels attractifs</li>
            <li>📦 Créez votre premier pack</li>
        </ol>
        <p style="margin-bottom: 0;"><strong>💡 Astuce :</strong> Les profils complets reçoivent <strong>3x plus de demandes</strong> !</p>
    </div>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/dashboard" class="button">Accéder à mon espace</a>
    </p>
    
    <p><strong>Votre avis compte !</strong><br>
    Cette plateforme évolue grâce à vous. N'hésitez pas à nous faire part de votre expérience et de vos idées d'amélioration.</p>
    
    <p>À votre succès,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(user_email, subject, html_content)


# ============ BOOKING NOTIFICATIONS ============

async def send_new_booking_notification(provider_email: str, provider_name: str, booking_data: dict):
    """Notify provider of new booking request"""
    subject = "🎉 Nouvelle demande de réservation !"
    
    html_content = get_email_header() + f"""
    <h2>Nouvelle demande de réservation ! 🎉</h2>
    
    <p>Bonjour {provider_name},</p>
    
    <p>Une nouvelle demande de réservation vient d'arriver sur votre profil !</p>
    
    <div class="highlight-box">
        <strong>Détails de la demande :</strong>
        <ul>
            <li><strong>Client :</strong> {booking_data.get('client_name', 'N/A')}</li>
            <li><strong>Événement :</strong> {booking_data.get('event_type', 'N/A')}</li>
            <li><strong>Date :</strong> {booking_data.get('event_date', 'N/A')}</li>
            <li><strong>Lieu :</strong> {booking_data.get('location', 'N/A')}</li>
            <li><strong>Montant :</strong> {booking_data.get('amount', 0)}€</li>
        </ul>
    </div>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/dashboard" class="button">Voir la demande</a>
    </p>
    
    <p>Connectez-vous pour accepter ou refuser cette demande.</p>
    
    <p>Cordialement,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(provider_email, subject, html_content)


async def send_booking_confirmed_notification(client_email: str, client_name: str, booking_data: dict):
    """Notify client that booking was confirmed"""
    subject = "✅ Votre réservation est confirmée !"
    
    html_content = get_email_header() + f"""
    <h2>Bonne nouvelle ! ✅</h2>
    
    <p>Bonjour {client_name},</p>
    
    <p><strong>{booking_data.get('provider_name', 'Le prestataire')}</strong> a confirmé votre réservation !</p>
    
    <div class="highlight-box" style="border-left-color: #28a745;">
        <strong>Récapitulatif :</strong>
        <ul>
            <li><strong>Prestataire :</strong> {booking_data.get('provider_name', 'N/A')}</li>
            <li><strong>Événement :</strong> {booking_data.get('event_type', 'N/A')}</li>
            <li><strong>Date :</strong> {booking_data.get('event_date', 'N/A')}</li>
            <li><strong>Lieu :</strong> {booking_data.get('location', 'N/A')}</li>
            <li><strong>Montant :</strong> {booking_data.get('amount', 0)}€</li>
        </ul>
    </div>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/messages" class="button">Contacter le prestataire</a>
    </p>
    
    <p>Vous pouvez échanger avec votre prestataire via la messagerie pour finaliser les détails.</p>
    
    <p>Cordialement,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(client_email, subject, html_content)


async def send_booking_rejected_notification(client_email: str, client_name: str, booking_data: dict):
    """Notify client that booking was rejected"""
    subject = "Réservation non disponible"
    
    html_content = get_email_header() + f"""
    <h2>Demande non disponible</h2>
    
    <p>Bonjour {client_name},</p>
    
    <p>Malheureusement, <strong>{booking_data.get('provider_name', 'le prestataire')}</strong> n'est pas disponible pour votre demande du {booking_data.get('event_date', '')}.</p>
    
    <p>Ne vous découragez pas ! De nombreux autres prestataires de qualité sont disponibles sur notre plateforme.</p>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/search" class="button">Découvrir d'autres prestataires</a>
    </p>
    
    <p>Cordialement,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(client_email, subject, html_content)


# ============ MESSAGE NOTIFICATIONS ============

async def send_new_message_notification(recipient_email: str, recipient_name: str, sender_name: str, message_preview: str):
    """Notify user of new message"""
    subject = f"💬 Nouveau message de {sender_name}"
    
    # Truncate message preview
    preview = message_preview[:100] + "..." if len(message_preview) > 100 else message_preview
    
    html_content = get_email_header() + f"""
    <h2>Nouveau message 💬</h2>
    
    <p>Bonjour {recipient_name},</p>
    
    <p>Vous avez reçu un nouveau message !</p>
    
    <div class="highlight-box">
        <p><strong>De :</strong> {sender_name}</p>
        <p><strong>Message :</strong></p>
        <p style="font-style: italic; color: #666;">"{preview}"</p>
    </div>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/messages" class="button">Répondre au message</a>
    </p>
    
    <p>Cordialement,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(recipient_email, subject, html_content)


# ============ REVIEW NOTIFICATIONS ============

async def send_new_review_notification(provider_email: str, provider_name: str, review_data: dict):
    """Notify provider of new review"""
    subject = "⭐ Nouvel avis sur votre profil !"
    
    stars = "⭐" * int(review_data.get('rating', 5))
    
    html_content = get_email_header() + f"""
    <h2>Nouvel avis reçu ! ⭐</h2>
    
    <p>Bonjour {provider_name},</p>
    
    <p><strong>{review_data.get('client_name', 'Un client')}</strong> vient de laisser un avis sur votre profil !</p>
    
    <div class="highlight-box">
        <p><strong>Note :</strong> {stars} ({review_data.get('rating', 5)}/5)</p>
        <p><strong>Commentaire :</strong></p>
        <p style="font-style: italic; color: #666;">"{review_data.get('comment', '')}"</p>
    </div>
    
    <p style="text-align: center;">
        <a href="https://events.creativindustry.cloud/dashboard" class="button">Voir l'avis</a>
    </p>
    
    <p>N'hésitez pas à remercier votre client pour son retour !</p>
    
    <p>Cordialement,<br>
    <strong>L'équipe Lumière Events</strong></p>
    """ + get_email_footer()
    
    await send_email(provider_email, subject, html_content)
