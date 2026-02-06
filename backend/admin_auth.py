# Admin Authentication with 2FA and Password Reset
import os
import pyotp
import qrcode
import io
import base64
import secrets
import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timezone, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, Response, Request
from pydantic import BaseModel
import bcrypt

router = APIRouter(prefix="/api/admin/auth", tags=["Admin Auth"])

# Get database
def get_db():
    from server import db
    return db

# ============ MODELS ============

class PasswordResetRequest(BaseModel):
    email: str

class PasswordResetConfirm(BaseModel):
    token: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class Setup2FAResponse(BaseModel):
    secret: str
    qr_code: str
    
class Verify2FARequest(BaseModel):
    code: str

class EmailConfigUpdate(BaseModel):
    smtp_host: str
    smtp_port: int
    smtp_user: str
    smtp_password: str
    sender_email: str
    receiver_email: str

# ============ EMAIL FUNCTIONS ============

async def get_email_config():
    """Get email configuration from database"""
    db = get_db()
    config = await db.site_settings.find_one({"key": "email_config"}, {"_id": 0})
    if config:
        return config.get("value", {})
    # Default IONOS config
    return {
        "smtp_host": "smtp.ionos.fr",
        "smtp_port": 587,
        "smtp_user": "infos@creativindustry.com",
        "smtp_password": "Soleil13...",
        "sender_email": "infos@creativindustry.com",
        "receiver_email": "contact@creativindustry.com"
    }

async def send_email(to_email: str, subject: str, html_content: str):
    """Send email via SMTP"""
    config = await get_email_config()
    
    message = MIMEMultipart("alternative")
    message["From"] = config["sender_email"]
    message["To"] = to_email
    message["Subject"] = subject
    
    html_part = MIMEText(html_content, "html")
    message.attach(html_part)
    
    try:
        await aiosmtplib.send(
            message,
            hostname=config["smtp_host"],
            port=config["smtp_port"],
            username=config["smtp_user"],
            password=config["smtp_password"],
            start_tls=True
        )
        return True
    except Exception as e:
        print(f"Email error: {e}")
        raise HTTPException(status_code=500, detail=f"Erreur d'envoi email: {str(e)}")

# ============ PASSWORD RESET ============

@router.post("/forgot-password")
async def forgot_password(request: PasswordResetRequest):
    """Send password reset email"""
    db = get_db()
    
    # Check if admin exists
    admin = await db.admin_users.find_one({"email": request.email})
    if not admin:
        # Don't reveal if email exists or not for security
        return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}
    
    # Generate reset token
    token = secrets.token_urlsafe(32)
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store token
    await db.password_reset_tokens.delete_many({"email": request.email})
    await db.password_reset_tokens.insert_one({
        "email": request.email,
        "token": token,
        "expires_at": expires_at.isoformat(),
        "used": False
    })
    
    # Get site URL from env or default
    site_url = os.environ.get("SITE_URL", "https://events.creativindustry.cloud")
    reset_link = f"{site_url}/admin/reset-password?token={token}"
    
    # Send email
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
            .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
            .header {{ background: linear-gradient(135deg, #D4AF37, #B8860B); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
            .header h1 {{ color: white; margin: 0; }}
            .content {{ background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }}
            .button {{ display: inline-block; background: #D4AF37; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }}
            .footer {{ text-align: center; margin-top: 20px; color: #666; font-size: 12px; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Lumière Events</h1>
            </div>
            <div class="content">
                <h2>Réinitialisation de mot de passe</h2>
                <p>Bonjour,</p>
                <p>Vous avez demandé la réinitialisation de votre mot de passe administrateur.</p>
                <p>Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe :</p>
                <p style="text-align: center;">
                    <a href="{reset_link}" class="button">Réinitialiser mon mot de passe</a>
                </p>
                <p><strong>Ce lien expire dans 1 heure.</strong></p>
                <p>Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
                <p style="word-break: break-all; font-size: 12px; color: #666;">
                    Ou copiez ce lien : {reset_link}
                </p>
            </div>
            <div class="footer">
                <p>© 2025 Lumière Events - Administration</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    await send_email(request.email, "🔐 Réinitialisation de mot de passe - Lumière Events", html_content)
    
    return {"message": "Si cet email existe, un lien de réinitialisation a été envoyé."}


@router.post("/reset-password")
async def reset_password(request: PasswordResetConfirm):
    """Reset password with token"""
    db = get_db()
    
    # Find token
    token_doc = await db.password_reset_tokens.find_one({
        "token": request.token,
        "used": False
    })
    
    if not token_doc:
        raise HTTPException(status_code=400, detail="Token invalide ou expiré")
    
    # Check expiration
    expires_at = datetime.fromisoformat(token_doc["expires_at"])
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Token expiré")
    
    # Validate password
    if len(request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le mot de passe doit contenir au moins 8 caractères")
    
    # Hash new password
    password_hash = bcrypt.hashpw(request.new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update admin password
    await db.admin_users.update_one(
        {"email": token_doc["email"]},
        {"$set": {"password_hash": password_hash}}
    )
    
    # Mark token as used
    await db.password_reset_tokens.update_one(
        {"token": request.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Mot de passe réinitialisé avec succès"}


@router.post("/change-password")
async def change_password(pwd_request: ChangePasswordRequest, request: Request):
    """Change password for logged in admin"""
    db = get_db()
    
    from admin import get_admin_user_from_cookie
    admin = await get_admin_user_from_cookie(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    # Verify current password
    if not bcrypt.checkpw(pwd_request.current_password.encode(), admin["password_hash"].encode()):
        raise HTTPException(status_code=400, detail="Mot de passe actuel incorrect")
    
    # Validate new password
    if len(pwd_request.new_password) < 8:
        raise HTTPException(status_code=400, detail="Le nouveau mot de passe doit contenir au moins 8 caractères")
    
    # Hash new password
    password_hash = bcrypt.hashpw(pwd_request.new_password.encode(), bcrypt.gensalt()).decode()
    
    # Update password
    await db.admin_users.update_one(
        {"admin_id": admin["admin_id"]},
        {"$set": {"password_hash": password_hash}}
    )
    
    return {"message": "Mot de passe modifié avec succès"}


# ============ 2FA FUNCTIONS ============

@router.post("/setup-2fa")
async def setup_2fa(request: Request):
    """Generate 2FA secret and QR code"""
    db = get_db()
    
    # Get admin from cookie
    from admin import get_admin_user_from_cookie
    admin = await get_admin_user_from_cookie(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    # Generate secret
    secret = pyotp.random_base32()
    
    # Create TOTP
    totp = pyotp.TOTP(secret)
    provisioning_uri = totp.provisioning_uri(
        name=admin.get("email", "admin"),
        issuer_name="Lumière Events Admin"
    )
    
    # Generate QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=5)
    qr.add_data(provisioning_uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    buffer = io.BytesIO()
    img.save(buffer, format="PNG")
    qr_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    # Store pending secret (not activated yet)
    await db.admin_users.update_one(
        {"email": admin["email"]},
        {"$set": {"pending_2fa_secret": secret}}
    )
    
    return {
        "secret": secret,
        "qr_code": f"data:image/png;base64,{qr_base64}"
    }


@router.post("/verify-2fa-setup")
async def verify_2fa_setup(code_request: Verify2FARequest, request: Request):
    """Verify 2FA code and activate 2FA"""
    db = get_db()
    
    from admin import get_admin_user_from_cookie
    admin = await get_admin_user_from_cookie(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    pending_secret = admin.get("pending_2fa_secret")
    if not pending_secret:
        raise HTTPException(status_code=400, detail="Aucune configuration 2FA en attente")
    
    # Verify code
    totp = pyotp.TOTP(pending_secret)
    if not totp.verify(code_request.code):
        raise HTTPException(status_code=400, detail="Code invalide")
    
    # Activate 2FA
    await db.admin_users.update_one(
        {"email": admin["email"]},
        {
            "$set": {"totp_secret": pending_secret, "two_factor_enabled": True},
            "$unset": {"pending_2fa_secret": ""}
        }
    )
    
    return {"message": "Double authentification activée avec succès"}


@router.post("/disable-2fa")
async def disable_2fa(code_request: Verify2FARequest, request: Request):
    """Disable 2FA (requires current 2FA code)"""
    db = get_db()
    
    from admin import get_admin_user_from_cookie
    admin = await get_admin_user_from_cookie(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    secret = admin.get("totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA non activée")
    
    # Verify code
    totp = pyotp.TOTP(secret)
    if not totp.verify(code_request.code):
        raise HTTPException(status_code=400, detail="Code invalide")
    
    # Disable 2FA
    await db.admin_users.update_one(
        {"email": admin["email"]},
        {
            "$set": {"two_factor_enabled": False},
            "$unset": {"totp_secret": ""}
        }
    )
    
    return {"message": "Double authentification désactivée"}


@router.post("/verify-2fa")
async def verify_2fa_login(code_request: Verify2FARequest, request: Request, response: Response):
    """Verify 2FA code during login"""
    db = get_db()
    
    # Get pending admin from cookie
    pending_admin_email = request.cookies.get("pending_2fa_admin")
    
    if not pending_admin_email:
        raise HTTPException(status_code=400, detail="Aucune authentification en attente")
    
    admin = await db.admin_users.find_one({"email": pending_admin_email})
    if not admin:
        raise HTTPException(status_code=400, detail="Admin non trouvé")
    
    secret = admin.get("totp_secret")
    if not secret:
        raise HTTPException(status_code=400, detail="2FA non configurée")
    
    # Verify code
    totp = pyotp.TOTP(secret)
    if not totp.verify(code_request.code):
        raise HTTPException(status_code=400, detail="Code invalide")
    
    # Set authenticated cookie
    response.set_cookie(
        key="admin_session",
        value=admin["email"],
        httponly=True,
        secure=True,
        samesite="lax",
        max_age=86400
    )
    
    # Clear pending cookie
    response.delete_cookie("pending_2fa_admin")
    
    return {
        "success": True,
        "admin": {
            "email": admin["email"],
            "role": admin.get("role", "admin")
        }
    }


@router.get("/2fa-status")
async def get_2fa_status(request: Request):
    """Check if 2FA is enabled for current admin"""
    from admin import get_admin_user_from_cookie
    admin = await get_admin_user_from_cookie(request)
    if not admin:
        raise HTTPException(status_code=401, detail="Non authentifié")
    
    return {
        "two_factor_enabled": admin.get("two_factor_enabled", False)
    }


# ============ EMAIL CONFIG ============

@router.get("/email-config")
async def get_email_config_endpoint(request: Request):
    """Get email configuration (admin only)"""
    from admin import get_admin_user
    await get_admin_user(request)  # Verify auth
    
    config = await get_email_config()
    # Don't send password
    config["smtp_password"] = "********" if config.get("smtp_password") else ""
    return config


@router.put("/email-config")
async def update_email_config(config: EmailConfigUpdate, request: Request):
    """Update email configuration"""
    db = get_db()
    
    from admin import get_admin_user
    await get_admin_user(request)  # Verify auth
    
    config_dict = config.model_dump()
    
    # If password is masked, keep the old one
    if config_dict["smtp_password"] == "********":
        old_config = await get_email_config()
        config_dict["smtp_password"] = old_config.get("smtp_password", "")
    
    await db.site_settings.update_one(
        {"key": "email_config"},
        {"$set": {"key": "email_config", "value": config_dict}},
        upsert=True
    )
    
    return {"message": "Configuration email mise à jour"}


@router.post("/test-email")
async def test_email(request: Request):
    """Send a test email"""
    from admin import get_admin_user
    await get_admin_user(request)  # Verify auth
    
    config = await get_email_config()
    
    html_content = """
    <h2>✅ Test Email Réussi</h2>
    <p>Cet email confirme que la configuration SMTP de Lumière Events fonctionne correctement.</p>
    <p>Date du test: """ + datetime.now().strftime("%d/%m/%Y %H:%M") + """</p>
    """
    
    await send_email(config["receiver_email"], "✅ Test Email - Lumière Events", html_content)
    
    return {"message": f"Email de test envoyé à {config['receiver_email']}"}
