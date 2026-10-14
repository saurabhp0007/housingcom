# Housing — Room / Flat / PG listing platform

Turborepo monorepo: **NestJS API** + **Expo (React Native) app** + a self-hosted **OTA update system**.

```
apps/
  api/          NestJS 12 · TypeORM · PostgreSQL + PostGIS · Redis + BullMQ
  mobile/       Expo SDK 57 (iOS + Android only) · Expo Router · Expo UI · Leaflet/OpenStreetMap · Redux Toolkit + RTK Query
packages/
  contracts/    Shared enums, zod schemas and response types (API ⇄ app)
  ui/           Design system over @expo/ui: Material 3 on Android, SwiftUI on iOS
  utils/        Pure helpers (geo, money, versions, strings)
  tsconfig/     Shared TypeScript configs
scripts/        ota-publish / ota-record-runtime
```

## Quick start

```bash
pnpm install
pnpm infra:up                         # Postgres+PostGIS and Redis (docker compose)
pnpm build                            # builds shared packages + API
pnpm db:migrate && pnpm --filter @housingcom/api seed
pnpm --filter @housingcom/api dev     # http://localhost:4000/api · Swagger at /docs

pnpm --filter @housingcom/mobile android   # dev build (Expo UI needs a dev build, not Expo Go)
```

Sign in with any Indian mobile number and the code from `OTP_STATIC_CODE` (`000000`); no SMS is sent yet.

## Deploy (single VPS)

`deploy/` runs Postgres, Redis, the API and Caddy (automatic HTTPS) with Docker Compose. Uploaded files
live in the `storage` volume and are served by the API.

```bash
rsync -az --exclude node_modules --exclude .git --exclude apps/mobile ./ root@<server>:/opt/housing/
ssh root@<server>
cd /opt/housing/deploy
docker compose up -d --build     # migrations and seeds run on every start
docker compose exec api node dist/core/database/seeds/make-admin.js --phone +91XXXXXXXXXX
```

Env files are not committed: `apps/api/.env` (local API), `apps/mobile/.env` (app build) and `deploy/.env`
(server stack, including `DOMAIN` and generated secrets). The variables are defined and validated in
`apps/api/src/config/env.schema.ts`.

| Command                                        | What it does                                    |
| ---------------------------------------------- | ----------------------------------------------- |
| `pnpm build` / `typecheck` / `lint` / `test`   | Turbo pipelines across the workspace            |
| `pnpm db:migrate`                              | Run TypeORM migrations                          |
| `pnpm ota:publish --channel production`        | Build and publish an OTA update                 |
| `pnpm ota:record-runtime --channel production` | Register a shipped binary's runtime fingerprint |

## Docs

- [Architecture](docs/architecture.md): layering rules for the API and the app
- [OTA updates](docs/ota.md): how updates are built, served, staged and rolled back

## Phase status

**Phase 1:** monorepo, API core (config, errors, envelope, guards, events, queues, cache, storage),
auth (phone OTP → JWT + rotating refresh sessions), users and lister mode, geo (PostGIS), remote app config,
self-hosted OTA (server, signing, staged rollout, auto-pause, rollback, CLI), and the app shell.

**Phase 2:**

- **Listings:** draft → submit → review → live, following the PRD flow as a tested state machine. Verified
  listers skip review, and unverified edits to a live listing go back to review. Pause, resume, mark filled
  and delete are supported.
- **Media:** photos and video. Photos are compressed to WebP with thumbnails, and EXIF/GPS data is stripped.
  You can reorder them and choose the cover.
- **Lister verification:** ID and property proof are kept in private storage. Approval grants the
  Verified badge and instant publishing.
- **Admin (inside the app):** dashboard, approval queue with reasons, verification review,
  user search and block/unblock (takes effect immediately), and cities/areas management.
- **App:**
  - lister drawer (my listings, a 5-step editor with a map pin and photo manager, verification)
  - admin drawer, including **App updates** (publish, stage, pause and roll back OTA updates from the phone)
  - public listing page (gallery, video, map, directions, share)
  - nearby listings on Home

**Phase 3:**

- **Search:** type any area, landmark, college or office. Our own areas match with typo tolerance (pg_trgm),
  and Google Places (New) adds landmarks once `GOOGLE_PLACES_API_KEY` is set. Recent searches are remembered,
  and keyword search covers listing text.
- **Filters:** type, budget, sharing, gender, furnishing, food, amenities and available-by. **Sort:**
  recommended, nearest, newest or most viewed.
- **Map view:** listings as pins, with server-side clusters when zoomed out. Tap a pin for a preview,
  or tap a cluster to zoom in. A list/map toggle switches between the two views.
- **Recommendation engine:** ranks by distance, budget fit, personal taste (learned from views and shares),
  popularity and freshness. Admins tune the weights in the app. Guests get location + popularity.
- **Listing page:** similar places nearby, plus the nearest metro, bus stop, college and hospital
  (looked up in the background when a listing goes live; needs the Google key).

Create the first admin after signing in once: `pnpm --filter @housingcom/api make-admin --phone +91XXXXXXXXXX`.

**Phase 4:**

- **Favourites:** a heart on every card and on the listing page (optimistic). The Saved tab lists saved
  places and saved searches.
- **Contact owner:** call, WhatsApp or in-app chat. The owner's number is only revealed to signed-in users,
  and each enquiry becomes a **lead** in the lister's inbox (counted once per customer for ranking).
- **Visits:** pick a date and time slot. The owner confirms or declines (with a note) from **Leads**, and the
  tenant can cancel.
- **Chat:** real-time over Socket.IO (Redis adapter, so it scales across API instances). Messages are sent
  over REST, unread counts show on the Inbox tab, and the listing is linked from the thread.
- **Reviews:** 1–5 stars plus a comment, one per tenant. Only people who contacted the owner or asked to
  visit can review. Ratings appear on cards and feed the ranking (Bayesian average).
- **Reports:** users flag a listing with a reason. Admins dismiss the report or take the listing down; the
  owner sees the reason and can fix and resubmit.
- **Saved searches + alerts:** save a place plus filters. When a matching listing goes live, a background
  job (PostGIS + the same filter rules as search) alerts each search once.
- **Notifications:** an inbox plus Expo push (FCM/APNs) for approvals, rejections, takedowns, verification,
  new leads, visit updates, chat messages and saved-search matches. Tapping opens the right screen, and dead
  tokens are pruned. Admins can send **announcements** to everyone or to one city (the user's city follows
  the location they pick).

Push needs `EAS_PROJECT_ID` in the app's env and `PUSH_ENABLED=true` on the API (plus `EXPO_ACCESS_TOKEN`
if enhanced push security is on).

**Phase 5:**

- **Featured plans:** admins set the price and duration per city or area, plus a limit on featured slots
  per area. For each listing, the most specific scope with active plans is offered (area, then city,
  then everywhere).
- **Pay in the app:** listers pick a plan and pay through Razorpay Checkout, shown in an in-app sheet.
  UPI apps open directly. The payment is confirmed twice: by the app's signed result and by a
  server-to-server webhook. Both paths end in one conditional database update, so a listing is featured
  exactly once per payment. Paying again extends the current period.
- **Placement:** featured listings appear above the results on the first page of search (same filters
  and area), in a "Featured in your area" section on Home, with a Featured tag, and as a highlighted pin
  on the map. **Fair rotation** uses weighted random sampling, so every featured listing gets its share,
  weighted by views and contacts and by closeness. Admin-pinned listings come first.
- **Performance and expiry:** listers see impressions, views and leads for each featured period. They get
  a reminder one day before it ends and a notice when it ends, each with a link to renew.
- **Admin:** featured pricing, featured listings (pause, resume, remove; paused time is given back),
  free feature or pin from a listing's page, payments, and dashboard tiles for featured listings and
  revenue.
- **Content:** FAQs, terms, privacy and about pages, and Home banners (with images, a city, an end date
  and a link) are all edited in the app. Customers see them under **Help & FAQs** and on Home.

Payments setup: `PAYMENTS_DRIVER=fake` simulates checkout (the app asks you to confirm a test payment).
For Razorpay set `PAYMENTS_DRIVER=razorpay`, `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` and
`RAZORPAY_WEBHOOK_SECRET` (test-mode `rzp_test_…` keys work; in production the API refuses to boot
without them). Then add a webhook in the Razorpay
dashboard pointing to `<PUBLIC_BASE_URL>/api/payments/webhooks/razorpay` for the `payment.captured`,
`order.paid` and `payment.failed` events. As the PRD notes, check the
app-store rules on selling digital promotions before launch.
