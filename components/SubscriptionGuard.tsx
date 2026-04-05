import { useAuthStore } from '@/store/authStore';
import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';
import { router, usePathname } from 'expo-router';
import { ReactNode, useEffect, useMemo } from 'react';
import { AppButton } from './AppButton';

type Props = {
  children: ReactNode;
};

export function SubscriptionGuard({ children }: Props) {
  const company = useAuthStore((s) => s.company);
  const pathname = usePathname();

  const isBlocked = useMemo(() => {
    if (!company) return false;
    
    // Allow access to subscription page itself to avoid infinite loops
    if (pathname.includes('subscription')) return false;

    const now = new Date();
    const trialEnd = new Date(company.trial_ends_at);
    const isTrialValid = company.status === 'trial' && now < trialEnd;
    const isSubscriptionActive = company.status === 'active';

    // Block if NOT in valid trial AND NOT active
    return !isTrialValid && !isSubscriptionActive;
  }, [company, pathname]);

  useEffect(() => {
    if (isBlocked) {
      router.replace('/(app)/subscription');
    }
  }, [isBlocked]);

  if (isBlocked) {
    return (
      <Box flex={1} bg="$backgroundLight0" justifyContent="center" alignItems="center" p="$6">
        <VStack space="xl" alignItems="center">
          <Heading size="xl" textAlign="center" color="$primary500">
            Acesso Bloqueado
          </Heading>
          <Text textAlign="center" color="$textLight700">
            Seu período de teste ou assinatura expirou. Para continuar utilizando o sistema, ative sua assinatura.
          </Text>
          <AppButton 
            label="Assinar Agora" 
            onPress={() => router.push('/(app)/subscription')} 
          />
          <AppButton 
            variant="outline"
            label="Sair" 
            onPress={() => useAuthStore.getState().signOutLocal()} 
          />
        </VStack>
      </Box>
    );
  }

  return <>{children}</>;
}
