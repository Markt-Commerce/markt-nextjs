# Markt — Backend Action Items

**For:** Markt backend team · **From:** Markt web app · **Date:** 2026-09-05
**Status:** the web app is built and wired to the live API; the items below are the
backend-owned fixes and additions that stand between "good demo" and "people can
actually rely on this."

The login/register **500s are cleared** — auth, products, and socials work. What
remains is trust plumbing (email, payment proof, notifications), one security hole,
and a few data-shape fixes. Everything here is grounded in behaviour observed while
building the app, not guesswork; where something is unverified end-to-end it says so.

---

## How to read this

Each item has:
- **Severity** — BLOCKER (people abandon / money at risk), MAJOR (trust/friction),
  MINOR (livable).
- **What we see** — the observed behaviour from the app side.
- **What we need** — the concrete backend change.

Priority order is top to bottom.

---

## 1. [BLOCKER · SECURITY] `GET /media/` has no authentication

**What we see:** `GET /media/` returns every user's uploaded files with zero auth.
The web app mitigates by passing `?user_id=` and filtering client-side, but the raw
endpoint still exposes all users' media to anyone.

**What we need:**
- Require authentication on `GET /media/`.
- Scope results to the authenticated user server-side (don't trust a client
  `user_id` param for authorization).
- If some media must be public (e.g. product images on the public marketplace),
  expose those through a *separate, intentionally-public* read path (e.g. product
  payloads already carrying image URLs) rather than an open list of everyone's files.

**Why first:** this is a live data-exposure bug, independent of any feature work.

---

## 2. [BLOCKER] Payment round-trip is unproven / lands off-app

**What we see:** After paying via Paystack, a real payment did **not** return to the
app — the observed result was a 404, because the backend's Paystack callback
redirected somewhere off-app. The web app now passes a `callback_url` on initialize
(and mirrors it in `metadata.callback_url`), but the documented
`POST /payments/initialize` body doesn't officially accept one, so the backend may
be ignoring it.

**What we need:**
- Honor a `callback_url` on `POST /payments/initialize` **or** configure the
  Paystack redirect target server-side to:
  `{web_origin}/app/checkout/confirmation/{order_id}?paid=1`
- After Paystack redirects back, the order/payment state must be verifiable
  (`GET /payments/verify` or equivalent) so the confirmation page can show a true
  "payment received" rather than an optimistic one.
- Provide **test credentials / a sandbox key** so we can prove one full round-trip
  (initialize → pay → return → verified). Right now this can't be tested at all.

**Definition of done:** one real payment starts in the app and lands back on the
confirmation page showing verified success.

---

## 3. [BLOCKER] No transactional email anywhere

**What we see:** Nothing is emailed — no order confirmation, no "shipped", no
receipt, no payment success. Email verification itself isn't wired to the app's own
branded email system. People do not trust money-in-an-app with zero email trail.

**What we need:** add **email as a delivery channel on the existing notification
pipeline** (do not build a parallel email system). Full spec already written:
**`docs/backend/email-notifications-spec.md`** — covers the fan-out design,
preference endpoints, category model, digest vs immediate, templates, deliverability
(SPF/DKIM/DMARC, bounces, idempotency), and compliance.

Minimum to start: email on **order placed, shipped, delivered, and payment success**,
only to **verified** addresses.

---

## 4. [MAJOR] State changes don't notify the other party (no notification is even created)

**What we see:** This is the gap behind #3 and #5. Several transitions change state
**without creating a notification**, so email/push have nothing to fan out from:
- A seller advances an item (`PATCH /orders/seller/items/{id}`) → the **buyer** gets
  nothing. No "your order is being prepared / shipped / delivered."
- A buyer places an order → the **seller** gets no "new order to prepare."
- Payment success/failure, payout, refund → no notification.

**What we need:** on each of those transitions, **create an in-app `Notification`**
(which then fans out to push/email per prefs), carrying `reference_type` +
`reference_id` (e.g. `order` + order id) so the app deep-links correctly. Trigger
points are enumerated in §3.1 of the email spec.

**Definition of done:** seller marks an item shipped → buyer immediately has an
in-app notification (and, once #3 ships, an email).

---

## 5. [MAJOR] Order-level status lags its items (server-side rollup missing)

**What we see:** Sellers advance **items** (`PATCH /orders/seller/items/{id}`), but
the **order-level** `status` doesn't roll up, so it lags behind. The web app
compensates by deriving the shown status from the items' progress (an order is only
as far along as its least-advanced item) — but the underlying data is inconsistent.

**What we need:** roll the order's `status` up from its items server-side so
`GET /orders/{id}.status` reflects real progress. Suggested rule: order status =
the **least-advanced** item's status (all shipped → order shipped; all delivered →
delivered). This also makes #4's buyer notifications accurate.

---

## 6. [MAJOR] Email-verification gate causes onboarding drop-off

**What we see:** A new account **cannot sign in until its email is verified**
(backend returns 403). If the verification email is slow, unbranded, or lands in
spam, this is where new users bounce — the single biggest onboarding risk.

**What we need:**
- Send the verification email **fast**, first-party and branded (ties into #3's ESP
  + SPF/DKIM/DMARC).
- A reliable **resend** endpoint that doesn't rate-limit a legitimate first resend
  into a dead-end.
- Confirm the exact contract the app should show: is the 403 distinguishable as
  "unverified" vs "bad credentials"? We need a clear, machine-readable reason so the
  app can route the user straight to the verify-email screen instead of showing a
  generic login error.

---

## 7. [MINOR] Data-shape gaps that limit the UI

Small backend additions that unlock better screens:

- **Follow state on lists.** `GET /socials/...` suggestion/people lists don't carry a
  per-user `is_followed` flag, so "People to follow" still shows *Follow* after you
  follow + refresh. (Single-profile `GET` already returns `is_followed` — we use it.)
  Please add `is_followed` to the user objects in follow/suggestion lists.
- **Category on the product payload.** The product list payload doesn't expose the
  product's category, so the inventory table can't show a category per row and the
  parent-category filter can't include children. Include `category_ids` (or a small
  category summary) on listed products.
- **Seller metrics period.** Seller stats expose lifetime "units ordered" only.
  A period (last 30 days) on `GET /orders/seller/stats` would let us show trend, not
  just a lifetime count.

---

## 8. [MINOR] Whole domains exist in the API but have no events/notifications wired

The delivery/rider + POD domain, wallet payout, and refund/return flows exist as
endpoints but don't emit notifications (see #4) and, for delivery, there's no
independent "delivered" confirmation feeding back to the order. When these start
emitting events, the app can surface true delivery confirmation and payout status
instead of relying on the seller manually marking "delivered."

---

## Summary — what would most make the app better

The interface is done and production-shaped. **Almost every remaining "would I
actually use this?" gap is backend trust plumbing, not UI.** In order of impact:

1. **Close the security hole** — auth-gate `GET /media/` (#1).
2. **Prove one payment** end-to-end back into the app, with test creds (#2).
3. **Turn on transactional email**, starting with orders + payments (#3) — spec is
   ready in `email-notifications-spec.md`.
4. **Emit a notification on every state change** so buyers and sellers actually hear
   about each other's actions (#4).
5. **Roll order status up from items** so tracking is truthful server-side (#5).
6. **Make email verification fast, branded, and clearly signalled** to cut
   onboarding drop-off (#6).

Do 1–4 and Markt crosses from "impressive demo" to "a marketplace a stranger can
trust with a purchase." 5–6 remove the last visible rough edges; 7–8 are polish that
unlocks nicer screens once the essentials are in.
