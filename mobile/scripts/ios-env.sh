#!/bin/bash
set -euo pipefail

# React Native prebuilt tarballs break when the project path contains spaces
# (e.g. "hackaton v2"). Build deps from source instead.
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export RCT_USE_RN_DEP=0
export RCT_USE_PREBUILT_RNCORE=0
