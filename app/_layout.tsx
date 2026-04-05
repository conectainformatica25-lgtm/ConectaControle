import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, type ReactNode } from 'react';
import { useFonts } from 'expo-font';
import 'react-native-reanimated';

import { useAuthSession } from '@/hooks/useAuthSession';
import { AppThemeProvider } from '@/ui/AppThemeProvider';

export { ErrorBoundary } from 'expo-router';

SplashScreen.preventAutoHideAsync();

function AuthBootstrap({ children }: { children: ReactNode }) {
  useAuthSession();
  return <>{children}</>;
}

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) SplashScreen.hideAsync();
  }, [loaded]);

  if (!loaded) return null;

  return (
    <AppThemeProvider>
      <AuthBootstrap>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(app)" />
        </Stack>
      </AuthBootstrap>
    </AppThemeProvider>
  );
}
