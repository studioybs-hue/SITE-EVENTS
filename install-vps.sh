#!/bin/bash

#############################################
# Script d'installation - Lumière Events
# Pour VPS IONOS - Ubuntu/Debian
# Domaine: events.creativindustry.cloud
#############################################

set -e  # Arrêter en cas d'erreur

# Couleurs pour les messages
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}"
echo "=============================================="
echo "   Installation de Lumière Events"
echo "   Domaine: events.creativindustry.cloud"
echo "=============================================="
echo -e "${NC}"

# Variables - MODIFIEZ SI NÉCESSAIRE
DOMAIN="events.creativindustry.cloud"
REPO_URL="https://github.com/studioybs-hue/SITE-EVENTS.git"
APP_DIR="/var/www/lumiere-events"
STRIPE_KEY="sk_test_emergent"  # Remplacez par votre vraie clé Stripe en production

# Vérifier qu'on est root
if [ "$EUID" -ne 0 ]; then 
    echo -e "${RED}Erreur: Exécutez ce script en tant que root (sudo)${NC}"
    exit 1
fi

echo -e "${YELLOW}[1/8] Mise à jour du système...${NC}"
apt update && apt upgrade -y

echo -e "${YELLOW}[2/8] Installation des dépendances...${NC}"
apt install -y curl gnupg2 git nginx certbot python3-certbot-nginx \
    python3 python3-pip python3-venv nodejs npm

# Installer une version récente de Node.js si nécessaire
if ! command -v node &> /dev/null || [ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 16 ]; then
    echo -e "${YELLOW}Installation de Node.js 18...${NC}"
    curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
    apt install -y nodejs
fi

echo -e "${YELLOW}[3/8] Installation de MongoDB...${NC}"
# Vérifier si MongoDB est déjà installé
if ! command -v mongod &> /dev/null; then
    curl -fsSL https://www.mongodb.org/static/pgp/server-7.0.asc | gpg -o /usr/share/keyrings/mongodb-server-7.0.gpg --dearmor
    echo "deb [ signed-by=/usr/share/keyrings/mongodb-server-7.0.gpg ] http://repo.mongodb.org/apt/debian bookworm/mongodb-org/7.0 main" | tee /etc/apt/sources.list.d/mongodb-org-7.0.list
    apt update
    apt install -y mongodb-org
fi
systemctl start mongod
systemctl enable mongod
echo -e "${GREEN}MongoDB installé et démarré${NC}"

echo -e "${YELLOW}[4/8] Clonage du repository...${NC}"
# Supprimer l'ancien dossier s'il existe
rm -rf $APP_DIR
mkdir -p /var/www
cd /var/www
git clone $REPO_URL lumiere-events
cd $APP_DIR

echo -e "${YELLOW}[5/8] Configuration du Backend...${NC}"
cd $APP_DIR/backend

# Créer l'environnement virtuel Python
python3 -m venv venv
source venv/bin/activate

# Installer les dépendances
pip install --upgrade pip
pip install -r requirements.txt
pip install emergentintegrations --extra-index-url https://d33sy5i8bnduwe.cloudfront.net/simple/

# Créer le fichier .env pour le backend
cat > .env << EOF
MONGO_URL="mongodb://localhost:27017"
DB_NAME="lumiere_events"
CORS_ORIGINS="https://${DOMAIN},https://www.${DOMAIN}"
STRIPE_API_KEY=${STRIPE_KEY}
EOF

# Créer le dossier uploads
mkdir -p uploads
chmod 755 uploads

deactivate
echo -e "${GREEN}Backend configuré${NC}"

echo -e "${YELLOW}[6/8] Construction du Frontend...${NC}"
cd $APP_DIR/frontend

# Installer yarn si pas présent
npm install -g yarn

# Créer le fichier .env pour le frontend
cat > .env << EOF
REACT_APP_BACKEND_URL=https://${DOMAIN}
EOF

# Installer les dépendances et construire
yarn install
yarn build

echo -e "${GREEN}Frontend construit${NC}"

echo -e "${YELLOW}[7/8] Configuration de Nginx...${NC}"

# Créer la configuration Nginx
cat > /etc/nginx/sites-available/lumiere-events << EOF
server {
    listen 80;
    server_name ${DOMAIN} www.${DOMAIN};

    # Redirection vers HTTPS (sera géré par Certbot)
    location / {
        return 301 https://\$server_name\$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name ${DOMAIN} www.${DOMAIN};

    # Les certificats seront ajoutés par Certbot
    # ssl_certificate /etc/letsencrypt/live/${DOMAIN}/fullchain.pem;
    # ssl_certificate_key /etc/letsencrypt/live/${DOMAIN}/privkey.pem;

    # Frontend React (fichiers statiques)
    root ${APP_DIR}/frontend/build;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API
    location /api/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_read_timeout 86400;
        proxy_buffering off;
    }

    # Socket.IO pour le chat temps réel
    location /socket.io/ {
        proxy_pass http://127.0.0.1:8001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_read_timeout 86400;
    }

    # Fichiers uploadés
    location /uploads/ {
        alias ${APP_DIR}/backend/uploads/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # Sécurité
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
EOF

# Activer le site
ln -sf /etc/nginx/sites-available/lumiere-events /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Tester la configuration
nginx -t

echo -e "${GREEN}Nginx configuré${NC}"

echo -e "${YELLOW}[8/8] Création du service Backend...${NC}"

# Créer le service systemd
cat > /etc/systemd/system/lumiere-backend.service << EOF
[Unit]
Description=Lumière Events Backend API
After=network.target mongod.service
Wants=mongod.service

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=${APP_DIR}/backend
Environment="PATH=${APP_DIR}/backend/venv/bin"
ExecStart=${APP_DIR}/backend/venv/bin/uvicorn server:socket_app --host 127.0.0.1 --port 8001 --workers 2
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

# Permissions
chown -R www-data:www-data $APP_DIR
chmod -R 755 $APP_DIR

# Recharger et démarrer les services
systemctl daemon-reload
systemctl enable lumiere-backend
systemctl start lumiere-backend
systemctl reload nginx

echo ""
echo -e "${GREEN}=============================================="
echo "   Installation terminée avec succès !"
echo "==============================================${NC}"
echo ""
echo -e "${YELLOW}Prochaines étapes :${NC}"
echo ""
echo "1. Configurez votre DNS IONOS :"
echo "   - Type: A"
echo "   - Nom: events"
echo "   - Valeur: $(curl -s ifconfig.me)"
echo ""
echo "2. Attendez la propagation DNS (5-30 min)"
echo ""
echo "3. Installez le certificat SSL :"
echo "   sudo certbot --nginx -d ${DOMAIN}"
echo ""
echo "4. Testez votre site :"
echo "   https://${DOMAIN}"
echo ""
echo -e "${YELLOW}Commandes utiles :${NC}"
echo "  - Voir les logs backend : sudo journalctl -u lumiere-backend -f"
echo "  - Redémarrer le backend : sudo systemctl restart lumiere-backend"
echo "  - Statut des services   : sudo systemctl status lumiere-backend nginx mongod"
echo ""
