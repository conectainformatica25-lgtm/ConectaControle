import { Redirect, Stack } from 'expo-router';

import { useAuthStore } from '@/store/authStore';
import { SubscriptionGuard } from '@/components/SubscriptionGuard';

export default function AppGroupLayout() {
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  if (!initialized) return null;
  if (!profile) return <Redirect href="/(auth)/login" />;
  return (
    <SubscriptionGuard>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="settings" options={{ presentation: 'modal' }} />
        <Stack.Screen name="products/new" />
        <Stack.Screen name="subscription" />
      </Stack>
    </SubscriptionGuard>
  );
}
