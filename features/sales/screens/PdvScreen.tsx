import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Box, Heading, HStack, Input, InputField, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, Platform } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as customerService from '@/services/customerService';
import * as productService from '@/services/productService';
import * as salesService from '@/services/salesService';
import { useCartStore } from '@/store/cartStore';
import type { PaymentMethod } from '@/types/models';
import { buildMonthlyInstallments } from '@/utils/installments';
import { formatBRL } from '@/utils/formatCurrency';

const methods: { id: PaymentMethod; label: string }[] = [
  { id: 'cash', label: 'Dinheiro' },
  { id: 'pix', label: 'PIX' },
  { id: 'card', label: 'Cartão' },
  { id: 'credit', label: 'A prazo' },
];

export function PdvScreen() {
  const [catalog, setCatalog] = useState<productService.ProductWithVariants[]>([]);
  const lines = useCartStore((s) => s.lines);
  const paymentMethod = useCartStore((s) => s.paymentMethod);
  const creditDraft = useCartStore((s) => s.creditDraft);
  const addLine = useCartStore((s) => s.addLine);
  const setQty = useCartStore((s) => s.setQty);
  const clear = useCartStore((s) => s.clear);
  const setPaymentMethod = useCartStore((s) => s.setPaymentMethod);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [customerId, setCustomerId] = useState('');
  const [down, setDown] = useState('');
  const [parcelas, setParcelas] = useState('3');
  const [firstDue, setFirstDue] = useState(() => new Date().toISOString().slice(0, 10));
  const [msg, setMsg] = useState<string | null>(null);
  
  const [query, setQuery] = useState('');
  const [customerQuery, setCustomerQuery] = useState('');

  const load = useCallback(async () => {
    const [p, c] = await Promise.all([
      productService.listProductsWithVariants(),
      customerService.listCustomers(),
    ]);
    setCatalog(p);
    setCustomers(c.map((x) => ({ id: x.id, name: x.name })));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filteredItems = useMemo(() => {
    if (query.trim().length < 2) return [];
    const q = query.toLowerCase();
    
    const matchedProducts = catalog.filter(p => 
      p.name.toLowerCase().includes(q) || 
      (p.code && p.code.toLowerCase().includes(q))
    );

    return matchedProducts.flatMap((p) =>
      p.variants.map((v) => ({
        key: v.id,
        product: p,
        variant: v,
      }))
    );
  }, [catalog, query]);

  const total = lines.reduce((s, l) => s + l.qty * l.unitSalePrice, 0);

  async function checkout() {
    setMsg(null);
    try {
      if (lines.length === 0) {
        setMsg('Adicione itens ao carrinho');
        return;
      }
      const items = lines.map((l) => ({
        variant_id: l.variantId,
        qty: l.qty,
        unit_sale_price: l.unitSalePrice,
        unit_purchase_price: l.unitPurchasePrice,
      }));

      if (paymentMethod === 'credit') {
        if (!customerId) {
          setMsg('Selecione o cliente');
          return;
        }
        const downVal = Number(down.replace(',', '.')) || 0;
        const n = Math.max(1, parseInt(parcelas, 10) || 1);
        const principal = Math.max(0, total - downVal);
        const inst = buildMonthlyInstallments(principal, n, new Date(firstDue + 'T12:00:00'));
        await salesService.processSale({
          payment_method: 'credit',
          customer_id: customerId,
          items,
          credit: {
            principal,
            down_payment: downVal,
            installments: inst,
          },
        });
      } else {
        await salesService.processSale({
          payment_method: paymentMethod,
          customer_id: null,
          items,
        });
      }
      clear();
      setMsg('Venda concluída!');
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Erro no checkout');
    }
  }

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <VStack space="md" py="$4">
          
          <Box bg="$primary500" borderRadius="$xl" p="$5" mb="$2" shadowColor="#000" shadowOffset={{width:0, height:2}} shadowOpacity={0.1} shadowRadius={4}>
            <Heading color="$white" size="lg" mb="$3">Busca Rápida de Produto</Heading>
            <Input bg="$white" borderRadius="$md" size="lg" borderColor="$transparent">
              <InputField 
                placeholder="Pesquise por Nome ou Código (ex: 789...)" 
                value={query} 
                onChangeText={setQuery} 
              />
            </Input>
          </Box>

          {query.trim().length >= 2 && (
             <Box mb="$2">
                <Text fontWeight="$bold" mb="$2">Resultados ({filteredItems.length})</Text>
                {filteredItems.length === 0 ? (
                  <Text color="$textLight500">Nenhum produto encontrado.</Text>
                ) : (
                  <FlatList
                    scrollEnabled={false}
                    data={filteredItems}
                    keyExtractor={(x) => x.key}
                    renderItem={({ item }) => {
                      const price = item.variant.sale_price ?? item.product.sale_price;
                      const label = [item.variant.size_label, item.variant.color_label].filter(Boolean).join(' · ') || 'Único';
                      return (
                        <Pressable
                          onPress={() => {
                            if (item.variant.quantity < 1) return;
                            addLine({
                              variantId: item.variant.id,
                              productName: item.product.name,
                              label,
                              qty: 1,
                              unitSalePrice: price,
                              unitPurchasePrice: item.product.purchase_price,
                            });
                            setQuery('');
                          }}
                        >
                          <Box bg="$white" borderWidth={0} p="$4" mb="$2" borderRadius="$lg" shadowColor="#000" shadowOffset={{width:0, height:1}} shadowOpacity={0.05} shadowRadius={2}>
                            <HStack justifyContent="space-between" alignItems="center">
                              <VStack flex={1}>
                                <Text fontWeight="$bold" color="$textLight900">
                                  {item.product.name}
                                </Text>
                                <Text size="xs" color="$textLight500">
                                  Opção: {label} {item.product.code ? `| Cód: ${item.product.code}` : ''}
                                </Text>
                              </VStack>
                              <VStack alignItems="flex-end">
                                <Text fontWeight="$bold" color="$primary500">{formatBRL(price)}</Text>
                                <Text size="xs" color={item.variant.quantity > 0 ? '$green600' : '$red500'}>
                                  Estoque: {item.variant.quantity}
                                </Text>
                              </VStack>
                            </HStack>
                          </Box>
                        </Pressable>
                      );
                    }}
                  />
                )}
             </Box>
          )}

          <Box bg="$white" borderRadius="$xl" p="$5" shadowColor="#000" shadowOffset={{width:0, height:2}} shadowOpacity={0.05} shadowRadius={4}>
            <Heading size="md" mb="$3">
              Resumo do Carrinho
            </Heading>
            
            {lines.length === 0 ? (
              <Box py="$6" alignItems="center" bg="$backgroundLight50" borderRadius="$md">
                <FontAwesome name="shopping-cart" size={32} color="#D1D5DB" />
                <Text mt="$2" color="$textLight400">O carrinho está vazio</Text>
              </Box>
            ) : (
              <VStack space="sm">
                {lines.map((l) => (
                  <HStack key={l.variantId} justifyContent="space-between" alignItems="center" bg="$backgroundLight50" p="$3" borderRadius="$md">
                    <VStack flex={1}>
                      <Text size="sm" fontWeight="$bold">{l.productName}</Text>
                      <Text size="xs" color="$textLight500">{l.label}</Text>
                    </VStack>
                    <HStack space="md" alignItems="center" bg="$white" borderRadius="$full" px="$3" py="$1" borderWidth={1} borderColor="$borderLight200">
                      <Pressable onPress={() => setQty(l.variantId, l.qty - 1)} hitSlop={10}>
                        <FontAwesome name="minus" size={12} color="#6B7280" />
                      </Pressable>
                      <Text fontWeight="$bold" minWidth="$4" textAlign="center">{l.qty}</Text>
                      <Pressable onPress={() => setQty(l.variantId, l.qty + 1)} hitSlop={10}>
                        <FontAwesome name="plus" size={12} color="#6B7280" />
                      </Pressable>
                    </HStack>
                  </HStack>
                ))}
              </VStack>
            )}

            <Box mt="$4" pt="$4" borderTopWidth={1} borderColor="$borderLight100">
              <HStack justifyContent="space-between" alignItems="center">
                <Text fontSize="$lg" color="$textLight500">Total a pagar</Text>
                <Text fontSize="$2xl" fontWeight="$bold" color="$green600">
                  {formatBRL(total)}
                </Text>
              </HStack>
            </Box>
          </Box>

          <Box bg="$white" borderRadius="$xl" p="$5" shadowColor="#000" shadowOffset={{width:0, height:2}} shadowOpacity={0.05} shadowRadius={4}>
            <Text fontWeight="$bold" mb="$3">
              Forma de Pagamento
            </Text>
            <HStack flexWrap="wrap" space="sm" mb="$4">
              {methods.map((m) => (
                <Pressable key={m.id} onPress={() => setPaymentMethod(m.id)}>
                  <Box
                    borderWidth={2}
                    borderColor={paymentMethod === m.id ? '$primary500' : 'transparent'}
                    bg={paymentMethod === m.id ? '$primary50' : '$backgroundLight100'}
                    px="$4"
                    py="$2.5"
                    borderRadius="$md"
                  >
                    <Text size="sm" fontWeight={paymentMethod === m.id ? '$bold' : '$normal'} color={paymentMethod === m.id ? '$primary700' : '$textLight600'}>{m.label}</Text>
                  </Box>
                </Pressable>
              ))}
            </HStack>

            {paymentMethod === 'credit' && (
              <VStack space="md">
                <Text fontWeight="$bold">Selecionar Cliente</Text>
                
                <Input bg="$white" borderRadius="$md" borderColor="$borderLight200" mb="$2">
                  <InputField 
                    placeholder="Pesquisar cliente..." 
                    value={customerQuery} 
                    onChangeText={setCustomerQuery} 
                  />
                </Input>

                {customerQuery.trim().length >= 2 ? (
                  <HStack flexWrap="wrap" space="sm">
                    {customers
                      .filter(c => c.name.toLowerCase().includes(customerQuery.toLowerCase()))
                      .map((c) => (
                      <Pressable key={c.id} onPress={() => { setCustomerId(c.id); setCustomerQuery(c.name); }}>
                        <Box
                          borderWidth={2}
                          borderColor={customerId === c.id ? '$primary500' : 'transparent'}
                          bg={customerId === c.id ? '$primary50' : '$backgroundLight100'}
                          px="$4"
                          py="$2"
                          borderRadius="$md"
                          mb="$2"
                        >
                          <Text size="sm" fontWeight={customerId === c.id ? '$bold' : '$normal'} color={customerId === c.id ? '$primary700' : '$textLight600'}>{c.name}</Text>
                        </Box>
                      </Pressable>
                    ))}
                  </HStack>
                ) : (
                  customerId && customers.find(x => x.id === customerId) ? (
                    <HStack mb="$2">
                      <Box borderWidth={2} borderColor="$primary500" bg="$primary50" px="$4" py="$2" borderRadius="$md">
                        <Text size="sm" fontWeight="$bold" color="$primary700">{customers.find(x => x.id === customerId)?.name}</Text>
                      </Box>
                    </HStack>
                  ) : null
                )}

                <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
                  <InputField placeholder="Entrada Inicial (R$)" value={down} onChangeText={setDown} keyboardType="decimal-pad" />
                </Input>
                <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
                  <InputField placeholder="Qtd. de Parcelas" value={parcelas} onChangeText={setParcelas} keyboardType="number-pad" />
                </Input>
                <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
                  <InputField placeholder="Vencimento Inicial (AAAA-MM-DD)" value={firstDue} onChangeText={setFirstDue} />
                </Input>
              </VStack>
            )}
            
            {msg && (
              <Box bg="$green50" p="$3" borderRadius="$md" mt="$4" borderWidth={1} borderColor="$green200">
                <Text color="$green700" textAlign="center">{msg}</Text>
              </Box>
            )}
          </Box>

          <VStack space="sm" mt="$2">
            <AppButton label="Finalizar Venda" onPress={checkout} />
            <AppButton variant="outline" label="Esvaziar Carrinho" onPress={clear} />
          </VStack>

        </VStack>
      </ScrollView>
    </Screen>
  );
}
