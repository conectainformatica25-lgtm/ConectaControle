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
                px="$3"
                py="$2"
                borderRadius="$md"
                borderColor={filter === k ? '$primary500' : '$borderLight200'}
              >
                <Text size="sm">{label}</Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          renderItem={({ item }) => (
            <Box borderWidth={1} borderColor="$borderLight200" p="$3" mb="$2" borderRadius="$md">
              <Text fontWeight="$bold">{item.customer_name ?? 'Cliente'}</Text>
              <Text size="sm">
                #{item.installment_number} · venc. {item.due_date} · {formatBRL(item.amount)}
              </Text>
              <Text size="sm" color="$textLight500">
                {item.status}
              </Text>
              {item.status !== 'paid' ? (
                <AppButton label="Marcar como paga" onPress={() => markPaid(item.id)} />
              ) : null}
            </Box>
          )}
        />
      </VStack>
    </Screen>
  );
}
