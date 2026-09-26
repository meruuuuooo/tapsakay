const { expo } = require('./app.json');

const googleMapsApiKey = process.env.GOOGLE_MAPS_API_KEY?.trim();

module.exports = {
  expo: {
    ...expo,
    plugins: [
      ...expo.plugins,
      ...(googleMapsApiKey
        ? [['react-native-maps', { androidGoogleMapsApiKey: googleMapsApiKey }]]
        : []),
    ],
    extra: {
      ...expo.extra,
      androidMapsConfigured: Boolean(googleMapsApiKey),
    },
  },
};
