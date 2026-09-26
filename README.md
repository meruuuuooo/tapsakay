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

## Android APK releases

The **Android release** GitHub Actions workflow builds a signed, installable APK with Expo EAS and attaches it to a GitHub Release. It runs manually from the `main` branch and creates the Git tag only after the build and APK download succeed.

One-time setup:

1. Push this repository to GitHub. If it has no remote yet, add the intended GitHub repository as `origin` first.
2. Log in to the Expo account that owns the linked EAS project and run `npx eas-cli build --platform android --profile release` locally once. Complete any Android signing prompts; EAS keeps the keystore for later builds.
3. Create an Expo access token and add it to the GitHub repository's Actions secrets as `EXPO_TOKEN`.

For each release, update `expo.version` in `app.json` (starting at `1.0.0`), commit and push it to `main`, then run **Actions → Android release → Run workflow** with the matching tag (for example, `v1.0.0`). Download `TAPSAKAY-v1.0.0.apk` from the resulting GitHub Release and install it on Android. EAS increments Android's internal version code for each release build. If a build fails, the workflow creates no tag or release.
