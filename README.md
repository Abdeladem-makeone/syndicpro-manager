# SyndicPro Manager v8

Application web de gestion de copropriété avec espace administrateur (syndic) et espace propriétaire.

---

## Fonctionnalités

### Espace Syndic (Admin)
- **Tableau de bord** — Vue en temps réel : charges collectées, dépenses, solde, taux de recouvrement, graphiques interactifs
- **Appartements** — Gestion des lots, propriétaires, quotes-parts et charges mensuelles
- **Paiements** — Enregistrement et suivi des paiements par appartement et par mois
- **Dépenses** — Registre catégorisé (maintenance, électricité, eau, nettoyage, réparations, assurance)
- **Actifs de l'immeuble** — Suivi des revenus annexes (loyers, antennes télécoms, publicité)
- **Suivi des opérations** — Gestion des projets et réclamations avec pièces jointes photos
- **Centre de rappels** — Rappels de paiement WhatsApp personnalisés (français / arabe)
- **Documents** — Archivage de documents (factures, devis, contrats) en base64
- **Rapports** — Bilan financier mensuel/annuel avec analyse IA (Google Gemini) et export PDF
- **Configuration** — Paramétrage de l'immeuble, mot de passe admin, intégration WhatsApp API

### Espace Propriétaire
- Consultation du solde et historique des paiements personnels
- Accès au registre des dépenses (si activé par l'admin)
- Soumission de projets et réclamations avec pièces jointes
- Demande de mise à jour de coordonnées (validée par l'admin)
- Interface disponible en **français** et en **arabe**

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Frontend | React 19 + TypeScript + Vite 6 |
| UI | Tailwind CSS + Recharts |
| Backend | Node.js + Express 5 |
| Base de données | SQLite (fichier local via `sqlite3`) |
| IA | Google Gemini API (`@google/genai`) |
| Export PDF | jsPDF + jsPDF-AutoTable |

---

## Prérequis

- Node.js 18+
- npm

---

## Installation

```bash
npm install
```

---

## Lancement (développement)

```bash
npm run dev
```

- Frontend (Vite) : http://localhost:3000
- Backend (Express) : http://localhost:5000

Le frontend proxy automatiquement les appels `/api` vers le port 5000 via la config Vite.

---

## Variables d'environnement

Créer un fichier `.env` à la racine :

```env
GEMINI_API_KEY=votre_cle_google_gemini
```

> L'application fonctionne sans clé API, mais l'analyse financière IA sera désactivée.

---

## Build production

```bash
npm run build
```

Les fichiers compilés sont générés dans `dist/`. Le serveur Express sert automatiquement ce dossier.

Pour lancer en production :

```bash
npm start
```

---

## Connexion (démo)

| Rôle | Identifiant | Mot de passe |
|------|-------------|--------------|
| Administrateur | `admin` | `admin` |
| Propriétaire | Sélectionner un appartement | Numéro de téléphone enregistré |

---

## Structure du projet

```
├── pages/
│   ├── Dashboard.tsx         # Tableau de bord admin
│   ├── Apartments.tsx        # Gestion des appartements
│   ├── Payments.tsx          # Suivi des paiements
│   ├── Expenses.tsx          # Registre des dépenses
│   ├── AssetsManager.tsx     # Actifs et revenus annexes
│   ├── FollowUp.tsx          # Projets et réclamations
│   ├── ReminderCenter.tsx    # Centre de rappels WhatsApp
│   ├── Documents.tsx         # Archivage de documents
│   ├── Reports.tsx           # Rapports et analyse IA
│   ├── Owners.tsx            # Liste des propriétaires
│   ├── OwnerDashboard.tsx    # Espace propriétaire
│   ├── OwnerProfile.tsx      # Profil propriétaire
│   ├── BuildingSetup.tsx     # Configuration immeuble
│   └── Login.tsx             # Page de connexion
├── components/
│   ├── Layout.tsx            # Navigation et mise en page
│   └── StatCard.tsx          # Carte statistique réutilisable
├── services/
│   ├── api.ts                # Client HTTP vers le backend Express
│   ├── geminiService.ts      # Analyse financière via Google Gemini
│   └── cloudSyncService.ts   # Synchronisation cloud
├── utils/                    # Helpers (PDF, WhatsApp, notifications)
├── types.ts                  # Types TypeScript (Apartment, Payment, Expense…)
├── constants.tsx              # Constantes et configuration
├── server.js                 # Serveur Express + API REST + SQLite
├── database.sqlite           # Base de données locale
└── vite.config.ts            # Config Vite (proxy /api → port 5000)
```

---

## Déploiement séparé (Vercel + Railway)

Pour héberger le frontend sur **Vercel** et le backend sur **Railway**, 3 modifications sont nécessaires :

1. **`services/api.ts`** — Utiliser une variable d'environnement `VITE_API_URL` pour pointer vers Railway
2. **`server.js`** — Restreindre CORS au domaine Vercel via `FRONTEND_URL`
3. **`vercel.json`** — Ajouter la réécriture SPA pour React Router

Variables d'environnement à configurer sur Vercel :
```env
VITE_API_URL=https://votre-backend.railway.app
```

Variables d'environnement à configurer sur Railway :
```env
FRONTEND_URL=https://votre-app.vercel.app
GEMINI_API_KEY=votre_cle_google_gemini
```

> ⚠️ SQLite nécessite un **volume persistant** sur Railway pour conserver les données entre les redéploiements.
