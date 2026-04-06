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
            <Box bg="$white" borderWidth={0} shadowColor="#000" shadowOffset={{ width: 0, height: 1 }} shadowOpacity={0.05} shadowRadius={2} borderRadius="$xl" p="$4" mb="$2">
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1} space="xs">
                  <HStack alignItems="center" space="xs">
                    <Text fontWeight="$bold" color="$textLight900">{item.name}</Text>
                    <Text size="xs" color="$textLight500">· {item.category}</Text>
                  </HStack>
                  
                  <VStack space="xs">
                    {item.variants.map((v) => {
                      const low = v.quantity <= threshold;
                      const label = [v.size_label, v.color_label].filter(Boolean).join(' · ') || 'Único';
                      const price = v.sale_price ?? item.sale_price;
                      return (
                        <HStack key={v.id} alignItems="center" space="sm">
                          <Text size="xs" color="$textLight700" bg="$backgroundLight100" px="$1.5" py="$0.5" borderRadius="$sm">{label}</Text>
                          {low && <Text size="xs" color="$red600" bg="$red50" px="$1.5" py="$0.5" borderRadius="$sm" fontWeight="$bold">Baixo Estoque</Text>}
                          <Text size="sm" fontWeight="$bold" color="$primary600">{formatBRL(price)}</Text>
                          <Text size="xs" color="$textLight900">Estoque: {v.quantity}</Text>
                        </HStack>
                      );
                    })}
                  </VStack>
                </VStack>

                <HStack space="sm" alignItems="center">
                  {item.code ? (
                    <Box bg="$backgroundLight100" px="$1.5" py="$0.5" borderRadius="$sm">
                      <Text size="xs" color="$textLight600">Cód: {item.code}</Text>
                    </Box>
                  ) : null}
                  <Pressable onPress={() => router.push(`/(app)/products/edit/${item.id}` as any)}>
                    <Box p="$1">
                      <Text color="$blue500" fontWeight="$bold" size="sm">Editar</Text>
                    </Box>
                  </Pressable>
                  <Pressable onPress={async () => {
                    try {
                      setLoading(true);
                      await productService.deleteProduct(item.id);
                      load();
                    } catch (e: any) {
                      alert(e?.message || "Erro ao excluir produto.");
                      setLoading(false);
                    }
                  }}>
                    <Box p="$1">
                      <Text color="$red500" fontWeight="$bold" size="sm">Excluir</Text>
                    </Box>
                  </Pressable>
                </HStack>
              </HStack>
            </Box>
          )}
        />
      </VStack>
    </Screen>
  );
}
