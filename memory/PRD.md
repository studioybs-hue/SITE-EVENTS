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

### ✅ Packs Événementiels (Complète)
- Affichage des packs avec réductions
- Détail des services inclus
- Liste des prestataires associés

### ✅ Messagerie Client → Prestataire (Complète - 04/02/2025)
- Bouton "Contacter" sur la fiche prestataire
- Redirection vers messagerie avec présélection du destinataire
- Envoi/réception de messages en temps réel
- Liste des conversations existantes

### ✅ Tableaux de Bord (Complète - 04/02/2025)
**Dashboard Prestataire :**
- Calendrier mensuel avec navigation (mois précédent/suivant)
- Blocage/déblocage de dates en un clic
- Stats : demandes en attente, confirmées, note, revenus
- Section "Demandes en attente" avec actions (accepter/refuser)
- Résumé du profil professionnel

**Dashboard Client :**
- Onglets : Vue d'ensemble, Mes réservations
- Stats : en attente, confirmées, total
- Actions rapides (Prestataires, Packs, Messages, Marketplace)
- Bouton "Devenir prestataire"

---

## Prochaines Fonctionnalités (Backlog)

### P1 - Paiements
- [ ] Intégration Stripe pour les paiements
- [ ] Intégration PayPal comme alternative
- [ ] Gestion des acomptes et paiements complets

### P2 - Réservations
- [ ] Système de demande de devis
- [ ] Confirmation et gestion des réservations

### Future
- [ ] Marketplace B2B (location/vente matériel)
- [ ] Synchronisation Google Calendar
- [ ] Panneau d'administration
- [ ] Système d'avis et notes

---

## Données de Test

### Comptes
- **Client** : `client@test.com` / `password123`
- **Prestataires** : `photo@eventwiz.com`, `dj@eventwiz.com`, etc.

### Base de données
- 5 prestataires avec profils complets
- 3 packs événementiels
- Script de seeding : `/app/scripts/create_sample_data.py`

---

## Notes Techniques Importantes

⚠️ **NE PAS réactiver `babel-metadata-plugin`** dans `craco.config.js` - cause un bug `Maximum call stack size exceeded`.

## API Endpoints Clés
- `POST /api/auth/register` - Inscription
- `POST /api/auth/login` - Connexion
- `GET /api/providers` - Liste prestataires
- `GET /api/providers/{id}` - Détail prestataire
- `GET /api/users/{id}` - Info utilisateur (auth required)
- `POST /api/messages` - Envoyer message
- `GET /api/messages/conversations` - Liste conversations
- `GET /api/messages/{user_id}` - Messages avec un utilisateur
