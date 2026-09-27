const { expo } = require('./app.json');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

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
      ...(process.env.GOOGLE_SERVICES_FILE ? { googleServicesFile: process.env.GOOGLE_SERVICES_FILE } : {}),
    },
    extra: {
      ...expo.extra,
      androidMapsConfigured: Boolean(googleMapsApiKey),
    },
  },
};
