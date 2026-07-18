# Tamazia

Outils de detection et surveillance d'iPhone via libimobiledevice, multi-OS.

## Composants

- `tamazia` : CLI bash de detection (Linux)
- `tamazia-gui` : interface graphique GTK4/Adwaita (Linux)
- `tamazia-electron/` : application Electron + React (Linux, Windows, macOS)

## Installation rapide

    ./tamazia-setup install

## Commandes setup

    tamazia-setup install     Installe les outils
    tamazia-setup deps        Installe libimobiledevice
    tamazia-setup build       Compile l'app Electron
    tamazia-setup pack        Genere les binaires tous OS/arch
    tamazia-setup release     Cree la release GitHub (gh)
    tamazia-setup uninstall   Supprime les outils

## Build manuel (Electron)

    cd tamazia-electron
    npm install
    npm run pack:all
    npm run release

## Dependances systeme

libimobiledevice-utils (idevice_id, ideviceinfo) requis sur toutes les plateformes.

## Architectures supportees

linux-x64, linux-arm64, win32-x64, win32-arm64, darwin-x64, darwin-arm64.

## Release

La release produit un seul zip global (`tamazia-iphone-monitor-X.Y.Z-all-os.zip`)
et les dossiers executables/setup directs par OS dans `tamazia-electron/release/`.
