#!/bin/bash
set -euo pipefail

# CleanWear-style alias — delegates to the full install script.
cd "$(dirname "$0")/.."
exec bash scripts/ios-install-on-iphone.sh
