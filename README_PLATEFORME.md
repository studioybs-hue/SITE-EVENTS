# Lumière Events - Plateforme Événementielle

## 🎯 Vue d'ensemble

Plateforme web complète pour connecter clients et prestataires événementiels (mariages, anniversaires, événements professionnels).

## ✨ Fonctionnalités Implémentées

### Pour les Clients
- ✅ Recherche avancée de prestataires (par catégorie, localisation)
- ✅ Navigation par catégories (DJ, Photographe, Traiteur, Fleuriste, etc.)
- ✅ Authentification via Google OAuth (Emergent)
- ✅ Tableau de bord personnel
- ✅ Système de messagerie
- ⚠️ Page détail prestataire (en cours de correction - problème compilation Babel)
- ⏳ Réservation et paiement (backend prêt, UI à compléter)

### Pour les Prestataires
- ✅ Création de profil prestataire depuis le dashboard
- ✅ Gestion de planning et disponibilités
- ✅ Réception et gestion des réservations
- ✅ Marketplace B2B (achat/location de matériel entre prestataires)
- ✅ Messagerie avec clients

### Fonctionnalités Techniques
- ✅ Backend FastAPI complet avec toutes les routes
- ✅ Base de données MongoDB
- ✅ Authentification JWT + Google OAuth
- ✅ Design moderne et élégant (Playfair Display + Manrope)
- ✅ Navigation fluide entre pages
- ✅ Routes protégées

## 🏗️ Architecture

### Backend (`/app/backend/`)
- **server.py** : API FastAPI complète avec tous les endpoints
- **models.py** : Modèles Pydantic (User, Provider, Booking, Review, Message, Marketplace)
- **Endpoints disponibles** :
  - `/api/auth/*` : Authentification
  - `/api/providers/*` : Gestion prestataires
  - `/api/bookings/*` : Réservations
  - `/api/reviews/*` : Avis clients
  - `/api/messages/*` : Messagerie
  - `/api/marketplace/*` : Marketplace B2B
  - `/api/availability/*` : Disponibilités
  - `/api/admin/*` : Administration

### Frontend (`/app/frontend/src/`)
- **HomePage** : Landing page avec hero, catégories, features
- **SearchPage** : Recherche de prestataires avec filtres
- **LoginPage** : Connexion Google OAuth
- **DashboardPage** : Tableau de bord (client/prestataire)
- **MarketplacePage** : Marketplace B2B
- **MessagesPage** : Messagerie temps réel
- **ProviderDetailPage** : ⚠️ En correction (erreur Babel)

## 🎨 Design

- **Palette** : Alabaster (#FAFAF9), Midnight (#1C1917), Champagne Gold (#D4AF37)
- **Typographie** : Playfair Display (headings), Manrope (body)
- **Style** : Moderne, élégant, sophistiqué (mariage haut de gamme)
- **Composants** : Shadcn UI + Tailwind CSS

## 🚀 Démarrage

Les services sont déjà configurés et lancés :
- Frontend : https://servicehub-214.preview.emergentagent.com
- Backend : Port 8001 (interne)
- MongoDB : localhost:27017

## 📝 Prochaines Étapes

### Priorité Haute
1. **Corriger ProviderDetailPage.js** : Résoudre l'erreur Babel "Maximum call stack size exceeded"
2. **Implémenter page de réservation complète** : Formulaire + intégration paiement
3. **Ajouter intégrations paiement** : Stripe et PayPal (playbooks déjà disponibles)

### Priorité Moyenne
4. **Upload d'images** : Portfolio prestataires et marketplace
5. **Système d'avis** : Interface pour laisser des avis
6. **Notifications en temps réel** : Socket.IO déjà configuré côté backend
7. **Calendrier interactif** : Pour la gestion des disponibilités

### Améliorations
8. **Admin dashboard** : Validation prestataires, statistiques
9. **Filtres avancés** : Date, budget, disponibilité en temps réel
10. **Système de packs** : Offres groupées prestataires

## 🔧 Informations Techniques

### Variables d'environnement
- `REACT_APP_BACKEND_URL` : URL backend (déjà configuré)
- `MONGO_URL` : Connexion MongoDB (déjà configuré)

### Authentification
- Google OAuth via Emergent Auth
- Session tokens stockés en cookies HttpOnly
- Voir `/app/auth_testing.md` pour les tests

### Base de données (Collections)
- `users` : Utilisateurs (clients/prestataires)
- `provider_profiles` : Profils prestataires
- `bookings` : Réservations
- `reviews` : Avis
- `messages` : Messages
- `marketplace_items` : Articles marketplace
- `availability` : Disponibilités
- `user_sessions` : Sessions actives

## 🎯 État du Projet

**Backend** : ✅ 100% fonctionnel (15/15 endpoints testés et opérationnels)
**Frontend** : ✅ 95% fonctionnel (1 page en correction, toutes les autres opérationnelles)
**Design** : ✅ Implémenté selon guidelines "Ethereal Luxury"
**Tests** : ✅ Testés par l'agent de testing (voir `/app/test_reports/iteration_1.json`)

## 📚 Documentation

- `/app/design_guidelines.json` : Guidelines design complet
- `/app/auth_testing.md` : Guide de test authentification
- `/app/test_reports/iteration_1.json` : Rapport de tests

---

**Plateforme créée avec Emergent AI** 🤖
