# Je Suis - Plateforme de Services (Événements & Professionnels)

## Vision Produit
Plateforme web complète pour les prestataires de services, opérant en deux modes distincts :
- **Mode Événements** : Prestataires événementiels et de mariage (photographes, DJ, traiteurs, etc.)
- **Mode Professionnels** : Artisans du bâtiment (électriciens, plombiers, serruriers, etc.)

Les clients peuvent rechercher, réserver et payer des prestataires, et les prestataires peuvent gérer leur activité.

## Types d'utilisateurs
- **Clients** : Recherche et réservation de prestataires (événements ou artisans)
- **Prestataires** : Gestion de profil, planning, réservations
- **Administrateur** : Modération, statistiques et gestion des catégories par mode

## Stack Technique
- **Frontend** : React + TailwindCSS + Shadcn/UI
- **Backend** : FastAPI + MongoDB
- **Auth** : JWT (email/password) + Google OAuth
- **Paiements** : Stripe via emergentintegrations

---

## Fonctionnalités Implémentées

### ✅ Upload d'images pour les catégories (Nouveau - 11/02/2025)
- **Panneau Admin** : Bouton "Ajouter image" pour chaque catégorie
- **Upload sécurisé** : Endpoint `/api/admin/upload-image` avec authentification admin
- **Stockage** : Images stockées dans `/app/uploads/` et servies via `/api/files/`
- **Affichage dynamique** : Images personnalisées affichées sur la page d'accueil

### ✅ Double Mode "Événements" / "Professionnels" (08/02/2025)
- **Page de sélection** (`/welcome`) : Choix du mode à l'entrée du site
- **Thèmes visuels distincts** : Doré/Or pour Événements, Bleu pour Professionnels
- **Catégories dynamiques** : 10 catégories par mode, chargées depuis l'API
- **Contenu adaptatif** : Textes, images, et labels adaptés au mode
- **Navbar adaptée** : "Je Suis Events" ou "Je Suis Pro" selon le mode
- **Indicateur de mode** : Badge cliquable dans la navbar pour changer de mode
- **Persistance** : Mode sauvegardé dans localStorage
- **Gestion admin** : Onglet "Catégories" pour ajouter/supprimer les catégories par mode

### ✅ Événements Communautaires avec Upload d'Images (08/02/2025)
- **Page `/community-events`** : Fil d'actualité des événements organisés par les prestataires
- **Création d'événements** : Les prestataires peuvent publier des événements
- **Upload d'images** : Téléversement d'images locales (PNG, JPG, max 5MB) via base64
- **Interactions sociales** : Likes et commentaires sur les événements

### ✅ Authentification (Complète)
- Inscription/Connexion par email et mot de passe
- Connexion via Google OAuth
- Récupération de mot de passe
- Sessions JWT avec cookies sécurisés

### ✅ Recherche de Prestataires (Complète)
- Liste des prestataires avec filtres (catégorie, localisation, pays)
- Cartes prestataires avec images, notes, tarifs
- Badge "Vérifié" pour prestataires certifiés
- Système de demande de devis

### ✅ Portfolio Stories (05/02/2025)
- Format Instagram Stories : Photos et vidéos courtes
- 4 types de médias supportés : Photo, Vidéo (upload), YouTube, Vimeo
- Visionneuse plein écran avec navigation

### ✅ Système d'Avis Clients (05/02/2025)
- Avis vérifiés avec badge "Client vérifié"
- Note sur 5 étoiles
- Réponses des prestataires aux avis

### ✅ Internationalisation i18n (05/02/2025)
- 3 langues supportées : Français (défaut), Anglais, Espagnol
- Sélecteur de langue dans la navbar

### ✅ Gestion des Devis (Complète)
- Onglet "Devis" pour prestataires
- Création automatique de réservation à l'acceptation

### ✅ Système de Réservation (Complète)
- Calcul automatique de l'acompte (30% du total)
- Blocage de la date dans le calendrier

### ✅ Messagerie Temps Réel (Complète)
- Chat temps réel via Socket.IO
- Envoi de fichiers

### ✅ Marketplace de Matériel (Complète)
- Prestataires peuvent lister du matériel à vendre/louer
- Système d'inquiries

### ✅ Prestataires Favoris (Complète)
- Ajouter/supprimer des favoris
- Notes personnelles

### ✅ Système de Paiement Stripe (Complète)
- Intégration Stripe complète
- Options de paiement en plusieurs fois (1x, 2x, 3x)

---

## Prochaines Fonctionnalités (Backlog)

### P0 - Bugs connus
- [ ] Login Google ne fonctionne pas en production (configuration URI)
- [ ] Build Android bloqué sur le PC de l'utilisateur (problème JDK)

### P1 - Priorité haute
- [ ] Site bilingue complet (FR/EN) - certains textes restent en français
- [ ] Intégration PayPal pour les paiements
- [ ] Restrictions fonctionnalités selon l'abonnement

### P2 - Future
- [ ] Synchronisation Google Calendar
- [ ] Refactoring des fichiers volumineux (AdminPage.js, DashboardPage.js)

---

## Environnements

### Production
- **URL** : `https://jesuisapp.cloud`
- **Branche** : `main`

### Test
- **URL** : `https://events.creativindustry.cloud`
- **Branche** : `dev`

### Preview (Emergent)
- **URL** : `https://servicepro-68.preview.emergentagent.com`

---

## API Endpoints Clés

### Catégories (Admin)
- `GET /api/admin/categories` - Toutes les catégories (auth admin)
- `POST /api/admin/categories/{mode}` - Ajouter une catégorie
- `PATCH /api/admin/categories/{mode}/{id}/image` - Mettre à jour l'image d'une catégorie
- `DELETE /api/admin/categories/{mode}/{id}` - Supprimer une catégorie
- `POST /api/admin/upload-image` - Upload d'image (auth admin)

### Catégories (Public)
- `GET /api/categories/{mode}` - Catégories par mode (events/pro)

### Authentification Admin
- `POST /api/admin/login` - Connexion admin
- `POST /api/admin/logout` - Déconnexion admin
- `GET /api/admin/me` - Info admin connecté

---

## Historique des versions

### 11/02/2025 - v2.7 - Upload d'images pour les catégories
- ✅ Bouton "Ajouter image" pour chaque catégorie dans l'admin
- ✅ Endpoint d'upload sécurisé avec authentification admin
- ✅ Affichage des images personnalisées sur la page d'accueil
- ✅ Correction du préfixage des URLs d'images dans HomePage.js

### 08/02/2025 - v2.6 - Double Mode "Événements" / "Professionnels"
- ✅ Page de sélection `/welcome`
- ✅ Thèmes visuels distincts
- ✅ Catégories dynamiques par mode

### Sessions précédentes
- v2.5 - Modération & Contact Client
- v2.4 - Abonnements & Administration
- v2.3 - Correction page /packages
- v2.2 - Portfolio Stories, Avis Clients
- v2.1 - Correction bug saisie Marketplace
- v2.0 - Système de paiement Stripe

---

## Données de Test

### Comptes Admin
- **Preview** : `admin@test.com` / `Admin123!`
- **Production** : `contact@creativindustry.com` / `Admin24!`

### Comptes Utilisateurs
- **Client** : `client@test.com` / `password123`
- **Prestataire** : `provider@test.com` / `password123`
