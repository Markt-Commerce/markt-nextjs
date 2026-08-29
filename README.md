# Markt

**A marketplace with a pulse.**

Shopping, the way it connects us — Markt is a social-first commerce platform where you discover products through people, not sterile listings. Follow sellers and curators whose taste you trust, ask questions before you buy, watch a find get discovered in real time, and buy with the context and confidence that comes from a real community instead of a wall of anonymous product tiles.

Buying and selling live on one account: browse and check out as a buyer, then switch to a seller profile to list products, manage a shop, chat with buyers, respond to buy requests with offers, and track orders and payouts — all without juggling separate apps.

---

## For Developers

### Prerequisites

- **Node.js 20.9+** (required by Next.js 16 — earlier versions aren't supported)
- npm (or yarn/pnpm/bun, but the commands below use npm)

### 1. Clone and install

```bash
git clone <this-repo-url>
cd markt-nextjs
npm install
```

### 2. Configure the API

This app talks to a real backend, not mock data. Create `.env.local` in the project root (it's gitignored — you won't find one already there):

```bash
API_BASE_URL=https://test.api.marktcommerce.com/api/v1
```

### 3. Run it

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 4. Sign in

**Real login and register are currently broken on the backend** (a database migration issue on their end — see [`NEXTJS_NATIVE_REWRITE.md`](./NEXTJS_NATIVE_REWRITE.md) for details, and don't spend time debugging it locally, it isn't this app's code). Until that's fixed, use the amber banner on the [login page](http://localhost:3000/auth/login) — **"Continue as mock buyer"** or **"Continue as mock seller"** — to get into the app without a real account. This sets a local-only session cookie and skips the real backend's auth entirely; every other page still talks to the real API normally.

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build + typecheck |
| `npm run start` | Serve a production build (`build` first) |
| `npm run lint` | ESLint |

### Before you write code here

This is **Next.js 16**, not the Next.js you're used to from training data — App Router conventions, caching defaults, and several APIs changed from earlier versions (see `AGENTS.md`, which points at `node_modules/next/dist/docs/` for the version actually installed). Read the relevant guide there before assuming how something works.

### Project structure, in short

- `src/app/` — routes. Pages are Server Components by default; `'use client'` only where something is genuinely interactive.
- `src/lib/api/` — the only code that calls the real backend (`client.ts`, plus one file per domain: `products.ts`, `cart.ts`, `orders.ts`, etc.). The browser never talks to the backend directly — see `src/lib/api/session.ts` for why.
- `src/lib/types/` — plain TypeScript types matching the real API's schemas. No classes.
- `src/app/**/actions.ts` — Server Actions, one file per route that needs mutations.
- `src/components/` — shared UI (`ui/` for primitives, `marketplace/` for feature components).

