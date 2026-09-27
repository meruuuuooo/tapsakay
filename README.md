# TAPSAKAY

**Tap. Match. Sakay.** An Expo passenger and driver app backed by Laravel 13, MySQL 8, and Sanctum authentication.

Passengers register and verify email, book seats, and follow driver-reported station updates. Operators provision drivers and vehicles. Drivers manage multiple groups, confirm pickups and drop-offs, and advance through the route. All ride changes and seat reservations are enforced by the server.

## Run locally

Follow [backend and app setup](docs/backend-setup.md) to configure MySQL, start Laravel and Expo, create a driver, and verify email using the local mail log.

```bash
pnpm install
cp .env.example .env
pnpm start
```

The frontend needs the configured API to sign in and operate. Set `EXPO_PUBLIC_API_URL` to the backend URL; physical phones need your computer’s LAN address. See the [API contract](docs/api.md).

## Checks

```bash
pnpm typecheck
pnpm test
pnpm build:web
cd backend
php artisan test
vendor/bin/pint --test
```

Backend tests use a separate MySQL `tapsakay_test` database and include concurrent booking checks. The older demo tests remain as isolated prototype fixtures; the running app uses `src/store/app.ts` and server state.

## Installable web app

`pnpm build:web` creates `dist/` with the PWA manifest, icons, and static service worker. Serve the app and Laravel API on the same HTTPS origin in production; routing details are in the setup guide. Android Chrome supports **Install app**; iPhone Safari supports **Share → Add to Home Screen**.

The static shell can reopen offline. Sign-in, bookings, driver actions, and current ride data require a connection. API responses and private user data are not stored in the service-worker cache. Driver tracking shows confirmed stations, not GPS positions.

## Android APK releases

The **Android release** GitHub Actions workflow builds a signed, installable APK with Expo EAS and attaches it to a GitHub Release. It runs manually from the `main` branch and creates the Git tag only after the build and APK download succeed.

For phone installation, the passenger crash fix, and optional live Google Maps setup, follow the [step-by-step Android guide](docs/android-map-setup.md).

One-time setup:

1. Push this repository to GitHub. If it has no remote yet, add the intended GitHub repository as `origin` first.
2. Log in to the Expo account that owns the linked EAS project and run `npx eas-cli build --platform android --profile release` locally once. Complete any Android signing prompts; EAS keeps the keystore for later builds.
3. Create an Expo access token and add it to the GitHub repository's Actions secrets as `EXPO_TOKEN`.

To show the native map in the Android APK, enable **Maps SDK for Android** in Google Cloud. Create an Android-restricted API key for package `com.meruuuuooo.tapsakay` and the SHA-1 fingerprint of the EAS Android signing certificate, then add it to the EAS project's **preview** environment as a sensitive variable named `GOOGLE_MAPS_API_KEY`. Rebuild the APK after adding the key. Without it, the Android app displays a station route preview and the passenger flow remains usable.

For each release, update `expo.version` in `app.json` (starting at `1.0.0`), commit and push it to `main`, then run **Actions → Android release → Run workflow** with the matching tag (for example, `v1.0.0`). Download `TAPSAKAY-v1.0.0.apk` from the resulting GitHub Release and install it on Android. EAS increments Android's internal version code for each release build. If a build fails, the workflow creates no tag or release.
