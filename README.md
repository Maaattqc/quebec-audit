# Beauce Web Audit — Hub de Prospection

Plateforme de prospection et de gestion commerciale conçue pour piloter un pipeline de vente de refontes de sites web destiné aux PME de la région de la Beauce (Saint-Georges, QC). Elle centralise le suivi des prospects, la prise de contact et le cycle de vente complet, du premier audit jusqu'à la conclusion du contrat.

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
