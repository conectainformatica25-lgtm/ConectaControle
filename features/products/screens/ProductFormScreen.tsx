import { Box, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as productService from '@/services/productService';

export function ProductFormScreen() {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Geral');
  const [purchase, setPurchase] = useState('');
  const [sale, setSale] = useState('');
  const [size, setSize] = useState('');
  const [color, setColor] = useState('');
  const [qty, setQty] = useState('0');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function save() {
    setErr(null);
    setLoading(true);
    try {
      await productService.createProduct({
        name: name.trim(),
        category: category.trim() || 'Geral',
        purchase_price: Number(purchase.replace(',', '.')) || 0,
        sale_price: Number(sale.replace(',', '.')) || 0,
        variants: [
          {
            size_label: size.trim() || undefined,
            color_label: color.trim() || undefined,
            quantity: Math.max(0, parseInt(qty, 10) || 0),
          },
        ],
      });
      router.back();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView>
          <VStack space="md" py="$4">
            <Heading size="lg">Novo produto</Heading>
            <Field label="Nome" value={name} onChangeText={setName} />
            <Field label="Categoria" value={category} onChangeText={setCategory} />
            <Field label="Preço compra" value={purchase} onChangeText={setPurchase} keyboard="decimal-pad" />
            <Field label="Preço venda" value={sale} onChangeText={setSale} keyboard="decimal-pad" />
            <Text fontWeight="$bold" mt="$2">
              Primeira variação
            </Text>
            <Field label="Tamanho" value={size} onChangeText={setSize} />
            <Field label="Cor" value={color} onChangeText={setColor} />
            <Field label="Quantidade" value={qty} onChangeText={setQty} keyboard="number-pad" />
            {err ? (
              <Text color="$red500" size="sm">
                {err}
              </Text>
            ) : null}
            <AppButton label={loading ? 'Salvando...' : 'Salvar'} onPress={save} disabled={loading} />
            <AppButton variant="outline" label="Cancelar" onPress={() => router.back()} />
          </VStack>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

function Field({
  label,
  value,
  onChangeText,
  keyboard,
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  keyboard?: 'decimal-pad' | 'number-pad';
}) {
  return (
    <Box>
      <Text mb="$1">{label}</Text>
      <Input>
        <InputField value={value} onChangeText={onChangeText} keyboardType={keyboard} />
      </Input>
    </Box>
  );
}
