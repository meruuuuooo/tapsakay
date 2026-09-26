import { Stack } from 'expo-router';
import { useFonts, PlusJakartaSans_400Regular, PlusJakartaSans_500Medium, PlusJakartaSans_600SemiBold, PlusJakartaSans_700Bold, PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans';
import { Platform } from 'react-native';

export default function RootLayout() {
  const [loaded, error] = useFonts({
    Jakarta: PlusJakartaSans_400Regular,
    JakartaMedium: PlusJakartaSans_500Medium,
    JakartaSemi: PlusJakartaSans_600SemiBold,
    JakartaBold: PlusJakartaSans_700Bold,
    JakartaExtra: PlusJakartaSans_800ExtraBold,
  });
  if (!loaded && !error && Platform.OS !== 'web') return null;
  return <Stack screenOptions={{ headerShown: false }} />;
}
