# Lumière Events - Plateforme Événementielle

## Vision Produit
Plateforme web complète pour les prestataires événementiels et de mariage, permettant aux clients de rechercher, réserver et payer des prestataires, et aux prestataires de gérer leur activité.

## Types d'utilisateurs
- **Clients** : Recherche et réservation de prestataires
- **Prestataires** : Gestion de profil, planning, réservations
- **Administrateur** : Modération et statistiques

## Stack Technique
- **Frontend** : React + TailwindCSS + Shadcn/UI
- **Backend** : FastAPI + MongoDB
- **Auth** : JWT (email/password) + Google OAuth
- **Paiements** : Stripe via emergentintegrations

---

## Fonctionnalités Implémentées

### ✅ Authentification (Complète)
- Inscription/Connexion par email et mot de passe
- Connexion via Google OAuth
- Récupération de mot de passe
- Sessions JWT avec cookies sécurisés

### ✅ Recherche de Prestataires (Complète)
- Liste des prestataires avec filtres (catégorie, localisation)
- Cartes prestataires avec images, notes, tarifs
- Modale de détail avec services, portfolio, contact
- Badge "Vérifié" pour prestataires certifiés
- **Affichage des prestations** (noms uniquement, sans prix)
- **Système de demande de devis**

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

### ✅ Marketplace de Matériel (Complète)
- Prestataires peuvent lister du matériel à vendre/louer
- Page publique avec fiches détaillées
- Système d'inquiries (questions, offres)

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

### P1 - Notifications (Priorité haute)
- [ ] Notifications email (nouveaux messages, devis, réservations, paiements)
- [ ] Notifications push (optionnel)

### P2 - Abonnements et Commission
- [ ] Finaliser les abonnements prestataires/clients (interface déjà prête)
- [ ] Système de commission sur les réservations

### Future
- [ ] Synchronisation Google Calendar
- [ ] Panneau d'administration complet
- [ ] Système d'avis et notes
- [ ] Intégration PayPal comme alternative

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

---

## Historique des versions

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
