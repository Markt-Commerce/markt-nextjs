# Markt — Backend Action Items

**For:** Markt backend team · **From:** Markt web app · **Date:** 2026-11-20
(current snapshot — supersedes the 2026-10-03 revision)
**Status:** the web app is built and wired to the live API. This is a fresh pass
against the live OpenAPI spec (281 paths / 472 operations as of this date) plus
behaviour observed while using the app. It lists what you've since shipped, one
new regression, and the trust-plumbing items that still stand between "good demo"
and "people can rely on this." Where something can't be verified from the public
spec (auth-gating, whether an event fires), it says so rather than guessing.

---

## Status at a glance

| # | Item | Severity | Status |
|---|------|----------|--------|
| 0 | `GET /payments/` returns 500 | BLOCKER | **NEW — open** |
| 1 | `GET /media/` has no auth | BLOCKER·SEC | **Partial** (scoped read paths added; flat list auth unverified) |
| 2 | Payment round-trip lands off-app | BLOCKER | **Mostly done** (callback + verify shipped; needs test creds) |
| 3 | No transactional email | BLOCKER | **Open** (no email channel seen) |
| 4 | State changes don't notify the other party | MAJOR | **Unverified** (can't see events from spec) |
| 5 | Order status lags its items | MAJOR | **Unverified** |
| 6 | Email-verification gate / resend | MAJOR | **Done** (send + verify endpoints live) |
| 7 | Data-shape gaps | MINOR | **Partial** |
| 9 | Seller application review flow | MAJOR | **Open** (still instant `create-seller`) |

---

## 0. [BLOCKER · NEW] `GET /api/v1/payments/` returns 500

**What we see:** `GET /payments/` responds **500 with an empty body (`{}`)**. This is
the endpoint that lists a user's payments; the web app used it to locate the
payment for an order on the post-checkout confirmation screen.

**Impact:** on its own this blinds the confirmation page's "verify on return" step —
it can't find the order's payment to confirm it. (The web app has since routed
around this by threading the `payment_id` from `/payments/initialize` through the
checkout round-trip and calling `GET /payments/{id}` directly, so we're no longer
*blocked* by it — but the list endpoint is still broken and anything else that
needs it, e.g. a payments history screen, will fail.)

**What we need:** fix the unhandled error on `GET /payments/` (most likely a
serialization issue on one of the payment records or the list wrapper). A 500 with
no body gives us nothing to act on — if there's a shape we're sending wrong, a 422
with a field would help; if it's server-side, it just needs the fix.

---

## 1. [BLOCKER · SECURITY] `GET /media/` authentication — partially addressed

**Progress:** you've added the *scoped, intentionally-public* read paths we asked
for — `GET /media/products/{id}/images`, `/media/social-posts/{id}/media`,
`/media/requests/{id}/images`. That's the right shape for public product/post
images.

**Still needed / unverified:** the flat `GET /media/` list still exists. We can't
tell from the public spec whether it now requires auth and scopes to the caller.
Please confirm `GET /media/` is authenticated and server-scoped to the
authenticated user (not trusting a client `user_id`), so it can't enumerate every
user's uploads.

---

## 2. [BLOCKER] Payment round-trip — mostly done, two things remain

**Shipped since last review (thank you):**
- `GET /payments/callback/{payment_id}` — "redirects to the mobile app or web
  app." This is the server-owned Paystack redirect we asked for.
- `GET /payments/{payment_id}/verify` — lets us confirm state on return.
- `POST /payments/checkout/initialize` — payment-first checkout (reserves stock,
  creates the Order only after payment). Noted; not yet wired on web.

**Contract we've now adopted (no action needed, just confirming):** `PaymentCreate`
has no top-level `callback_url`, and the API now **rejects unknown top-level fields
with a 422** (`callback_url: Unknown field`). We've moved our redirect hint into
`metadata` accordingly — we send `metadata.platform: "web"` and
`metadata.callback_url = {web_origin}/app/checkout/confirmation/{order_id}?paid=1`.
**Please confirm the web callback honors `metadata.platform: "web"`** and redirects
to that web URL (not the mobile deep link), and tell us which query params you
append on redirect (we read `reference` / `trxref` / `paid` / `payment_id`).

**Still blocking a real proof:** we still have **no Paystack test credentials / sandbox
key**, so a full round-trip (initialize → pay → return → verified) has never been run
end to end. This is the one thing stopping us from calling payments "proven."

**Definition of done:** one real payment starts in the app and lands back on the
confirmation page showing verified success.

---

## 3. [BLOCKER] Transactional email — still not seen

**What we see:** the notifications surface exposes `GET /notifications/`,
`mark-read`, `unread/count`, and an **Expo push-token** register/remove — i.e. push
for mobile. We see **no email channel and no email-preference endpoints**. Nothing
indicates order/payment emails are being sent.

**What we need:** email as a delivery channel on the existing notification pipeline
(not a parallel system). Full spec: **`docs/backend/email-notifications-spec.md`**.
Minimum to start: email on **order placed, shipped, delivered, and payment success**,
to **verified** addresses only.

---

## 4. [MAJOR] State changes should create a notification for the other party

**Unverifiable from the spec**, so flagging it as still-open until confirmed: on each
of these, an in-app `Notification` should be created (which then fans out to
push/email), carrying `reference_type` + `reference_id` for deep-linking:
- seller advances an item (`PATCH /orders/seller/items/{id}`) → notify the **buyer**;
- buyer places an order → notify the **seller**;
- payment success/failure, payout, refund → notify the relevant party.

If these already fire, tell us the notification `type` values so we can render and
deep-link them correctly.

---

## 5. [MAJOR] Order-level status should roll up from its items

**Unverifiable from the spec.** The web app still *derives* the shown status from the
items' progress (an order is only as far along as its least-advanced item) to paper
over lag. If `GET /orders/{id}.status` now rolls up server-side (least-advanced item
wins), confirm it and we'll trust it directly.

---

## 6. [DONE] Email-verification send + resend

`POST /users/email-verification/send` and `POST /users/email-verification/verify`
are live, so the resend path exists. Remaining soft asks (not blockers): make the
verification email fast/branded (ties into #3), and make the sign-in 403 for an
unverified account **machine-readable** ("unverified" vs "bad credentials") so we can
route straight to the verify screen instead of a generic login error.

---

## 7. [MINOR] Data-shape gaps

Still worth closing where not already:
- **`is_followed` on follow/suggestion lists.** Single-profile `GET` has it; the
  list objects (People to follow) still need it so Follow state seeds correctly.
- **Category on the product list payload** (`category_ids` or a small summary) so the
  inventory table can show/filter by category per row.
- **Seller metrics period.** A 30-day window on `GET /orders/seller/stats` (it exposes
  lifetime totals) to show trend, not just a lifetime count.

---

## 9. [MAJOR] Seller application / store-creation review flow — still open

**What we see:** still only `POST /users/create-seller`, which activates a shop
**immediately** with no documents and no review. There's **no seller-application
endpoint** and nothing moves a shop through an admin review.

**What we need (unchanged):**
1. A seller-application endpoint that does **not** auto-activate — creates the record
   in `verification_status: pending` with required documents (gov ID, proof of
   address/registration, shop photos via `media_id`).
2. Admin review surface: list pending applications + docs; approve → `verified` +
   `is_seller: true`; reject → `rejected` with a reason the applicant can read.
3. Notify the applicant on submit **and** decision (in-app + email, ties into #3).
4. A way to read current application status (expose `verification_status` + any
   rejection reason on `GET /users/profile`).

**Interim on web:** the form still falls back to `create-seller` (instant activation,
documents stashed in the `policies` blob). That's a stopgap, not the real gate.

---

## New backend surface we noticed (FYI — mostly not yet wired on web)

The spec has grown a full **logistics/B2B** layer since the last review. Flagging so
we're aligned on what exists:
- **`deliveries/`** (30 paths) — rider/partner app: partner auth, assignments, runs
  (multi-stop pickup → POD-QR confirm), failures.
- **`fulfilment/`** (7) — seller allocation workflow (accept/decline, substitutions).
- **`delivery/`** (4) — `quote`, `quote/combined`, `serviceable`, job status.
- **`business/`** (13) — business accounts, discover, listings, verification, paid
  subscriptions.
- Buyer-facing order delivery: `GET /orders/{id}/track`, `/pod-code`, `/events`,
  `POST /orders/{id}/delivery-wait-choice`. **The web app is building against these
  now** (buyer tracking + proof-of-delivery first).

Where these emit (or should emit) notifications/events, the same ask as #4 applies —
a delivery reaching "delivered" should feed an in-app notification and the order's
own state so we're not relying on the seller manually marking it.

---

## Summary — what's actually left

1. **Fix `GET /payments/` 500** (#0) — new, straightforward.
2. **Give us Paystack test creds** so we can prove one payment end-to-end (#2).
3. **Confirm `GET /media/` is auth-gated + scoped** (#1).
4. **Turn on transactional email**, orders + payments first (#3) — spec is ready.
5. **Build the seller-application review flow** (#9).
6. **Confirm notifications fire on state changes** and order status rolls up (#4, #5) —
   or tell us they do and we'll wire to them.

Items 1–2 are the shortest path to "payments are real." 3–5 are the remaining trust
gaps. Everything in "Status at a glance" marked Done/Partial is you making ground —
this list is mostly short now.
