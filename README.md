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
