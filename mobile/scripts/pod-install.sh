#!/bin/bash
set -euo pipefail

cd "$(dirname "$0")/.."
source scripts/ios-env.sh

echo "==> CocoaPods install (Doorway mobile)"
cd ios
pod install "$@"
echo "Done."
