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

### Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Serve the production build |
| `npm run lint` | ESLint |

> **Note:** This project runs on a **modified Next.js 16** build. Its APIs and file conventions can differ from public docs — consult `node_modules/next/dist/docs/` before relying on framework behaviour (see `AGENTS.md`).

---

## Architecture

**Same-origin BFF proxy.** The browser only ever talks to this Next.js app; the Next server is the *only* thing that talks to `test.api.marktcommerce.com`. The real API uses a **session cookie**, which is only reliable first-party — so the server forwards the incoming cookie to the API and re-issues whatever the API sets as our own first-party cookie (`src/lib/api/session.ts`, `src/lib/api/client.ts`).

- **Server Components** fetch page data directly on the server (forwarding the cookie).
- **Server Actions** (`'use server'`) handle every mutation, then `revalidatePath`.
- **Route Handlers** (`src/app/api/**`) exist only where the client must poll (e.g. chat messages).
- **No client store / no mock layer** — models are plain TypeScript types (`src/lib/types/*`), money/format helpers live in `src/lib/format.ts`, and `getSession()`/`requireSession()` (React `cache()`-memoized) replace any auth store.
- **Prices are in Nigerian naira** — always render via `formatNaira()`.

## App map

| Area | Route(s) | Notes |
|---|---|---|
| Public marketplace | `/` | Browse **before sign-up**. Product cards open a public preview (`/product/[id]`); buying/chat/cart prompt sign-in. Signed-in visitors are sent to `/app/marketplace`. |
| Auth | `/auth/{login,register,forgot-password,verify-email}` | Full-screen split layouts. Login has a **Buyer / Seller context switcher** — one account holds both roles; if you pick a role the account doesn't have, it errors and suggests the role you do have. |
| App shell | `/app/*` | Login-gated by `requireSession()` in `src/app/app/layout.tsx`. |
| Dashboard | `/app/dashboard` | Role-aware — sellers lead with their figures + onboarding. |
| Marketplace | `/app/marketplace` | Server-fetched grid, URL-driven filters, category + **sub-category** chips. |
| Inventory | `/app/media` | Sellers' **Inventory** — stock on hand, units ordered, low/out-of-stock; **Add/Edit product in a modal** with an image picker (the reusable media library). |
| Orders | `/app/orders` | **Role-aware:** buyers see "My Orders"; sellers see "Orders to fulfil" (`GET /orders/seller`). |
| Cart / Checkout | `/app/cart`, `/app/checkout` | Checkout collects recipient name + full address (offers your saved address), then Paystack. |
| Settings | `/app/settings` | Tabbed hub: Profile, Account, Address, **Billings** (wallet), Privacy, Danger zone. |
| Community | `/app/community/*` | Social feed, posts, comments, follow. |
| Payments | Paystack | `initializePayment` passes a `callback_url` back to the order-confirmation page. |

## Project structure

```
src/
  app/
    page.tsx                  # public marketplace (root)
    product/[id]/             # public product preview
    auth/                     # login (buyer/seller switcher), register, ...
    app/                      # the gated app (dashboard, marketplace, orders,
                              #   cart, checkout, settings, community, media=Inventory, ...)
    api/                      # Route Handlers (client-polling only)
  components/                 # ui/ (Button, Toaster, ...) + feature components
  lib/
    api/                      # client.ts, session.ts, + one module per domain
    types/                    # plain types per feature
    format.ts                 # formatNaira()
docs/backend/                 # specs to hand the backend team
```

## Backend notes / known gaps

- **Email notifications** are **not built server-side** yet — notifications are in-app + push only. Spec to hand the backend: **`docs/backend/email-notifications-spec.md`**.
- **`GET /media/`** is not reliably auth-scoped; the app passes `user_id` and filters client-side, but the endpoint still needs server-side gating.
- **Paystack** is unverified end-to-end (no test credentials). If buyers land off-app after paying, the backend's callback redirect must target `{web}/app/checkout/confirmation/{orderId}`.
