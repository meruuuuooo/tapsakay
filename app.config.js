const { expo } = require('./app.json');
const { readFileSync } = require('node:fs');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();
const googleServicesFile = process.env.GOOGLE_SERVICES_FILE?.trim();

if (googleServicesFile) {
  let googleServices;
  try {
    googleServices = JSON.parse(readFileSync(googleServicesFile, 'utf8'));
  } catch (error) {
    throw new Error('GOOGLE_SERVICES_FILE must point to a readable google-services.json file.', { cause: error });
  }
  const packages = googleServices.client?.map((client) => client.client_info?.android_client_info?.package_name) ?? [];
  if (!packages.includes(expo.android.package)) {
    throw new Error(`GOOGLE_SERVICES_FILE has no Firebase Android client for ${expo.android.package}. Register that package in Firebase and upload its google-services.json to EAS preview.`);
  }
}

module.exports = {
  expo: {
    ...expo,
    plugins: [
      ...expo.plugins,
      'expo-secure-store',
      'expo-notifications',
      ...(googleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
    ],
    android: {
      ...expo.android,
      ...(googleServicesFile ? { googleServicesFile } : {}),
    },
    extra: {
      ...expo.extra,
      androidMapsConfigured: Boolean(googleMapsApiKey),
    },
  },
};
