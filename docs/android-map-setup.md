# Set up and install the TAPSAKAY Android APK

These steps apply to this project's EAS `release` profile. The Android package is `com.meruuuuooo.tapsakay`, and the build reads environment variables from EAS **preview**.

## First: get a working passenger app

1. Make sure you have the latest project files, including `app.config.js` and `src/components/route-map.native.tsx`.
2. From the project directory, sign in to the Expo account that owns TAPSAKAY:

   ```bash
   npx eas-cli login
   ```

3. Build a new APK:

   ```bash
   npx eas-cli build --platform android --profile release
   ```

4. Open the download link from EAS on your Android phone and install the new APK. If Android blocks the install, allow installs from the browser or file manager you used, then retry.
5. Open **Continue as passenger**. Without a Google Maps key, the passenger screen shows a station route preview instead of opening the native map. Booking and trip tracking still work.

The previously installed APK does not contain this fix. You must install a newly built APK.

## Optional: enable the live Google map

1. In [Google Cloud Console](https://console.cloud.google.com/), create or select a project, attach a billing account, and enable **Maps SDK for Android**. Follow [Google's Maps SDK setup](https://developers.google.com/maps/documentation/android-sdk/get-api-key) if this is your first Maps project.
2. Find the **SHA-1 certificate fingerprint** of the Android keystore that EAS uses for TAPSAKAY. In the [Expo dashboard](https://expo.dev/), open **TAPSAKAY → Credentials → Android → `com.meruuuuooo.tapsakay` → Android Keystore**. Use the SHA-1 shown there for this directly installed EAS APK.
3. In Google Cloud Console, open **APIs & Services → Credentials → Create credentials → API key**. Edit the key and set:
   - **Application restriction:** Android apps
   - **Package name:** `com.meruuuuooo.tapsakay`
   - **SHA-1 fingerprint:** the value from step 2
   - **API restriction:** Maps SDK for Android
4. In the Expo dashboard, open **TAPSAKAY → Project settings → Environment variables → Add variable**. Set the name to `GOOGLE_MAPS_API_KEY`, paste the Google key as its value, select the **preview** environment, and choose **Sensitive** visibility. This is an **EAS environment variable**, not a GitHub Actions secret. [Expo environment variable guide](https://docs.expo.dev/eas/environment-variables/manage/)
5. Check that EAS lists the variable name:

   ```bash
   npx eas-cli env:list --environment preview
   ```

6. Run the build command from the first section again and install the new APK. The Google map should now appear on Passenger → Home and Trips. If the route preview still appears, confirm the variable is in **preview** and rebuild. If a blank map appears, confirm that Maps SDK for Android is enabled and that the key's package and SHA-1 restrictions match the EAS signing certificate. [Expo's `react-native-maps` setup](https://docs.expo.dev/versions/latest/sdk/map-view/)

## Release the APK on GitHub

After testing the APK, commit and push the fix to `main`. Set a new `expo.version` in `app.json` if the current version already has a GitHub tag; the workflow rejects an existing tag. In GitHub, open **Actions → Android release → Run workflow**, select `main`, and enter `v` followed by the exact `expo.version` (for example, `v1.0.1`). The workflow builds the APK and attaches it to a GitHub Release.

GitHub Actions also needs the Expo access token stored as a repository secret named `EXPO_TOKEN`. That token is separate from `GOOGLE_MAPS_API_KEY` in EAS. See the [release section in the README](../README.md#android-apk-releases).
