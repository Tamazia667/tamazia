#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

APP_NAME="tamazia-iphone-monitor"
VERSION="$(node -p "require('./package.json').version")"
OUT_DIR="$ROOT/out"
RELEASE_DIR="$ROOT/release"
ZIP_NAME="tamazia-iphone-monitor-${VERSION}-all-os.zip"

rm -rf "$RELEASE_DIR"
mkdir -p "$RELEASE_DIR"

if [ ! -d "$OUT_DIR" ]; then
  echo "Build des binaires..."
  npm run pack:all
fi

echo "Preparation des livrables pour la version $VERSION"

pkg_build() {
  local platform="$1" arch="$2" src="$3" dst="$4"
  if [ ! -d "$src" ]; then
    echo "Manquant : $src (ignore)"
    return
  fi
  case "$platform" in
    linux)
      cp -r "$src" "$RELEASE_DIR/$dst"
      chmod +x "$RELEASE_DIR/$dst/$APP_NAME" 2>/dev/null || true
      ;;
    darwin)
      cp -r "$src" "$RELEASE_DIR/$dst"
      chmod +x "$RELEASE_DIR/$dst/Contents/MacOS/$APP_NAME" 2>/dev/null || true
      ;;
    win32)
      cp -r "$src" "$RELEASE_DIR/$dst"
      ;;
  esac
  echo "Livrable : $dst"
}

pkg_build linux   x64   "$OUT_DIR/${APP_NAME}-linux-x64"     "tamazia-linux-x64"
pkg_build linux   arm64 "$OUT_DIR/${APP_NAME}-linux-arm64"   "tamazia-linux-arm64"
pkg_build win32   x64   "$OUT_DIR/${APP_NAME}-win32-x64"     "tamazia-win-x64"
pkg_build win32   arm64 "$OUT_DIR/${APP_NAME}-win32-arm64"   "tamazia-win-arm64"
pkg_build darwin  x64   "$OUT_DIR/${APP_NAME}-darwin-x64"    "tamazia-mac-x64"
pkg_build darwin  arm64 "$OUT_DIR/${APP_NAME}-darwin-arm64"  "tamazia-mac-arm64"

cp "$ROOT/changelog.json" "$RELEASE_DIR/" 2>/dev/null || true
cp "$ROOT/../README.md" "$RELEASE_DIR/" 2>/dev/null || true

cd "$RELEASE_DIR"
echo "Creation de l'archive unique : $ZIP_NAME"
zip -r -q "$ZIP_NAME" .

echo "Release prete dans : $RELEASE_DIR"
ls -lh "$RELEASE_DIR"

echo "Publication Git : tag + release GitHub"
cd "$ROOT"
TAG="v$VERSION"
NOTES="$(node -e "const c=require('./changelog.json'); const e=c.find(x=>x.version==='$VERSION'); console.log((e?e.changes:[ ]).map(l=>'- '+l).join('\n'));")"

git add -A
git commit -m "Release $TAG" || true
git tag -a "$TAG" -m "Tamazia $TAG

$NOTES"
git push origin HEAD --tags

if command -v gh >/dev/null 2>&1; then
  gh release create "$TAG" \
    --title "Tamazia $TAG" \
    --notes "$NOTES" \
    "$RELEASE_DIR/$ZIP_NAME"
  echo "Release GitHub $TAG cree."
else
  echo "gh non disponible : tag pousse, cree la release manuellement."
fi
