# Beauce Web Audit — Hub de Prospection

Outil interne pour gérer un pipeline de vente de refontes de sites web aux PME de la Beauce (Saint-Georges, QC).

## Stack

- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Vite
- LocalStorage pour la persistance

## Installation

```bash
npm install
npm run dev
```

Ouvre http://localhost:5173

## Build production

```bash
npm run build
```

Le dossier `dist/` contient le site statique.

## Fonctionnalités

- **Pipeline kanban** — 6 statuts (Prospect → Gagné/Perdu)
- **Fiche détaillée** — Note, problèmes, améliorations, contacts, historique
- **Générateur de messages** — Email, SMS, relance pré-remplis
- **Ajout d'entreprises** — Formulaire pour nouveaux prospects
- **Persistance** — Données sauvegardées dans le navigateur
- **4 entreprises pré-chargées** — Lapointe, Rénovation Chaudière, GL Électrique, Bourque Électrique
