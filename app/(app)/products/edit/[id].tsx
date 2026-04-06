import { Box, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { Screen } from '@/components/Screen';
import * as productService from '@/services/productService';

export default function ProductEditRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [category, setCategory] = useState('');
  const [purchase, setPurchase] = useState('');
  const [sale, setSale] = useState('');
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const rows = await productService.listProductsWithVariants();
        const p = rows.find(x => x.id === id);
        if (p) {
          setName(p.name);
          setCode(p.code || '');
          setCategory(p.category);
          setPurchase(String(p.purchase_price));
          setSale(String(p.sale_price));
        } else {
          setErr('Produto não encontrado.');
        }
      } catch (e) {
         setErr('Erro ao carregar produto.');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function save() {
    setErr(null);
    setLoading(true);
    try {
      await productService.updateProduct(id!, {
        name: name.trim(),
        code: code.trim() || null,
        category: category.trim() || 'Geral',
        purchase_price: Number(purchase.replace(',', '.')) || 0,
        sale_price: Number(sale.replace(',', '.')) || 0,
      });
      router.back();
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : 'Erro ao salvar');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <Screen><Text p="$4">Carregando...</Text></Screen>;

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
          <VStack space="md" py="$4">
            <Heading size="lg" mb="$2">Editar Produto</Heading>
            
            <Box bg="$white" p="$5" borderRadius="$lg" shadowColor="#000" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.05} shadowRadius={4}>
              <VStack space="md">
                <Field label="Nome do Produto" value={name} onChangeText={setName} />
                <Field label="Código / Referência" value={code} onChangeText={setCode} />
                <Field label="Categoria" value={category} onChangeText={setCategory} />
                <Field label="Preço de Custo (R$)" value={purchase} onChangeText={setPurchase} keyboard="decimal-pad" />
                <Field label="Preço de Venda (R$)" value={sale} onChangeText={setSale} keyboard="decimal-pad" />
              </VStack>
            </Box>

            {err ? (
              <Text color="$red500" size="sm" mt="$2">
                {err}
              </Text>
            ) : null}

            <VStack space="sm" mt="$4">
              <AppButton label={loading ? 'Salvando...' : 'Atualizar Produto'} onPress={save} disabled={loading || !!err} />
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
