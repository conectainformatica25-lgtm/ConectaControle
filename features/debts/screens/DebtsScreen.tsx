import { Box, Heading, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as debtService from '@/services/debtService';
import { todayDateString } from '@/utils/dates';
import { formatBRL } from '@/utils/formatCurrency';

type Filter = 'all' | 'pending' | 'overdue' | 'paid';

export function DebtsScreen() {
  const [rows, setRows] = useState<debtService.InstallmentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<Filter>('pending');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await debtService.listInstallmentsWithDebt();
      setRows(r);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const t = todayDateString();
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (filter === 'all') return true;
      if (filter === 'paid') return r.status === 'paid';
      const unpaid = r.status !== 'paid';
      if (filter === 'overdue') return unpaid && r.due_date < t;
      if (filter === 'pending') return unpaid && r.due_date >= t;
      return true;
    });
  }, [rows, filter, t]);

  async function markPaid(id: string) {
    await debtService.markInstallmentPaid(id);
    load();
  }

  return (
    <Screen>
      <VStack flex={1} py="$2">
        <Heading size="lg" mb="$3">
          Crediário
        </Heading>
        <HStack flexWrap="wrap" space="sm" mb="$3">
          {(
            [
              ['pending', 'Pendentes'],
              ['overdue', 'Vencidas'],
              ['paid', 'Pagas'],
              ['all', 'Todas'],
            ] as const
          ).map(([k, label]) => (
            <Pressable key={k} onPress={() => setFilter(k)}>
              <Box
                borderWidth={2}
                px="$4"
                py="$2"
                borderRadius="$full"
                borderColor={filter === k ? '$primary500' : 'transparent'}
                bg={filter === k ? '$primary50' : '$backgroundLight50'}
              >
                <Text size="sm" fontWeight={filter === k ? '$bold' : '$normal'} color={filter === k ? '$primary700' : '$textLight600'}>
                  {label}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => {
            const isOverdue = item.status !== 'paid' && item.due_date < t;
            const isPaid = item.status === 'paid';
            return (
              <Box bg="$white" borderWidth={0} p="$4" mb="$3" borderRadius="$xl" shadowColor="#000" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.05} shadowRadius={4}>
                <HStack justifyContent="space-between" alignItems="flex-start" mb="$1">
                  <VStack>
                    <Text fontWeight="$bold" color="$textLight900">{item.customer_name ?? 'Cliente'}</Text>
                    <Text size="sm" color="$textLight500">
                      Vencimento: {item.due_date}
                    </Text>
                  </VStack>
                  <Box bg={isPaid ? '$green50' : isOverdue ? '$red50' : '$orange50'} px="$2" py="$1" borderRadius="$md">
                    <Text size="xs" fontWeight="$bold" color={isPaid ? '$green700' : isOverdue ? '$red700' : '$orange700'}>
                      {isPaid ? 'PAGA' : isOverdue ? 'ATRASADA' : 'PENDENTE'}
                    </Text>
                  </Box>
                </HStack>
                <HStack justifyContent="space-between" alignItems="center" mt="$2">
                  <Text size="md" fontWeight="$bold" color="$primary600">
                    {formatBRL(item.amount)}
                  </Text>
                  <Text size="xs" color="$textLight400">
                    Parcela #{item.installment_number}
                  </Text>
                </HStack>
                {item.status !== 'paid' ? (
                  <Box mt="$3" pt="$3" borderTopWidth={1} borderColor="$borderLight50">
                    <AppButton label="Marcar como Pago" onPress={() => markPaid(item.id)} />
                  </Box>
                ) : null}
              </Box>
            );
          }}
        />
      </VStack>
    </Screen>
  );
}
