import { Box, Heading, HStack, Text, VStack } from '@gluestack-ui/themed';
import { useFocusEffect } from '@react-navigation/native';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import * as productService from '@/services/productService';
import { useAuthStore } from '@/store/authStore';
import { formatBRL } from '@/utils/formatCurrency';

export function ProductListScreen() {
  const threshold = useAuthStore((s) => s.company?.low_stock_threshold ?? 5);
  const [data, setData] = useState<productService.ProductWithVariants[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await productService.listProductsWithVariants();
      setData(rows);
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
      <VStack flex={1} py="$2">
        <Heading size="lg" mb="$4">
          Produtos
        </Heading>
        <Box mb="$4">
          <AppButton
            label="+ Novo produto"
            onPress={() => router.push('/(app)/products/new')}
          />
        </Box>
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={
            <EmptyState
              title="Nenhum produto"
              description="Cadastre itens com variações de tamanho e cor."
              action={
                <Text color="$primary500" onPress={() => router.push('/(app)/products/new')}>
                  Cadastrar
                </Text>
              }
            />
          }
          renderItem={({ item }) => (
            <Box bg="$white" borderWidth={1} borderColor="$borderLight50" borderRadius="$xl" p="$4" mb="$3">
              <Text fontWeight="$bold">{item.name}</Text>
              <Text size="sm" color="$textLight500">
                {item.category}
              </Text>
              {item.variants.map((v) => {
                const low = v.quantity <= threshold;
                const label = [v.size_label, v.color_label].filter(Boolean).join(' · ') || 'Único';
                const price = v.sale_price ?? item.sale_price;
                return (
                  <HStack key={v.id} justifyContent="space-between" alignItems="center" mt="$2">
                    <Text size="sm">{label}</Text>
                    <HStack space="sm" alignItems="center">
                      {low ? (
                        <Text size="xs" color="$red500">
                          Baixo
                        </Text>
                      ) : null}
                      <Text size="sm">{formatBRL(price)}</Text>
                      <Text size="sm" fontWeight="$bold">
                        x{v.quantity}
                      </Text>
                    </HStack>
                  </HStack>
                );
              })}
            </Box>
          )}
        />
      </VStack>
    </Screen>
  );
}
