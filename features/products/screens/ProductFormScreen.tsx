import { Box, Heading, Input, InputField, Text, VStack, HStack } from '@gluestack-ui/themed';
import { router } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as productService from '@/services/productService';

export function ProductFormScreen() {
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
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
        code: code.trim() || null,
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
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <VStack space="md" py="$4">
            <HStack alignItems="center" space="md" mb="$2">
              {router.canGoBack() && (
                <AppButton variant="outline" label="Voltar" onPress={() => router.back()} />
              )}
              <Heading size="lg">Novo Produto</Heading>
            </HStack>
            
            <Box bg="$white" p="$5" borderRadius="$lg" shadowColor="#000" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.05} shadowRadius={4}>
              <VStack space="md">
                <Field label="Nome do Produto" value={name} onChangeText={setName} />
                <Field label="Código / Referência" value={code} onChangeText={setCode} />
                <Field label="Categoria" value={category} onChangeText={setCategory} />
                <Field label="Preço de Custo (R$)" value={purchase} onChangeText={setPurchase} keyboard="decimal-pad" />
                <Field label="Preço de Venda (R$)" value={sale} onChangeText={setSale} keyboard="decimal-pad" />
              </VStack>
            </Box>

            <Text fontWeight="$bold" mt="$4" mb="$1">Estoque Inicial (Variação 1)</Text>
            <Box bg="$white" p="$5" borderRadius="$lg" shadowColor="#000" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.05} shadowRadius={4}>
              <VStack space="md">
                <Field label="Tamanho" value={size} onChangeText={setSize} />
                <Field label="Cor" value={color} onChangeText={setColor} />
                <Field label="Quantidade" value={qty} onChangeText={setQty} keyboard="number-pad" />
              </VStack>
            </Box>

            {err ? (
              <Text color="$red500" size="sm" mt="$2">
                {err}
              </Text>
            ) : null}

            <VStack space="sm" mt="$4">
              <AppButton label={loading ? 'Salvando...' : 'Salvar Produto'} onPress={save} disabled={loading} />
              <AppButton variant="outline" label="Cancelar" onPress={() => router.back()} />
            </VStack>
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
      <Text mb="$1.5" size="sm" fontWeight="$600" color="$textLight700">{label}</Text>
      <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
        <InputField value={value} onChangeText={onChangeText} keyboardType={keyboard} />
      </Input>
    </Box>
  );
}
