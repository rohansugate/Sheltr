#!/bin/bash
set -euo pipefail

# Returns 0 if at least one physical iOS device is online for Xcode builds.

if xcrun xctrace list devices 2>/dev/null | awk '/^== Devices ==$/,/^== Devices Offline ==$/' | grep -q "iPhone\|iPad"; then
  exit 0
fi

if xcrun devicectl list devices 2>/dev/null | awk 'NR>1 && $0 !~ /unavailable/ && $0 ~ /iPhone|iPad/' | grep -q .; then
  exit 0
fi

exit 1
