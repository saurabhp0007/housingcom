# Architecture

## API (`apps/api`)

Every feature module has the same shape:

```
modules/<feature>/
  controllers/   HTTP only: route, validate (DTO), call one service method. No logic.
  dto/           class-validator request DTOs; they `implements` the shared contract types
  services/      business logic; depends on repository *interfaces*, never on TypeORM
  interfaces/    repository contracts + DI tokens (e.g. USERS_REPOSITORY)
  repositories/  TypeORM implementations of those interfaces (all SQL lives here)
  entities/      TypeORM entities (relations typed with Relation<> for ESM)
  mappers/       entity → response contract
  listeners/     @OnEvent handlers for domain events
  policies/      pure decision logic (unit-tested without Nest or a DB)
```

Core (`src/core`) provides cross-cutting pieces:

- **Typed config:** `config/env.schema.ts` validates env with zod at boot. Services inject one slice
  (`@Inject(otaConfig.KEY)`); nothing else reads `process.env`.
- **Errors:** services throw `AppException` with a stable `ErrorCode`. `AllExceptionsFilter` shapes every
  error as `{ success: false, error: { code, message, details }, requestId }`.
- **Envelope:** `ResponseInterceptor` wraps results as `{ success: true, data, meta? }`.
  `@RawResponse()` opts out (protocol endpoints).
- **Auth:** the global `AccessTokenGuard` checks JWTs; routes opt out with `@Public()` or accept guests
  with `@OptionalAuth()`. `RolesGuard` enforces `@Roles(...)`.
- **Events:** `DomainEvent` constants and typed payloads. In-process via `@nestjs/event-emitter`;
  slow or retryable work goes to **BullMQ** queues (`QueueName`).
- **Cache:** `CacheService.wrap()` over Redis. Failures degrade to a cache miss.
- **Storage:** `ObjectStorage` interface with local-disk (dev) and S3/CDN (prod) drivers.
- **Database:** migrations only (`synchronize: false`). Generate migrations from entities and check for drift
  with `typeorm migration:generate --check`.

Modules talk to each other through exported services, never through each other's tables. For example,
favourites, leads, chat, reviews, reports and saved searches all go through `ListingCatalogService`.
Side effects hang off domain events: notifications are a single listener that maps events (listing
approved, lead created, visit updated, message sent, saved-search matched…) to inbox entries and pushes.
Push delivery and saved-search matching run on BullMQ queues, off the request path.

Payments are generic: `PaymentsService` creates gateway orders for any `purpose` and emits
`PaymentEvent.Succeeded` exactly once. The checkout result (`POST /me/payments/:id/verify`) and the webhook
(verified with an HMAC of the raw body) both converge on a conditional `UPDATE … WHERE status <> 'paid'`.
The featured module listens to that event and features the listing, so payments never know what was bought.
Featured state is mirrored onto `listings.featured_until`, which is the only thing search, map and cards
read. Expiry reminders and period ends are delayed BullMQ jobs, keyed by the period's end, so a renewal
makes older jobs no-ops.

Real time: `ChatGateway` (Socket.IO namespace `/chat`) authenticates the handshake with the access token
and joins the socket to `user:<id>`. `RedisIoAdapter` fans emits out across API instances. Clients only
receive over the socket; writes go through REST so they are validated, throttled and retried like any other.

Auth flow: the app signs in with Firebase (phone OTP / Google / Apple) and posts the Firebase ID token to
`POST /auth/firebase`. The API verifies it, finds or creates the user, and returns a 15-minute access JWT plus
an opaque refresh token. Only the token's SHA-256 is stored; the token rotates on every refresh, and reuse is rejected.

## App (`apps/mobile`)

```
src/
  app/          Expo Router routes only (screens compose feature hooks + UI)
  features/     <feature>/{*.api.ts, *.slice.ts, hooks/, services/, components/}
  shared/       api (RTK Query base + reauth), store, storage, config
packages/ui     design system (the only place that imports @expo/ui)
```

- **UI:** screens import `@housingcom/ui`, never `@expo/ui`. Each component has `.android.tsx`
  (Jetpack Compose / Material 3), `.ios.tsx` (SwiftUI) and a `.tsx` fallback with one shared props type.
  Native: buttons, text fields, filter chips, switches, bottom sheets, alert dialogs, snackbars, loaders.
  Navigation: native tabs, native modals and form sheets.
- **Layout:** `<Screen>` owns safe areas, theme background and keyboard handling
  (`react-native-keyboard-controller`), so screens never handle insets.
- **Data:** RTK Query endpoints per feature (`baseApi.injectEndpoints`), automatic token refresh with a
  single in-flight refresh, and API errors mapped to friendly copy in one place.
- **Real time & push:** `useChatRealtime` holds one socket while signed in and in the foreground. New
  messages are written straight into the RTK Query cache. `usePushNotifications` registers the Expo push
  token, refreshes badges when a push arrives, and routes taps (including cold starts) to the screen in the
  notification's `url`.
- **Payments:** Razorpay Standard Checkout runs in a `react-native-webview` sheet (JS, so fixes ship OTA).
  UPI intent links are handed to the OS, and the server verifies every result before anything is unlocked.
- **Secrets:** the refresh token lives in SecureStore. The access token is memory only.
- **OTA-friendly:** almost everything is JS. Native modules are fixed in the first binary, and feature flags
  and copy come from `/app-config`, so most fixes ship as OTA updates or without any update at all.
