# Housing — Room / Flat / PG listing platform

Turborepo monorepo: **NestJS API** + **Expo (React Native) app** + a self-hosted **OTA update system**.

```
apps/
  api/          NestJS 12 · TypeORM · PostgreSQL + PostGIS · Redis + BullMQ · Firebase Admin
  mobile/       Expo SDK 57 · Expo Router · Expo UI (Compose / SwiftUI) · Redux Toolkit + RTK Query
  ota-console/  One HTML page to upload, stage, pause and roll back OTA updates
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
cp apps/api/.env.example apps/api/.env
pnpm build                            # builds shared packages + API
pnpm db:migrate && pnpm --filter @housingcom/api seed
pnpm --filter @housingcom/api dev     # http://localhost:4000/api · Swagger at /docs

cp apps/mobile/.env.example apps/mobile/.env
# add Firebase files to apps/mobile/firebase/ (see README there)
pnpm --filter @housingcom/mobile android   # dev build (Expo UI and Firebase need a dev build, not Expo Go)
```

| Command                                        | What it does                                    |
| ---------------------------------------------- | ----------------------------------------------- |
| `pnpm build` / `typecheck` / `lint` / `test`   | Turbo pipelines across the workspace            |
| `pnpm db:migrate`                              | Run TypeORM migrations                          |
| `pnpm ota:publish --channel production`        | Build and publish an OTA update                 |
| `pnpm ota:record-runtime --channel production` | Register a shipped binary's runtime fingerprint |
| `pnpm ota:console`                             | OTA console at http://localhost:4100            |

## Docs

- [Architecture](docs/architecture.md): layering rules for the API and the app
- [OTA updates](docs/ota.md): how updates are built, served, staged and rolled back

## Phase status

**Phase 1:** monorepo, API core (config, errors, envelope, guards, events, queues, cache, storage),
auth (Firebase → JWT + rotating refresh sessions), users and lister mode, geo (PostGIS), remote app config,
self-hosted OTA (server, signing, staged rollout, auto-pause, rollback, console, CLI), and the app shell.

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
  - admin drawer
  - public listing page (gallery, video, map, directions, share)
  - nearby listings on Home

Create the first admin after signing in once: `pnpm --filter @housingcom/api make-admin --phone +91XXXXXXXXXX`.

Next: search, map view, filters and recommendations → favourites, leads, chat, reviews, notifications →
featured plans + Razorpay.
