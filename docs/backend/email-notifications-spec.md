# Email Notifications — Backend API Spec

**For:** Markt backend team · **From:** Markt web app · **Status:** proposal

## 1. Why / current state

Markt already has a working **notification pipeline**:

- `GET /notifications/` — in-app notification list
- `GET /notifications/unread/count`
- `POST /notifications/mark-read`
- `POST/DELETE /notifications/push-token` — Expo push tokens (mobile push)

Every meaningful event already creates an in-app `Notification` (type, title, message,
`reference_type`, `reference_id`). **Email is the only missing delivery channel.** The
cleanest design is therefore: **do not build a separate email system — add "email" as a
delivery channel on the existing notification pipeline.** When the backend creates a
notification, it fans out to the channels the user has enabled (in-app always, plus push
and/or email).

```
event happens ──▶ create Notification (in-app)
                        │
                        ├─▶ push  (if enabled + has push token)
                        └─▶ email (if enabled + email verified)   ◀── NEW
```

## 2. What we need the backend to add

### 2.1 Send email on notification events (server-side)

When a notification is created, also send an email **iff all are true**:

1. The user's email is **verified** (`email_verified = true`). Never email unverified addresses.
2. The user has the **email channel enabled** for that notification **category** (see §3).
3. The event is emailable (not every in-app ping deserves an email — see §4).

Delivery should be **asynchronous** (queue/worker), not inline in the request, with retries.

### 2.2 Notification preferences endpoints

So the web/mobile apps can render a "Notifications" settings screen. Suggested:

```
GET  /api/v1/users/notification-preferences
PATCH /api/v1/users/notification-preferences
```

`GET` response:

```json
{
  "channels": { "in_app": true, "push": true, "email": true },
  "categories": {
    "orders":        { "in_app": true, "push": true, "email": true },
    "payments":      { "in_app": true, "push": true, "email": true },
    "fulfilment":    { "in_app": true, "push": true, "email": true },
    "offers":        { "in_app": true, "push": true, "email": true },
    "requests":      { "in_app": true, "push": true, "email": false },
    "messages":      { "in_app": true, "push": true, "email": false },
    "social":        { "in_app": true, "push": false, "email": false },
    "reviews":       { "in_app": true, "push": false, "email": false },
    "marketing":     { "in_app": true, "push": false, "email": false }
  },
  "email_digest": "immediate"        // "immediate" | "daily" | "off"
}
```

`PATCH` accepts a partial of the same shape and returns the full updated object.
(If you'd rather not add a new route, this can live under the existing freeform
`PATCH /users/settings` — but a typed, documented shape is strongly preferred.)

**Sensible defaults** (so it works before anyone touches settings): email ON for
`orders`, `payments`, `fulfilment`, `offers`; OFF for `messages`, `social`, `reviews`,
`marketing`. Rationale: money/fulfilment events are the ones people actually want in
their inbox; chat/social would be spammy.

### 2.3 Unsubscribe

Transactional email isn't legally required to carry an unsubscribe link, but for
deliverability and trust it should. Provide:

- A **`List-Unsubscribe`** header (mailto + one-click HTTPS `List-Unsubscribe-Post`) on every email.
- A tokenized, no-login endpoint: `GET /notifications/email/unsubscribe?token=…`
  (signed token → sets that category's `email` pref to `false`, or all-off). Never require
  the user to be logged in to unsubscribe.

## 3. Category model

Map each existing notification `type` / `reference_type` to one **category**. Categories are
the unit users toggle (not raw types — too granular). Proposed mapping:

| Category    | Example events (type / reference_type)                                   | Email default |
|-------------|--------------------------------------------------------------------------|:-------------:|
| orders      | order_placed, order_update, shipment_update, delivered, cancelled        | ✅ |
| payments    | payment_success, payment_failed, refund, payout                          | ✅ |
| fulfilment  | allocation offered/accepted, substitution ask, POD, escalation           | ✅ |
| offers      | request_offer, offer_accepted/rejected/withdrawn                          | ✅ |
| requests    | new reply on your request                                                | ❌ |
| messages    | chat / message                                                           | ❌ |
| social      | like, comment, reaction, follow, post                                    | ❌ |
| reviews     | product_review, review_upvote                                            | ❌ |
| marketing   | promotional                                                              | ❌ |

## 3.1 Trigger points — events that MUST create a notification

Email/push can only fan out from a notification that actually exists. Several
transitions today change state **without creating a notification**, so the other
party never hears about it. At minimum, create a notification (→ then email/push
per prefs) on:

- **Order status / fulfilment changes** — when a seller advances an item
  (`PATCH /orders/seller/items/{id}`) or the order rolls up: notify the **buyer**
  ("Your order is being prepared / has shipped / was delivered"). This is the gap
  we're hitting now: advancing an item updates the item, but no buyer notification
  is emitted.
- **New order placed** — notify the **seller** ("New order to prepare").
- **Payment success/failure**, **payout**, **refund/return decision**.
- **New offer on a request**, **offer accepted/rejected**.
- **New chat message**, and social events (like/comment/follow) per prefs.

Each notification should carry `reference_type` + `reference_id` (e.g.
`order` + order id) so the app deep-links correctly.

## 4. Digest vs immediate

Best practice for 2026 is to **batch low-priority events** so a burst doesn't send 20
emails ([Postmark], [SuprSend]). Recommendation:

- **Immediate** (always, ignores digest): payments, order status changes, fulfilment
  allocations, offer accepted/rejected, password/security. These are time-sensitive.
- **Digestable** (respect `email_digest`): social, reviews, request replies, generic
  updates. If `email_digest = "daily"`, roll these into one daily summary email;
  `"immediate"` sends each; `"off"` sends none.
- Never send an **empty** digest (no events → no email).

## 5. Email content / templates

One transactional template per category (or per event) with a shared header/footer.
Minimum variables the app can rely on: `title`, `message`, a **deep link** back into the
app built from `reference_type` + `reference_id` (the web app already maps these — e.g.
`order → /app/orders/{id}`, `post → /app/community/post/{id}`), recipient name, and the
unsubscribe link. Keep them plain, single-CTA, mobile-first.

## 6. Deliverability & infra (must-haves)

- **Provider:** a transactional ESP (Amazon SES, Postmark, SendGrid, or Resend). Use REST
  API, not raw SMTP, for new integration.
- **Auth records:** SPF, DKIM, and DMARC on the sending domain (e.g. `noreply@marktcommerce.com`).
  Without these, order/payment emails land in spam.
- **From / Reply-To:** a real, monitored `from`; a `reply-to` that goes somewhere sane.
- **Bounces & complaints:** consume the provider's webhook; auto-suppress hard bounces and
  spam complaints (stop emailing them; flag the address).
- **Idempotency:** dedupe on `notification_id` (or event id) so retries/webhook re-delivery
  can't double-send.
- **Rate limiting / retry:** exponential backoff on transient failures.
- **Logging:** per-message delivery log (queued/sent/bounced/opened) keyed to `notification_id`.

## 7. Compliance

- CAN-SPAM / GDPR: honor unsubscribe promptly, include a physical postal address in the
  footer, never email unverified or suppressed addresses.
- Don't leak PII across accounts in shared templates.

## 8. What the web app will consume once this ships

Purely additive on our side — nothing here blocks you:

1. A **Notifications** tab in Settings that calls `GET/PATCH /users/notification-preferences`
   (channels × categories + digest). We already have the tabbed Settings hub to drop it into.
2. We keep rendering in-app notifications exactly as now; email is server-driven.
3. If you expose the tokenized unsubscribe endpoint, we don't even need a page for it.

**The single most important ask:** add the **email channel + preferences** to the *existing*
notification creation path — don't build a parallel email system. Everything else (digest,
templates, provider) is standard transactional-email plumbing.

---

Sources: [Postmark – transactional email best practices](https://postmarkapp.com/guides/transactional-email-best-practices),
[SuprSend – transactional email API guide 2026](https://www.suprsend.com/post/transactional-email-api-developers-guide-2026),
[Moosend – transactional email best practices 2026](https://moosend.com/blog/transactional-email-best-practices/).
