# Beauce Web Audit

[🇬🇧 Read in English](README.en.md) · [📁 GitHub](https://github.com/Maaattqc/beauce-audit)

> 🌐 **[Voir la démo live](https://audit.mathieu-fournier.net)** — déployé sur audit.mathieu-fournier.net

> Hub de prospection commerciale pour la vente de refontes de sites web aux PME de la Beauce — scan automatique de sites, scoring sur 50 critères, gestion du pipeline de vente et envoi d'emails.

![React](https://img.shields.io/badge/React_18-61DAFB?style=flat&logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat&logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat&logo=vite&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat&logo=tailwindcss&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-339933?style=flat&logo=nodedotjs&logoColor=white)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat&logo=postgresql&logoColor=white)

## Pourquoi ce projet

Identifier manuellement des PME avec un site web désuet, évaluer leur potentiel, puis les contacter est un processus long. Ce hub automatise la découverte (scan de sites web), l'évaluation (score sur 50 critères), et le suivi commercial (pipeline CRM) — permettant de prospecter efficacement dans une région ciblée.

## Stack

### Frontend
| Tech | Usage |
|------|-------|
| React 18 + TypeScript | UI SPA |
| Vite | Build tool |
| Tailwind CSS + shadcn/ui | Styling |

### Backend
| Tech | Usage |
|------|-------|
| Node.js + Express | Serveur HTTP/REST |
| TypeScript (tsx) | Runtime direct sans compilation |
| `cheerio` | Web scraping / parsing HTML |
| `pg` | Client PostgreSQL |
| `resend` | Envoi d'emails transactionnels |
| Python (`search.py`) | Script de découverte de prospects |

### Base de données
| Tech | Usage |
|------|-------|
| PostgreSQL | Stockage prospects, scores, pipeline |
| SQLite | Cache local des scans |

## Features principales

- **Scan automatique** — Analyse ~50 critères sur chaque site (vitesse, mobile, SEO, sécurité, accessibilité)
- **Scoring + grade** — Note de A à F avec détail par catégorie (performance, design, contenu, technique)
- **Pipeline CRM** — Suivi des prospects: découverte → contacté → intéressé → client
- **Extraction de contacts** — Emails et téléphones extraits automatiquement du HTML des pages
- **Envoi d'emails** — Intégration Resend pour les campagnes de prospection
- **Scan batch** — Traitement par lots avec délai anti-blocage

## Ce que j'ai appris

- **Web scraping** avec Cheerio — parsing DOM, extraction de données structurées depuis HTML brut
- **Scoring algorithmique** — conception d'un système de notation multi-critères
- **Intégration PostgreSQL** — requêtes typesafe avec le driver `pg`
- **Pipeline de vente** — modélisation d'un flux CRM simple mais fonctionnel
- **Email automation** — intégration Resend pour l'envoi transactionnel

## Screenshots

![Page d'accueil](https://raw.githubusercontent.com/Maaattqc/beauce-audit/main/docs/screenshot-home.png)

## 🤖 Développement assisté par IA

Conçu et architecturé par moi — Claude Code a accéléré l'implémentation du moteur de scoring (50 critères) et la logique de scraping.

## Setup

```bash
git clone https://github.com/Maaattqc/beauce-audit.git
cd beauce-audit
cp .env.example .env
# Remplir DATABASE_URL, RESEND_API_KEY
npm install
npm run dev
```
