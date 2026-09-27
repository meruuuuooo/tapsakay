# TAPSAKAY API v1

Base path: `/api/v1`. Send `Accept: application/json`. POST bodies are JSON. Browser requests include credentials and the URL-decoded `XSRF-TOKEN` cookie as `X-XSRF-TOKEN`; obtain it through `GET /sanctum/csrf-cookie`. Native requests use `Authorization: Bearer <token>`.

## Accounts

| Method/path | Body / response |
| --- | --- |
| POST `/auth/register` | `name`, `email`, `password`, `password_confirmation`; creates a passenger and emails verification |
| POST `/auth/login` | `email`, `password`; web session login, requires CSRF |
| POST `/auth/token` | `email`, `password`, optional `deviceName`; native login returns `user`, `token` |
| GET `/auth/me` | Returns `user: {id, name, email, role, verified}` |
| POST `/auth/logout` | Revokes current native token or browser session; optional `pushDestination` removes this device's push registration |
| POST `/auth/verification-notification` | Resends verification, authenticated, limited to 3/minute |
| POST `/auth/forgot-password` | `email`; always returns a generic acknowledgement |
| POST `/auth/reset-password` | `email`, `token`, `password`, `password_confirmation`; revokes all sessions/tokens |

Passwords require at least 12 characters including letters and numbers, maximum 128. Verification uses the signed, expiring `/email/verify/{id}/{hash}` URL in the email. Driver creation is operator-only through Artisan. Registration ignores caller-supplied roles.

## Operational endpoints

All require authentication and verified email.

| Method/path | Behavior |
| --- | --- |
| GET `/stations` | `{data: [{id, name, sequence, latitude, longitude}]}` |
| GET `/state` | `{ride, rides, relas, serverTime}`: passenger's latest ride plus active rides; driver's assigned vehicle and active groups |
| GET `/rides?page=1` | User-scoped paginated ride history, 20 per page |
| GET `/rides/{id}` | `{data: ride}` for the passenger or assigned driver only |
| POST `/rides` | Passenger only: `pickupId`, `dropoffId`, `passengerCount` (1–8); required UUID `Idempotency-Key` header; returns `{data: ride}` with 201 |
| POST `/rides/{id}/cancel` | Owner may cancel before pickup |
| POST `/rides/{id}/accept` | Assigned driver accepts an unexpired offer |
| POST `/rides/{id}/decline` | Assigned driver declines an offer |
| POST `/rides/{id}/pickup` | Assigned driver confirms at the pickup station |
| POST `/rides/{id}/dropoff` | Assigned driver confirms at the destination |
| POST `/driver/heartbeat` | Refreshes assigned vehicle presence |
| POST `/driver/availability` | `{online: boolean}`; does not abandon accepted groups |
| POST `/driver/advance` | `{fromStationId: integer}`; confirms next station, rejects outdated commands or unresolved obligations |
| POST `/driver/restart` | Starts a new run at the first station; must be at terminal with no active rides |
| GET `/notifications?page=1` | User-scoped paginated persisted notices, 20 per page |
| GET `/push/config` | Public VAPID key for verified PWA users |
| POST `/push/subscriptions` | `{platform: "expo", token}` or `{platform: "web", subscription: PushSubscription.toJSON()}`; binds the destination to the signed-in user |
| POST `/push/unsubscribe` | `{destination}` removes one of the signed-in user's push destinations |

A ride contains `id`, `pickupId`, `dropoffId`, `passengerCount`, `relaId`, `status`, nullable `reason`, `createdAt`, and `offerExpiresAt`. A vehicle contains `id`, `code`, `capacity`, `passengers` (onboard), `reservedSeats` (all active groups including onboard), `availableSeats`, `currentStationId`, `status` (`online`, `offline`, `full`), and `driverName`. Times use ISO 8601 for rides/state; database notice timestamps are UTC.

Pagination includes `data`, `current_page`, and `last_page` alongside Laravel pagination metadata. Responses expose no passenger email or password to drivers.

## State and retry rules

Offers start at `requested`. Acceptance moves to `accepted`, or directly to `waiting_pickup` if already at pickup. Station arrival changes `accepted` to `waiting_pickup`. Pickup moves to `onboard`; approaching the destination moves to `approaching_dropoff`; drop-off moves to `completed`. Cancellation/decline/expiry moves to `cancelled` with a reason.

A passenger has at most one active booking. Matching picks the first eligible vehicle by ID with enough capacity and a reachable pickup. Every active group reserves its full seat count until cancellation or drop-off. Occupancy and reservations are derived from rides, never trusted from clients. There is no automatic rematching.

Retry a booking with the **same UUID and exact body** after a timeout. Reusing the key with different details returns 409. Completed ride commands never change seat counts again. Station advances include the expected previous station so retries cannot advance twice. Do not automatically retry POST requests with fresh keys.

Errors are JSON with `message`; validation errors may include `errors` keyed by field. Statuses: 401 requires login, 403 denies access/unverified account, 404 missing resource, 409 stale action/no capacity/active booking, 419 stale or missing browser CSRF token, 422 invalid input, 429 rate limited. On 419 obtain a fresh CSRF cookie before manually retrying. API limit: 180/minute per authenticated user or IP; booking limit: 10/minute; account actions: 20/minute per IP and 5/minute per email/IP pair.

Poll state every 5 seconds while foregrounded; send driver heartbeat every 30 seconds. Presence and request offers expire after 120 seconds. The server is authoritative for all mutations.
