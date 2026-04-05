import { Box, Heading, HStack, Text, VStack } from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { isBackendConfigured } from '@/services/backend';
import * as debtService from '@/services/debtService';
import { useAuthStore } from '@/store/authStore';
import { todayDateString } from '@/utils/dates';
export function DashboardScreen() {
  const company = useAuthStore((s) => s.company);
  const profile = useAuthStore((s) => s.profile);
  const [dueToday, setDueToday] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!isBackendConfigured()) return;
    setLoading(true);
    try {
      const rows = await debtService.listInstallmentsWithDebt();
      const t = todayDateString();
      let d0 = 0;
      let ov = 0;
      for (const r of rows) {
        if (r.status === 'paid') continue;
        if (r.due_date === t) d0 += 1;
        if (r.due_date < t) ov += 1;
      }
      setDueToday(d0);
      setOverdue(ov);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <ScrollView
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <VStack space="lg" py="$4">
          <Box>
            <Heading size="xl">{company?.name ?? 'Loja'}</Heading>
            <Text color="$textLight500">Olá, {profile?.full_name ?? '—'}</Text>
          </Box>
          
          {company?.status === 'trial' && (
            <Box bg="$blue50" p="$3" borderRadius="$lg" borderWidth={1} borderColor="$blue100">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack>
                  <Text fontWeight="$bold" size="sm" color="$blue700">Seu teste grátis termina em:</Text>
                  <Text size="xs" color="$blue600">
                    {(() => {
                      const now = new Date();
                      const trialEnd = new Date(company.trial_ends_at);
                      const diffTime = trialEnd.getTime() - now.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      return diffDays > 0 ? `${diffDays} dias restantes` : 'Expira hoje';
                    })()}
                  </Text>
                </VStack>
                <AppButton 
                  label="Assinar" 
                  onPress={() => router.push('/(app)/subscription')} 
                />
              </HStack>
            </Box>
          )}
          <HStack space="md" flexWrap="wrap">
            <AlertCard
              title="Vence hoje"
              value={String(dueToday)}
              tone="warning"
              onPress={() => router.push('/(app)/(tabs)/debts')}
            />
            <AlertCard
              title="Vencidas"
              value={String(overdue)}
              tone="danger"
              onPress={() => router.push('/(app)/(tabs)/debts')}
            />
          </HStack>
          <HStack space="sm">
            <AppButton label="Abrir PDV" onPress={() => router.push('/(app)/(tabs)/pdv')} />
            <AppButton
              variant="outline"
              label="Configurações"
              onPress={() => router.push('/(app)/settings')}
            />
          </HStack>
          {!isBackendConfigured() ? (
            <Text size="sm" color="$textLight500">
              Defina EXPO_PUBLIC_MOCK=1 (demo), EXPO_PUBLIC_API_URL ou Supabase no .env.
            </Text>
          ) : null}
        </VStack>
      </ScrollView>
    </Screen>
  );
}

function AlertCard({
  title,
  value,
  tone,
  onPress,
}: {
  title: string;
  value: string;
  tone: 'warning' | 'danger';
  onPress: () => void;
}) {
  const accent = tone === 'danger' ? '$red500' : '$orange500';
  return (
    <Box
      bg="$white"
      borderWidth={1}
      borderColor="$borderLight50"
      borderRadius="$xl"
      p="$4"
      minWidth="45%"
      flexGrow={1}
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.05}
      shadowRadius={4}
    >
      <HStack justifyContent="space-between" alignItems="center">
        <Text fontWeight="$bold" size="xs" color="$textLight500" textTransform="uppercase">
          {title}
        </Text>
        <Box bg={accent} w={8} h={8} borderRadius={4} />
      </HStack>
      <Text fontSize="$3xl" fontWeight="$bold" my="$2" color="$textLight900">
        {value}
      </Text>
      <Text color="$primary500" fontSize="$sm" fontWeight="$600" onPress={onPress}>
        Ver detalhes
      </Text>
    </Box>
  );
}
