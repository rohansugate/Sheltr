#!/bin/bash
set -euo pipefail

# Single entry point: install Doorway dev client on iPhone.
# Usage:
#   bash scripts/install-iphone.sh          # local USB build (CleanWear path)
#   bash scripts/install-iphone.sh --eas    # cloud build (no USB compile)
#   bash scripts/install-iphone.sh --wait   # poll until USB connects, then build

cd "$(dirname "$0")/.."
source scripts/ios-env.sh

MODE="local"
if [[ "${1:-}" == "--eas" ]]; then
  MODE="eas"
elif [[ "${1:-}" == "--wait" ]]; then
  MODE="wait"
fi

device_online() {
  bash scripts/ios-device-online.sh
}

wait_for_device() {
  echo "==> Waiting for iPhone over USB..."
  echo "    Plug in · unlock · Trust · Developer Mode ON"
  echo
  local tries=0
  while ! device_online; do
    tries=$((tries + 1))
    if [ "$tries" -ge 60 ]; then
      echo "Timed out. Open Xcode → Window → Devices and Simulators."
      exit 1
    fi
    printf "\r  waiting... %ds " $((tries * 5))
    sleep 5
  done
  echo
  echo "✔ iPhone connected"
  echo
}

install_local() {
  echo "==> Doorway — local install (Xcode + USB)"
  echo "    Same path as CleanWear: expo run:ios --device"
  echo

  bash scripts/pod-install.sh

  if ! device_online; then
    echo "⚠️  iPhone is offline — Xcode cannot install yet."
    echo
    xcrun xctrace list devices 2>/dev/null | sed -n '/== Devices ==/,/== Simulators ==/p' || true
    echo
    echo "YOU need to do this (takes ~1 minute):"
    echo "  1. Plug iPhone into Mac with USB cable"
    echo "  2. Unlock phone → tap Trust This Computer"
    echo "  3. Settings → Privacy & Security → Developer Mode → ON"
    echo "  4. Xcode → Window → Devices and Simulators → status = Connected"
    echo
    echo "Then run ONE of:"
    echo "  npm run mobile:install          # build immediately"
    echo "  npm run mobile:wait             # wait for USB, then build"
    echo
    echo "Or press ▶ in Xcode:"
    echo "  open ios/Doorway.xcworkspace"
    exit 1
  fi

  echo "Building & installing (5–15 min first time)..."
  npx expo run:ios --device

  echo
  echo "✔ Doorway should be on your iPhone."
  echo
  echo "Next — start the web app on your Mac:"
  echo "  cd .. && npm run dev -- --hostname 0.0.0.0"
  echo "In Doorway app: http://YOUR_MAC_IP:3000 → Connect"
}

install_eas() {
  echo "==> Doorway — EAS cloud install (no local Xcode compile)"
  echo "    Run this in Terminal.app — Apple will ask you to sign in."
  echo

  if ! npx eas-cli whoami >/dev/null 2>&1; then
    npx eas-cli login
  fi

  echo "Step 1: Register iPhone (open link ON YOUR PHONE)"
  npx eas-cli device:create

  echo
  echo "Step 2: Cloud build (~10–20 min). Choose: Let EAS handle credentials."
  npx eas-cli build --profile development --platform ios

  echo
  echo "Step 3: Scan QR on iPhone to install."
  echo "Then: cd .. && npm run dev -- --hostname 0.0.0.0"
  echo "In Doorway app: http://YOUR_MAC_IP:3000"
}

case "$MODE" in
  eas)   install_eas ;;
  wait)  wait_for_device; install_local ;;
  *)     install_local ;;
esac
