import { Redirect } from 'expo-router';

import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const initialized = useAuthStore((s) => s.initialized);
  const profile = useAuthStore((s) => s.profile);
  if (!initialized) return null;
  if (profile) return <Redirect href="/(app)/(tabs)" />;
  return <Redirect href="/(auth)/login" />;
}
