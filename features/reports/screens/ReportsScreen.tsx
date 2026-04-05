import { Box, Heading, Text, VStack } from '@gluestack-ui/themed';
import { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView } from 'react-native';

import { Screen } from '@/components/Screen';
import * as reportsService from '@/services/reportsService';
import { endOfDayIso, endOfMonthIso, startOfDayIso, startOfMonthIso } from '@/utils/dates';
import { formatBRL } from '@/utils/formatCurrency';

export function ReportsScreen() {
  const [dayTotal, setDayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);
  const [profit, setProfit] = useState({ revenue: 0, cost: 0, profit: 0 });
  const [top, setTop] = useState<{ name: string; qty: number }[]>([]);
  const [byPay, setByPay] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const d0 = startOfDayIso(now);
      const d1 = endOfDayIso(now);
      const m0 = startOfMonthIso(now);
      const m1 = endOfMonthIso(now);

      const [daySum, monthSum] = await Promise.all([
        reportsService.salesTotalInRange(d0, d1),
        reportsService.salesTotalInRange(m0, m1),
      ]);
      setDayTotal(daySum);
      setMonthTotal(monthSum);

      const p = await reportsService.profitEstimate(m0, m1);
      setProfit(p);
      const tp = await reportsService.topProducts(m0, m1, 8);
      setTop(tp);
      const agg = await reportsService.aggregateSalesByPayment(m0, m1);
      setByPay(agg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <Screen>
      <ScrollView refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}>
        <VStack space="lg" py="$4">
          <Heading size="lg">Relatórios</Heading>
          <Box borderWidth={1} borderColor="$borderLight200" p="$4" borderRadius="$lg">
            <Text fontWeight="$bold">Vendas hoje</Text>
            <Text fontSize="$2xl">{formatBRL(dayTotal)}</Text>
          </Box>
          <Box borderWidth={1} borderColor="$borderLight200" p="$4" borderRadius="$lg">
            <Text fontWeight="$bold">Vendas no mês</Text>
            <Text fontSize="$2xl">{formatBRL(monthTotal)}</Text>
          </Box>
          <Box borderWidth={1} borderColor="$borderLight200" p="$4" borderRadius="$lg">
            <Text fontWeight="$bold">Lucro estimado (mês)</Text>
            <Text>{formatBRL(profit.profit)}</Text>
            <Text size="sm" color="$textLight500">
              Receita {formatBRL(profit.revenue)} · Custo {formatBRL(profit.cost)}
            </Text>
          </Box>
          <Box borderWidth={1} borderColor="$borderLight200" p="$4" borderRadius="$lg">
            <Text fontWeight="$bold" mb="$2">
              Por pagamento (mês)
            </Text>
            {Object.entries(byPay).map(([k, v]) => (
              <Text key={k}>
                {k}: {formatBRL(v)}
              </Text>
            ))}
          </Box>
          <Box borderWidth={1} borderColor="$borderLight200" p="$4" borderRadius="$lg">
            <Text fontWeight="$bold" mb="$2">
              Mais vendidos
            </Text>
            {top.map((x) => (
              <Text key={x.name}>
                {x.name} — {x.qty} un.
              </Text>
            ))}
          </Box>
        </VStack>
      </ScrollView>
    </Screen>
  );
}
