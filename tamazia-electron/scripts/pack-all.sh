#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

APP_NAME="tamazia-iphone-monitor"
OUT_DIR="$ROOT/out"
ASSETS_DIR="$ROOT/assets"
CHANGELOG="$ROOT/changelog.json"

if [ ! -f "$CHANGELOG" ]; then
  echo "Erreur : changelog.json introuvable" >&2
  exit 1
fi

PLATFORMS=(
  "linux:x64"
  "linux:arm64"
  "win32:x64"
  "win32:arm64"
  "darwin:x64"
  "darwin:arm64"
)

for entry in "${PLATFORMS[@]}"; do
  platform="${entry%%:*}"
  arch="${entry##*:}"
  echo "=> Build $APP_NAME ($platform / $arch)"
  npx electron-packager . "$APP_NAME" \
    --platform="$platform" \
    --arch="$arch" \
    --out="$OUT_DIR" \
    --overwrite
  build_dir="$OUT_DIR/${APP_NAME}-${platform}-${arch}"
  if [ -d "$build_dir" ]; then
    cp "$CHANGELOG" "$build_dir/" 2>/dev/null || true
    if [ -f "$ASSETS_DIR/icon.png" ]; then
      cp "$ASSETS_DIR/icon.png" "$build_dir/" 2>/dev/null || true
    fi
    if [ "$platform" = "linux" ] && [ -f "$ROOT/../Tamazia.desktop" ]; then
      cp "$ROOT/../Tamazia.desktop" "$build_dir/" 2>/dev/null || true
    fi
  fi
done

echo "Tous les builds sont prets dans $OUT_DIR"
