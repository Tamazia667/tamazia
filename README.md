# Tamazia — Tamazia iPhone Monitor

Tamazia est une application Electron + React pour la détection et la gestion d'appareils iPhone connectés.

Ce dépôt contient le paquet `tamazia` avec l'application Electron à la racine du projet.

## Objectifs de cette release
- Version: v1.0.0
- Réinitialisation du projet et publication initiale
- Packaged en version Linux x64 via `electron-packager`

## Installation (développement)
Prerequis:
- Node.js (>=18)
- npm

À la racine du dépôt:

```bash
npm install
npm run dev
```

## Build de production
Pour compiler l'application et préparer le packaging localement :

```bash
npm run build:prod
```

Pour créer un paquet Linux localement :

```bash
npm run package:linux
```

Les artefacts sont générés dans `out/`.

## CI / Release
Ce dépôt contient deux workflows GitHub Actions :

- `.github/workflows/ci.yml` : build de la branche principale à chaque push/PR
- `.github/workflows/release-build.yml` : packaging multi-plateforme automatique sur push de tag `v*`

Le workflow de release construit les paquets sur Ubuntu, macOS et Windows, puis crée ou met à jour la Release GitHub associée.

## Fichiers de configuration d'environnement
Un fichier `.env.example` est fourni à la racine. Copiez-le en `.env` localement et adaptez les valeurs.

## Contribution
Merci de contribuer !
- Ouvrez une issue pour discuter d'un changement
- Créez une branche `feature/` ou `fix/`
- Ouvrez une PR ciblant `main`

## Sécurité
Ne stockez jamais de tokens GitHub en clair dans le dépôt. Utilisez `GITHUB_TOKEN` ou des secrets GitHub Actions.

---

