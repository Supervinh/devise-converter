#!/usr/bin/env bash
# Build un APK Android via expo prebuild + Gradle (sans EAS, sans compte Expo).
set -euo pipefail

VERSION="${1:-dev}"
OUT_DIR="$(pwd)/build"
mkdir -p "$OUT_DIR"

echo ">> expo prebuild (android)"
npx expo prebuild --platform android --no-install --clean

echo ">> gradle assembleRelease"
cd android
chmod +x ./gradlew
./gradlew assembleRelease --no-daemon

APK_SRC="app/build/outputs/apk/release/app-release.apk"
if [[ ! -f "$APK_SRC" ]]; then
  # release non signé : Gradle produit -unsigned.apk ; on retombe sur le debug
  APK_SRC="$(ls app/build/outputs/apk/release/*.apk 2>/dev/null | head -n1 || true)"
fi

if [[ -z "${APK_SRC}" || ! -f "${APK_SRC}" ]]; then
  echo "APK introuvable, fallback sur assembleDebug"
  ./gradlew assembleDebug --no-daemon
  APK_SRC="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ..
cp "android/${APK_SRC}" "${OUT_DIR}/converter-${VERSION}.apk"
echo ">> APK : ${OUT_DIR}/converter-${VERSION}.apk"
