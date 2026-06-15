# Sheltr

**Sheltr** is a mobile-first housing discovery app built for Section 8 voucher holders and landlords. It makes finding and leasing voucher-eligible homes faster and more intuitive — swipe through matched listings, schedule showings, apply with a digital packet, and message landlords in one place.

> *Tinder for Section 8 housing — faster than GoSection8.*

**Live demo:** [sheltr-mh.vercel.app](https://sheltr-mh.vercel.app)

---

## The problem

People with housing vouchers often spend weeks searching fragmented listing sites, calling landlords who may not accept Section 8, and juggling paperwork across email and phone. Landlords, meanwhile, struggle to reach qualified tenants and manage showings and applications efficiently.

Sheltr brings both sides onto a single platform with a modern, swipe-based experience designed for phones.

---

## What Sheltr does

### For tenants (voucher holders)

- **Onboarding** — Set voucher size, max rent, zip code, accessibility needs, and proximity preferences (transit, clinics, food banks).
- **Discover** — Swipe right to save listings, left to pass. Listings are ranked by relevance to your constraints.
- **Filters** — Narrow by rent, ground-floor units, and neighborhood.
- **Saved listings** — View saved homes in a list, map, or side-by-side compare (up to 3).
- **Schedule showings** — Pick a date, time, and contact method; landlord gets notified.
- **Apply** — Submit a digital application packet (voucher case number, employment, references) after a showing is accepted.
- **Messages** — Chat with landlords once a showing or application is accepted.
- **Notifications** — In-app toasts for showing confirmations, application updates, and new messages.

### For landlords

- **List properties** — Add photos (camera or library), rent, beds/baths, zip, neighborhood, transit, Section 8 status, and ground-floor flag.
- **Manage listings** — Publish, save as draft, deactivate, or remove units.
- **Applications inbox** — Review showing requests and full applications; accept or decline with an optional message.
- **Messages** — Reply to tenants in threaded conversations tied to showings or applications.
- **Unread badges** — See pending applications and unread messages at a glance.

### Cross-device demo sync

When deployed on Vercel with Upstash Redis, two phones can demo the full flow in real time: a tenant schedules a showing on one device, and the landlord sees it on another within seconds.

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router), React 19, TypeScript |
| Styling | Tailwind CSS v4 |
| Client state | Zustand + localStorage persistence |
| Auth | Supabase Auth (email/password, tenant & landlord roles) |
| Demo sync | Upstash Redis (optional; in-memory fallback locally) |
| Mobile | Capacitor (iOS) + Expo dev client shell |
| Hosting | Vercel |

---

## Getting started

### Prerequisites

- Node.js 20+
- npm

### Install and run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `.env.example` to `.env.local` and fill in:

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | For auth | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For auth | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | For auth | Server-side profile creation |
| `UPSTASH_REDIS_REST_URL` | For two-phone sync | Upstash Redis REST URL |
| `UPSTASH_REDIS_REST_TOKEN` | For two-phone sync | Upstash Redis token |

Without Supabase, demo mode still works with local state. Without Redis, sync is limited to a single server instance.

---

## Deploy to Vercel

1. Push this repo to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set the environment variables above under **Settings → Environment Variables**.
4. Deploy and share the `https://….vercel.app` URL.

For the two-phone hackathon demo, connect Upstash Redis so tenant and landlord devices stay in sync.

---

## Run on iPhone

**Safari (easiest):** Open your Vercel URL on the phone.

**Same Wi‑Fi dev server:**

```bash
npm run dev:phone
```

Then open `http://YOUR_MAC_IP:3000` in Safari, or sync Capacitor:

```bash
CAPACITOR_SERVER_URL=http://YOUR_MAC_IP:3000 npx cap sync ios
```

See `mobile/docs/DEPLOY_TO_IPHONE.md` for Expo dev client setup.

---

## Demo walkthrough

1. **Tenant** — Sign up → complete onboarding → Discover → save a listing → schedule a showing → wait for landlord accept → apply.
2. **Landlord** — Sign up → add/publish a listing → open Applications → accept showing → message tenant → accept application.
3. **Both** — Use the Messages tab after an accept; state syncs across devices when Redis is configured.

---

## Project structure

```
src/
  app/              # Next.js routes (discover, matches, landlord, auth, …)
  components/       # UI (discover cards, listing form, messages, nav)
  lib/              # Store, sync, auth, notifications, mock data
mobile/             # Expo dev client shell
ios/                # Capacitor iOS project
supabase/           # Database migrations (profiles)
```

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Next.js dev server |
| `npm run dev:phone` | Dev server + Capacitor IP sync |
| `npm run build` | Production build |
| `npm run start` | Run production server |
| `npm run ios:sync` | Sync web assets to Capacitor iOS |
| `npm run mobile:install` | Build Expo dev client to iPhone (USB) |

---

## License

Private hackathon project.
