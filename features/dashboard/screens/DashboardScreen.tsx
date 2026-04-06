import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Box, Heading, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import { isBackendConfigured } from '@/services/backend';
import * as debtService from '@/services/debtService';
import { listSalesInRange } from '@/services/salesService';
import { useAuthStore } from '@/store/authStore';
import { todayDateString, startOfDayIso, endOfDayIso, startOfMonthIso, endOfMonthIso } from '@/utils/dates';
export function DashboardScreen() {
  const company = useAuthStore((s) => s.company);
  const profile = useAuthStore((s) => s.profile);
  const [dueToday, setDueToday] = useState(0);
  const [overdue, setOverdue] = useState(0);
  const [salesToday, setSalesToday] = useState(0);
  const [salesMonth, setSalesMonth] = useState(0);
  const [salesMonthCount, setSalesMonthCount] = useState(0);
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

      const now = new Date();
      let slToday = 0;
      let slMonth = 0;
      let slMonthCt = 0;
      try {
        const todaySales = await listSalesInRange(startOfDayIso(now), endOfDayIso(now));
        slToday = todaySales.reduce((acc, s) => acc + s.total, 0);

        const monthSales = await listSalesInRange(startOfMonthIso(now), endOfMonthIso(now));
        slMonth = monthSales.reduce((acc, s) => acc + s.total, 0);
        slMonthCt = monthSales.length;
      } catch (err) {
        // Ignore mock/supabase errors if not set up
      }
      setSalesToday(slToday);
      setSalesMonth(slMonth);
      setSalesMonthCount(slMonthCt);

    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

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

          {/* COLORFUL DASHBOARD CARDS */}
          <HStack space="md" flexWrap="wrap">
            <DashboardCard
              title="Vendas Hoje"
              value={salesToday.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              bgColor="#17A2B8"
              iconName="shopping-cart"
              footerText="Atualizado agora"
            />
            <DashboardCard
              title="Vendas (Período)"
              value={salesMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              bgColor="#F39C12"
              iconName="bar-chart"
              footerText={`Ticket Médio R$ ${salesMonthCount > 0 ? (salesMonth/salesMonthCount).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0,00'} - Ref. ${salesMonthCount} Venda(s)`}
            />
            <DashboardCard
              title="Receber Hoje"
              value={String(dueToday)}
              bgColor="#28A745"
              iconName="thumbs-up"
              footerText="Calendário"
              onPress={() => router.push('/(app)/(tabs)/debts')}
            />
            <DashboardCard
              title="Pagar Hoje"
              value={String(overdue)}
              bgColor="#DC3545"
              iconName="thumbs-down"
              footerText="Calendário"
              onPress={() => router.push('/(app)/(tabs)/debts')}
            />
          </HStack>

          <HStack space="sm" mt="$4">
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

function DashboardCard({
  title,
  value,
  bgColor,
  iconName,
  footerText,
  onPress,
}: {
  title: string;
  value: string;
  bgColor: string;
  iconName: React.ComponentProps<typeof FontAwesome>['name'];
  footerText?: string;
  onPress?: () => void;
}) {
  return (
    <Box
      bg={bgColor}
      borderRadius="$md"
      flexBasis="48%"
      minWidth="45%"
      height={140}
      flexGrow={1}
      shadowColor="#000"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.1}
      shadowRadius={2}
      mb="$2"
      onTouchEnd={onPress}
      overflow="hidden"
      justifyContent="space-between"
    >
      <HStack justifyContent="space-between" alignItems="flex-start" p="$4" flex={1}>
        <VStack>
          <Text fontSize="$4xl" fontWeight="$bold" color="$white" lineHeight="$4xl">
            {value}
          </Text>
          <Text fontSize="$sm" color="$white">
            {title}
          </Text>
        </VStack>
        <FontAwesome name={iconName} size={48} color="rgba(255,255,255,0.2)" />
      </HStack>
      {footerText && (
        <Box 
          borderTopWidth={1} 
          borderColor="rgba(255,255,255,0.1)" 
          bg="rgba(0,0,0,0.05)"
          py="$2" 
          px="$4"
          alignItems="center"
          flexDirection="row"
          justifyContent="center"
        >
          <Text color="$white" fontSize="$xs" mr="$1">
            {footerText}
          </Text>
          {(footerText === 'Calendário') && (
             <FontAwesome name="arrow-circle-right" size={14} color="white" />
          )}
        </Box>
      )}
    </Box>
  );
}
