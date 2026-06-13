# Deploy Doorway to iPhone

Doorway uses a **two-layer** setup during development:

| Layer | What it is | Where it runs |
|-------|------------|---------------|
| **Web app** | Next.js UI, Zustand, sync, all product logic | Mac — port **3000** |
| **Mobile shell** | Expo dev client — server picker + WebView | iPhone — installed once |

This is **not** Expo Go. The shell is a **custom dev client** (`expo-dev-client`) because we ship native code (WebView, AsyncStorage).

---

## The big idea (same as CleanWear)

1. **Install the native shell once** on your phone (compiled via Xcode or EAS).
2. **Run a dev server on your Mac** so the app loads over Wi‑Fi.

**Difference from CleanWear:** CleanWear’s daily server is Metro (`npm start -- --dev-client`). Doorway’s daily server is **Next.js** (`npm run dev -- --hostname 0.0.0.0`). You only need Metro if you’re editing files under `mobile/`.

---

## Path A — Xcode + free Apple ID (recommended)

Free. Install expires about **every 7 days** → rebuild.

### One-time per machine

| Step | What |
|------|------|
| Mac with **Xcode** | Apple build toolchain |
| **CocoaPods** (`pod`) | `brew install cocoapods` if missing |
| iPhone on **USB**, unlocked, **Trust** this Mac | |
| **Developer Mode** on iPhone | Settings → Privacy & Security → Developer Mode |

### Install on phone

From the **doorway** root:

```bash
npm run mobile:install
```

Or from `mobile/`:

```bash
./scripts/xcode-install-on-iphone.sh
# same as: npm run ios:install
```

**First time Xcode asks:**

- Sign in with your **Apple ID** (free is fine)
- Team: **Personal Team**
- **Automatically manage signing** ✓

First build can take **5–15 minutes**.

### Daily development (normal Doorway work)

**Terminal 1 — Next.js (required):**

```bash
cd doorway
npm run dev -- --hostname 0.0.0.0
```

Find your Mac IP:

```bash
ipconfig getifaddr en0
```

**On iPhone:** open **Doorway** → enter `http://YOUR_MAC_IP:3000` → **Connect**.

Phone and Mac must be on the **same Wi‑Fi**.

### Daily development (only if editing the mobile shell)

If you change `mobile/app/*` or other RN code:

```bash
cd doorway/mobile
npm start
# or: npm start -- --dev-client
```

### When the app won’t open (~7 days)

```bash
npm run mobile:install
```

### Troubleshooting

**CocoaPods / Podfile.lock out of sync**

```bash
cd doorway/mobile && npm run pod:install
```

**Project path has a space** (`hackaton v2`)

React Native prebuilt tarballs break on spaced paths. `pod:install` and `mobile:install` already force build-from-source (`RCT_USE_RN_DEP=0`, `RCT_USE_PREBUILT_RNCORE=0`).

**`xcodebuild` error 70 — device not found**

Xcode doesn’t see your iPhone as online. Check:

```bash
xcrun xctrace list devices
```

Fix: USB cable, unlock phone, Trust, Developer Mode ON, Xcode → Window → Devices and Simulators → wait for **Connected**.

**Or build from Xcode directly**

```bash
open doorway/mobile/ios/Doorway.xcworkspace
```

Select your iPhone → Run (▶).

---

## Path B — EAS cloud build (no local Xcode compile)

Expo’s servers build the `.ipa`; you install via QR/link.

### One-time

```bash
cd doorway/mobile
npx eas-cli login
npx eas-cli init          # adds projectId to app.json — new per project
npx eas-cli device:create # register iPhone
```

`eas.json` already has a **development** profile.

### Build + install

```bash
npm run eas:install
# or: npm run build:ios:dev
```

Scan the QR on your iPhone when the build finishes.

### Then same daily flow

```bash
cd doorway && npm run dev -- --hostname 0.0.0.0
```

Open Doorway on phone → connect to `http://YOUR_MAC_IP:3000`.

---

## Doorway vs CleanWear

| Setting | CleanWear | Doorway |
|---------|-----------|---------|
| Bundle ID | `com.rohansugate.cleanwear` | `com.doorway.app.mobile` |
| Daily dev server | `npm start -- --dev-client` (Metro) | `npm run dev -- --hostname 0.0.0.0` (Next.js) |
| What phone loads | RN screens from Metro | WebView → Next.js on :3000 |
| Local install | `npx expo run:ios --device` | `npm run mobile:install` |
| EAS projectId | CleanWear’s UUID | Run `eas init` for Doorway |

---

## Short recipe

**First time:**

```bash
cd doorway
npm install
cd mobile && npm install && cd ..
npm run mobile:install          # USB iPhone, trust Mac, Developer Mode
npm run dev -- --hostname 0.0.0.0
# on phone: http://YOUR_MAC_IP:3000
```

**Every coding session:**

```bash
npm run dev -- --hostname 0.0.0.0
# open Doorway app → Connect (saved URL is remembered)
```

**App expired / won’t launch:**

```bash
npm run mobile:install
```

**Skip native entirely (fastest demo):**

Open Safari on iPhone → `http://YOUR_MAC_IP:3000` (same Wi‑Fi, no install).

---

## `app.json` essentials (Doorway)

```json
{
  "expo": {
    "name": "Doorway",
    "slug": "doorway",
    "ios": {
      "bundleIdentifier": "com.doorway.app.mobile",
      "infoPlist": {
        "NSAppTransportSecurity": { "NSAllowsLocalNetworking": true }
      }
    },
    "plugins": ["expo-router", "expo-dev-client"]
  }
}
```

`NSAllowsLocalNetworking` lets the WebView load `http://192.168.x.x:3000`.

After `eas init`, add:

```json
"extra": { "eas": { "projectId": "your-new-uuid" } }
```

---

## What each piece does

| Piece | Role |
|--------|------|
| `expo-dev-client` | Custom native app on phone (not Expo Go) |
| `npm run mobile:install` | CocoaPods sync + Xcode build + install |
| `npm run dev -- --hostname 0.0.0.0` | Next.js — the actual Doorway app |
| `mobile/app/index.tsx` | Server URL picker on phone |
| `mobile/app/browse.tsx` | WebView that loads Next.js |
| `bundleIdentifier` | Apple app ID — unique per project |
| `eas build` | Cloud compile when local Xcode is painful |
