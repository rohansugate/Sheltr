# Sheltr

Section 8 housing discovery app — swipe listings, schedule showings, apply, and message landlords. Built for hackathon demo with tenant + landlord flows and two-phone sync.

## Stack

- **Next.js 16** (App Router), TypeScript, Tailwind v4
- **Zustand** + localStorage for client state
- **Upstash Redis** for cross-device demo sync (optional locally)
- **Capacitor** + **Expo** shells for iPhone (optional)

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Run on iPhone (same Wi‑Fi)

```bash
npm run dev:phone
```

Then rebuild from Xcode (`ios/App`) or open Safari → `http://YOUR_MAC_IP:3000`.

See `mobile/docs/DEPLOY_TO_IPHONE.md` for Expo dev client setup.

## Deploy to Vercel (GitHub → Vercel)

1. Push this repo to GitHub (GitHub Desktop → **Publish repository**).
2. Import the repo in [Vercel](https://vercel.com/new).
3. **Root directory:** leave as `.` (repo root is the Next.js app).
4. **Build command:** `npm run build` (default)
5. **Environment variables** (Vercel → Settings → Environment Variables):

| Variable | Required | Notes |
|----------|----------|--------|
| `UPSTASH_REDIS_REST_URL` | For two-phone sync | Create free DB at [Upstash](https://upstash.com) |
| `UPSTASH_REDIS_REST_TOKEN` | For two-phone sync | From same Upstash database |

Copy names from `.env.example`. Without Redis, sync falls back to in-memory (single server instance only).

6. Deploy. Share the `https://….vercel.app` URL on phones for demo.

### Phone after Vercel deploy

- **Safari:** open your Vercel URL (easiest).
- **Capacitor:** `CAPACITOR_SERVER_URL=https://your-app.vercel.app npx cap sync ios` then Xcode Run.
- **Expo shell:** enter Vercel URL in the Sheltr dev client.

## Scripts

| Command | Purpose |
|---------|---------|
| `npm run dev` | Next.js dev server |
| `npm run dev:phone` | Dev server + Capacitor IP sync |
| `npm run build` | Production build |
| `npm run mobile:install` | Expo dev client → iPhone (USB) |

## Demo flow

1. **Tenant:** onboarding → Discover → showing → apply  
2. **Landlord:** publish listing → accept application  
3. **Both:** Messages tab (opens after accept; syncs via Redis on Vercel)

## License

Private / hackathon project.
