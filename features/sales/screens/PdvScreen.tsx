import { Box, Heading, HStack, Input, InputField, ScrollView, Text, VStack } from '@gluestack-ui/themed';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable } from 'react-native';

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
        <Heading size="lg" mb="$3">
          PDV
        </Heading>
        <Text fontWeight="$bold" mb="$2">
          Catálogo
        </Text>
        <FlatList
          scrollEnabled={false}
          data={catalog.flatMap((p) =>
            p.variants.map((v) => ({
              key: v.id,
              product: p,
              variant: v,
            }))
          )}
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
                }}
              >
                <Box bg="$white" borderWidth={1} borderColor="$borderLight50" p="$3" mb="$2" borderRadius="$xl">
                  <HStack justifyContent="space-between">
                    <Text size="sm" flex={1}>
                      {item.product.name} — {label}
                    </Text>
                    <Text size="sm">{formatBRL(price)}</Text>
                  </HStack>
                  <Text size="xs" color="$textLight500">
                    Estoque: {item.variant.quantity}
                  </Text>
                </Box>
              </Pressable>
            );
          }}
        />
        <Heading size="md" mt="$4">
          Carrinho
        </Heading>
        {lines.map((l) => (
          <HStack key={l.variantId} justifyContent="space-between" alignItems="center" my="$1">
            <Text flex={1} size="sm">
              {l.productName} ({l.label})
            </Text>
            <HStack space="md" alignItems="center">
              <Pressable onPress={() => setQty(l.variantId, l.qty - 1)}>
                <Text>-</Text>
              </Pressable>
              <Text>{l.qty}</Text>
              <Pressable onPress={() => setQty(l.variantId, l.qty + 1)}>
                <Text>+</Text>
              </Pressable>
            </HStack>
          </HStack>
        ))}
        <Text fontSize="$xl" fontWeight="$bold" my="$3">
          Total {formatBRL(total)}
        </Text>
        <Text fontWeight="$bold" mb="$2">
          Pagamento
        </Text>
        <HStack flexWrap="wrap" space="sm" mb="$4">
          {methods.map((m) => (
            <Pressable key={m.id} onPress={() => setPaymentMethod(m.id)}>
              <Box
                borderWidth={2}
                borderColor={paymentMethod === m.id ? '$primary500' : '$borderLight200'}
                px="$3"
                py="$2"
                borderRadius="$md"
              >
                <Text size="sm">{m.label}</Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
        {paymentMethod === 'credit' ? (
          <VStack space="md" mb="$4">
            <Text fontWeight="$bold">Cliente</Text>
            <HStack flexWrap="wrap" space="sm">
              {customers.map((c) => (
                <Pressable key={c.id} onPress={() => setCustomerId(c.id)}>
                  <Box
                    borderWidth={2}
                    borderColor={customerId === c.id ? '$primary500' : '$borderLight200'}
                    px="$3"
                    py="$2"
                    borderRadius="$md"
                  >
                    <Text size="sm">{c.name}</Text>
                  </Box>
                </Pressable>
              ))}
            </HStack>
            <Input>
              <InputField placeholder="Entrada (R$)" value={down} onChangeText={setDown} keyboardType="decimal-pad" />
            </Input>
            <Input>
              <InputField placeholder="Parcelas" value={parcelas} onChangeText={setParcelas} keyboardType="number-pad" />
            </Input>
            <Input>
              <InputField placeholder="Primeiro vencimento AAAA-MM-DD" value={firstDue} onChangeText={setFirstDue} />
            </Input>
          </VStack>
        ) : null}
        {msg ? <Text color="$primary500">{msg}</Text> : null}
        <AppButton label="Finalizar venda" onPress={checkout} />
        <AppButton variant="outline" label="Limpar carrinho" onPress={clear} />
      </ScrollView>
    </Screen>
  );
}
