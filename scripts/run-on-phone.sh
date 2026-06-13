#!/usr/bin/env bash
set -euo pipefail

cd "$(dirname "$0")/.."

PORT="${PORT:-3000}"
IP="$(ipconfig getifaddr en0 2>/dev/null || ipconfig getifaddr en1 2>/dev/null || echo "127.0.0.1")"
URL="http://${IP}:${PORT}"

echo "→ Doorway phone setup"
echo "  Mac IP:  ${IP}"
echo "  URL:     ${URL}"
echo ""
echo "1. Keep this terminal running (dev server)"
echo "2. In another terminal: CAPACITOR_SERVER_URL=${URL} npm run ios:sync"
echo "3. In Xcode: open ios/App, select your iPhone, press Run (▶)"
echo "4. On iPhone: Settings → Doorway → Local Network → ON (if prompted)"
echo ""

export CAPACITOR_SERVER_URL="${URL}"
npx cap sync ios 2>/dev/null || true

npm run dev -- --hostname 0.0.0.0 --port "${PORT}"
