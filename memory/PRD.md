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

### ✅ Double Mode "Événements" / "Professionnels" (Nouveau - 08/02/2025)
- **Page de sélection** (`/welcome`) : Choix du mode à l'entrée du site
- **Thèmes visuels distincts** : Doré/Or pour Événements, Bleu pour Professionnels
- **Catégories dynamiques** : 10 catégories par mode, chargées depuis l'API
- **Contenu adaptatif** : Textes, images, et labels adaptés au mode
- **Navbar adaptée** : "Je Suis Events" ou "Je Suis Pro" selon le mode
- **Indicateur de mode** : Badge cliquable dans la navbar pour changer de mode
- **Persistance** : Mode sauvegardé dans localStorage
- **Gestion admin** : Onglet "Catégories" pour ajouter/supprimer les catégories par mode

### ✅ Événements Communautaires avec Upload d'Images (Nouveau - 08/02/2025)
- **Page `/community-events`** : Fil d'actualité des événements organisés par les prestataires
- **Création d'événements** : Les prestataires peuvent publier des événements (titre, date, lieu, description)
- **Upload d'images** : Téléversement d'images locales (PNG, JPG, max 5MB) via base64
- **Endpoint `/api/events/upload-image`** : Upload et stockage des images côté serveur
- **Endpoint `/api/events/images/{filename}`** : Service des images uploadées
- **Interactions sociales** : Likes et commentaires sur les événements
- **Dashboard prestataire** : Onglet "Mes événements" pour gérer ses publications

### ✅ Authentification (Complète)
- Inscription/Connexion par email et mot de passe
- Connexion via Google OAuth
- Récupération de mot de passe
- Sessions JWT avec cookies sécurisés

### ✅ Recherche de Prestataires (Complète - mise à jour 05/02/2025)
- Liste des prestataires avec filtres (catégorie, localisation, **pays**)
- **Sélecteur de pays** pour filtrer par pays (France, Espagne, UK, etc.)
- Cartes prestataires avec images, notes, tarifs
- Modale de détail avec services, portfolio, contact
- Badge "Vérifié" pour prestataires certifiés
- **Affichage des prestations** (noms uniquement, sans prix)
- **Système de demande de devis**
- **Affichage des pays de déplacement** avec icône avion

### ✅ Portfolio Stories (Nouveau - 05/02/2025)
- **Format Instagram Stories** : Photos et vidéos courtes
- **4 types de médias supportés** : Photo, Vidéo (upload), YouTube, Vimeo
- **Gestion dans le dashboard prestataire** : Onglet "Portfolio"
- **Visionneuse plein écran** avec navigation gauche/droite
- **Barre de progression** pour les stories
- **Compteur de vues** par item
- **Catégorisation par type d'événement** (mariage, anniversaire, etc.)
- Thumbnails cliquables style stories Instagram

### ✅ Système d'Avis Clients (Nouveau - 05/02/2025)
- **Avis vérifiés** : Badge "Client vérifié" pour les réservations confirmées
- **Avis non-vérifiés** : Possibilité de laisser un avis sans réservation
- **Note sur 5 étoiles** avec moyenne calculée automatiquement
- **Réponses des prestataires** aux avis
- **Statistiques** : Total avis, avis vérifiés, note moyenne
- Affichage sur la fiche prestataire

### ✅ Internationalisation i18n (Nouveau - 05/02/2025)
- **3 langues supportées** : Français (défaut), Anglais, Espagnol
- Sélecteur de langue dans la navbar avec drapeaux
- Détection automatique de la langue du navigateur
- Persistance du choix de langue dans localStorage
- Traduction de toute l'interface : navbar, recherche, dashboard, marketplace

### ✅ Gestion des Devis (Complète)
- Onglet "Devis" pour prestataires avec actions (répondre/refuser)
- Onglet "Mes devis" pour clients avec actions (accepter/refuser)
- Création automatique de réservation à l'acceptation

### ✅ Système de Réservation (Complète)
- Création automatique quand un devis est accepté
- Calcul automatique de l'acompte (30% du total)
- Blocage de la date dans le calendrier du prestataire
- Vue "Mes réservations" avec statuts et progression

### ✅ Messagerie Temps Réel avec Fichiers (Complète)
- Chat temps réel via Socket.IO
- Envoi de fichiers (images, documents)
- Indicateurs de saisie et lecture

### ✅ Marketplace de Matériel (Complète - mise à jour 05/02/2025)
- Prestataires peuvent lister du matériel à vendre/louer
- Page publique avec fiches détaillées
- Système d'inquiries (questions, offres)
- **Gestion des offres directement sur les cartes d'articles** :
  - Boutons "Accepter" et "Refuser" visibles sans modale
  - Offres en attente mises en évidence (fond jaune)
  - Mise à jour automatique du statut de l'article à l'acceptation

### ✅ Prestataires Favoris (Complète)
- Ajouter/supprimer des favoris
- Notes personnelles par prestataire
- Alertes de disponibilité

### ✅ Page de Profil Client (Complète)
- Onglets : Informations, Préférences, Notifications
- Upload de photo de profil
- Paramètres personnalisables

### ✅ Page de Paramètres (Complète)
- Gestion du mot de passe
- Paramètres de notification
- Maquettes pour facturation et abonnements

### ✅ Système de Paiement Stripe (Complète - 04/02/2025)
- **Intégration Stripe complète** via emergentintegrations
- **Options de paiement flexibles** :
  - Payer en 1 fois (montant total)
  - Payer en 2 fois (50% maintenant, 50% plus tard)
  - Payer en 3 fois (~33% par versement)
  - Acompte uniquement (30% pour confirmer)
- **Dialogue de sélection** avec calcul automatique des montants
- **Page de succès** avec polling du statut de paiement
- **Mise à jour automatique** du statut de réservation après paiement
- **Notification au prestataire** lors d'un paiement reçu
- **Collection payment_transactions** pour l'historique des paiements

---

## Prochaines Fonctionnalités (Backlog)

### P0 - Bugs à corriger
- [x] ~~Saisie lente dans le formulaire Marketplace~~ (Corrigé 05/02/2025 - useCallback)
- [x] ~~Page /packages n'affichait pas les packs~~ (Corrigé 06/02/2025 - API fonctionnelle)
- [x] ~~Modale de réservation de pack se fermait toute seule~~ (Corrigé 06/02/2025 - createPortal)
- [x] ~~Voir conversation complète en modération~~ (Corrigé 06/02/2025 - Modale ajoutée)
- [x] ~~Contacter client depuis fiche réservation~~ (Corrigé 06/02/2025 - Bouton ajouté)
- [x] ~~Double mode "Événements" / "Professionnels"~~ (Implémenté 08/02/2025)
- [ ] Écran blanc en cliquant sur le statut "Disponible" (menu déroulant - erreur JS)
- [ ] Problèmes de chevauchement UI (z-index) sur sélecteur de pays dans modale "Ajouter une période"
- [ ] Logique de disponibilité incomplète (ne vérifie pas le pays du prestataire)
- [ ] Google OAuth à reconfigurer pour le domaine de production
- [ ] Le client ne peut pas envoyer de message au prestataire sur le site de production (problème CORS/WebSocket probable)

### P1 - Abonnements (COMPLÉTÉ ✅)
- [x] ~~Système d'abonnement avec 3 formules~~ (Gratuit/Pro/Premium)
- [x] ~~Page tarifs /pricing~~
- [x] ~~Intégration Stripe pour paiement récurrent~~
- [x] ~~Onglet abonnement dans dashboard prestataire~~

### P1 - Panneau Administration (COMPLÉTÉ ✅)
- [x] ~~Login admin séparé~~
- [x] ~~Dashboard statistiques~~
- [x] ~~Gestion utilisateurs~~
- [x] ~~Gestion prestataires~~
- [x] ~~Gestion abonnements~~
- [x] ~~Gestion réservations~~

### P1 - Notifications (Priorité haute)
- [ ] Notifications email (nouveaux messages, devis, réservations, paiements)
- [ ] Notifications push (optionnel)

### P1 - Intégration PayPal
- [ ] Ajouter PayPal comme alternative à Stripe pour les paiements

### P2 - Abonnements et Commission
- [ ] Finaliser les abonnements prestataires/clients (interface déjà prête)
- [ ] Système de commission sur les réservations

### Future
- [ ] Synchronisation Google Calendar
- [ ] Panneau d'administration complet
- [x] ~~Système d'avis et notes~~ (Implémenté 05/02/2025)
- [ ] Ajouter plus de langues (Portugais, Allemand, Italien, Arabe)

---

## Données de Test

### Comptes
- **Client** : `client@test.com` / `password123`
- **Prestataire test** : `provider@test.com` / `password123`

### Base de données
- 5 prestataires avec profils complets
- 3 packs événementiels
- Script de seeding : `/app/scripts/create_sample_data.py`

---

## Notes Techniques Importantes

⚠️ **NE PAS réactiver `babel-metadata-plugin`** dans `craco.config.js` - cause un bug `Maximum call stack size exceeded`.

## API Endpoints Clés

### Authentification
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `POST /api/auth/change-password` - Changement mot de passe

### Prestataires
- `GET /api/providers` - Liste prestataires
- `GET /api/providers/{id}` - Détail prestataire

### Catégories (Nouveau - 08/02/2025)
- `GET /api/categories/{mode}` - Catégories par mode (events/pro)
- `POST /api/admin/categories/{mode}` - Ajouter une catégorie (admin)
- `DELETE /api/admin/categories/{mode}/{id}` - Supprimer une catégorie (admin)

### Messagerie
- `POST /api/messages` - Envoyer message
- `GET /api/messages/conversations` - Liste conversations
- `POST /api/upload-file` - Upload fichier
- **WebSocket** : `wss://[host]/socket.io`

### Marketplace
- `GET /api/marketplace` - Liste articles
- `GET /api/marketplace/{item_id}` - Détail article
- `POST /api/marketplace` - Créer article

### Favoris
- `GET /api/favorites` - Liste favoris
- `POST /api/favorites` - Ajouter favori
- `DELETE /api/favorites/{provider_id}` - Retirer favori

### Paiements (Nouveau)
- `POST /api/payments/create-checkout` - Créer session Stripe
- `GET /api/payments/status/{session_id}` - Statut paiement
- `GET /api/payments/booking/{booking_id}` - Historique paiements
- `POST /api/webhook/stripe` - Webhook Stripe

### Portfolio (Nouveau - 05/02/2025)
- `GET /api/portfolio/provider/{provider_id}` - Items du portfolio public
- `GET /api/portfolio/my-items` - Items du prestataire connecté
- `POST /api/portfolio` - Créer un item
- `PATCH /api/portfolio/{item_id}` - Modifier un item
- `DELETE /api/portfolio/{item_id}` - Supprimer un item
- `POST /api/portfolio/upload-video` - Upload vidéo (max 50MB)
- `POST /api/portfolio/{item_id}/view` - Incrémenter vues

### Avis Clients (Nouveau - 05/02/2025)
- `GET /api/reviews/provider/{provider_id}` - Avis d'un prestataire avec stats
- `POST /api/reviews` - Créer un avis (vérifié ou non)
- `PATCH /api/reviews/{review_id}/respond` - Répondre à un avis (prestataire)
- `GET /api/reviews/can-review/{provider_id}` - Vérifier éligibilité avis vérifié

---

## Historique des versions

### 08/02/2025 - v2.6 - Double Mode "Événements" / "Professionnels"
- ✅ **Page de sélection `/welcome`** : L'utilisateur choisit entre "Événements" et "Professionnels" à l'entrée du site
- ✅ **Thèmes visuels distincts** : Or/Doré pour Événements, Bleu pour Professionnels
- ✅ **Contenu adaptatif** : HomePage et SearchPage s'adaptent au mode (textes, images, catégories)
- ✅ **Navbar dynamique** : "Lumière Events" ou "Lumière Pro" selon le mode
- ✅ **Indicateur de mode** : Badge cliquable dans la navbar pour changer de mode
- ✅ **Catégories dynamiques** : 10 catégories événementielles et 10 catégories professionnelles
- ✅ **Pills de catégories** : Filtres visuels sur la page de recherche adaptés au mode
- ✅ **API `/api/categories/{mode}`** : Endpoint public pour récupérer les catégories
- ✅ **Gestion admin** : Onglet "Catégories" pour ajouter/supprimer des catégories par mode

### 06/02/2025 - v2.5 - Modération & Contact Client
- ✅ **Modale "Toutes les conversations"** : L'admin peut voir l'historique complet des conversations d'un utilisateur depuis le panneau de modération
- ✅ **Bouton "Contacter" sur réservations** : Les prestataires peuvent contacter directement un client depuis la fiche de réservation
- ✅ **Affichage nom du client** : Le nom du client est affiché sur chaque réservation du prestataire
- ✅ **Modération API REST** : Les messages envoyés via l'API REST sont aussi vérifiés par le système de modération

### 06/02/2025 - v2.4 - Abonnements & Administration
- ✅ **Page Tarifs `/pricing`** : Affichage des 3 formules (Gratuit 0€, Pro 15€/mois, Premium 19€/mois)
- ✅ **Toggle mensuel/annuel** : Annuel à 150€ et 190€ (2 mois offerts)
- ✅ **Panneau Admin `/admin`** : Dashboard complet avec statistiques
- ✅ **Gestion Utilisateurs** : Liste, recherche, blocage, suppression
- ✅ **Gestion Prestataires** : Liste, vérification (badge)
- ✅ **Gestion Abonnements** : Visualisation des abonnements actifs
- ✅ **Gestion Réservations** : Liste des réservations avec statuts
- ✅ **Login Admin séparé** : `/admin/login` avec compte dédié
- ✅ **Onglet Abonnement** dans le dashboard prestataire

### 06/02/2025 - v2.3
- ✅ **Correction page /packages** : La page affiche maintenant correctement les 3 packs multi-prestataires (Pack Mariage Complet, Pack Mariage Essentiel, Pack Anniversaire Premium)
- ✅ **Correction modale réservation pack** : Utilisation de createPortal pour rendre la modale hors du div parent, empêchant la fermeture intempestive lors du clic sur les champs de formulaire

### 05/02/2025 - v2.2
- ✅ **Portfolio Stories** : Système de portfolio format Instagram Stories avec support photo, vidéo, YouTube et Vimeo
- ✅ **Avis Clients** : Système d'avis avec badge "Client vérifié" pour les réservations confirmées
- ✅ **Pays de déplacement** : Affichage des pays sur la fiche prestataire avec icône avion

### 05/02/2025 - v2.1
- ✅ **Correction bug saisie lente Marketplace** : Optimisation avec useCallback pour les handlers de formulaire dans MyEquipmentManager.js. Performance : ~30-40ms par caractère (auparavant plusieurs centaines de ms)

### 04/02/2025 - v2.0
- ✅ Intégration complète du système de paiement Stripe
- ✅ Options de paiement en plusieurs fois (1x, 2x, 3x)
- ✅ Page de succès de paiement avec polling

### Sessions précédentes
- Messagerie temps réel avec Socket.IO
- Marketplace de matériel B2B
- Système de favoris
- Page de profil et paramètres
- Améliorations UX mobile

