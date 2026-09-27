# TAPSAKAY Mock Prototype

**Tap. Match. Sakay.** A frontend-only Expo demo of one passenger ride and its driver view. All data and notifications stay in memory; there is no server, authentication, GPS, or cross-device sync.

## Run

```bash
pnpm install
pnpm start
```

Open the Expo app on a device, simulator, or press `w` for web. The welcome screen appears on each launch; choose Passenger or Driver to enter the demo. Both modes remain available through the switch in the header. Reloading starts a fresh demo.

## Demo walkthrough

1. In Passenger → Book, select **CBM → Market** and **2 passengers**, then request a ride.
2. After the short matching delay, **Rela #01** appears. Switch to Driver → Requests and accept.
3. At CBM, confirm pickup. Driver occupancy changes from **5/8 to 7/8**.
4. Advance the driver through CMU Gate, Hospital, and Market. Confirm drop-off at Market. Occupancy returns to **5/8**.
5. Switch to Passenger → Trips to see completion. Driver → Menu has **Reset demo** and guarded force-step controls.

The route has five stations and three mock relas. Matching uses the first online rela that has enough free seats and has not passed the pickup. Only one ride can be active at a time.

## Checks

```bash
pnpm typecheck
pnpm test
```

## Installable web app (Android and iPhone)

Build the PWA with `pnpm build:web`. This exports the web app, manifest, icons, and offline service worker to `dist/`. Host the **contents** of `dist/` at the root of an HTTPS website (for example, with EAS Hosting or another static host). A local `localhost` server also works for desktop testing. The service worker is generated for production exports only, so use `pnpm build:web` rather than `expo export` for deployments.

- **Android:** Open the HTTPS URL in Chrome and choose **Install app** or **Add to Home screen** from the browser menu.
- **iPhone:** Open the HTTPS URL in Safari, tap **Share**, then **Add to Home Screen**.

No Apple Developer account or app store is needed for the PWA. The demo UI can reopen offline after the first online visit; the map's OpenStreetMap tiles still need internet. Ride data stays in memory and resets when the app reloads, including when it is reopened from the home screen. This build expects the site at the domain root because its asset, manifest, and service worker URLs start with `/`.

## Android APK releases

The **Android release** GitHub Actions workflow builds a signed, installable APK with Expo EAS and attaches it to a GitHub Release. It runs manually from the `main` branch and creates the Git tag only after the build and APK download succeed.

For phone installation, the passenger crash fix, and optional live Google Maps setup, follow the [step-by-step Android guide](docs/android-map-setup.md).

One-time setup:

1. Push this repository to GitHub. If it has no remote yet, add the intended GitHub repository as `origin` first.
2. Log in to the Expo account that owns the linked EAS project and run `npx eas-cli build --platform android --profile release` locally once. Complete any Android signing prompts; EAS keeps the keystore for later builds.
3. Create an Expo access token and add it to the GitHub repository's Actions secrets as `EXPO_TOKEN`.

To show the native map in the Android APK, enable **Maps SDK for Android** in Google Cloud. Create an Android-restricted API key for package `com.meruuuuooo.tapsakay` and the SHA-1 fingerprint of the EAS Android signing certificate, then add it to the EAS project's **preview** environment as a sensitive variable named `GOOGLE_MAPS_API_KEY`. Rebuild the APK after adding the key. Without it, the Android app displays a station route preview and the passenger flow remains usable.

For each release, update `expo.version` in `app.json` (starting at `1.0.0`), commit and push it to `main`, then run **Actions → Android release → Run workflow** with the matching tag (for example, `v1.0.0`). Download `TAPSAKAY-v1.0.0.apk` from the resulting GitHub Release and install it on Android. EAS increments Android's internal version code for each release build. If a build fails, the workflow creates no tag or release.
