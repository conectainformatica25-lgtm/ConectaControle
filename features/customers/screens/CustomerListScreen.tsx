import { Box, Heading, HStack, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl } from 'react-native';

import { AppButton } from '@/components/AppButton';
import { EmptyState } from '@/components/EmptyState';
import { Screen } from '@/components/Screen';
import * as customerService from '@/services/customerService';
import type { Customer } from '@/types/models';

export function CustomerListScreen() {
  const [list, setList] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [editingId, setEditingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const rows = await customerService.listCustomers();
      setList(rows);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function addOrUpdate() {
    if (!name.trim()) return;
    setLoading(true);
    try {
      if (editingId) {
        await customerService.updateCustomer(editingId, { name: name.trim(), phone: phone.trim() });
      } else {
        await customerService.createCustomer({ name: name.trim(), phone: phone.trim() });
      }
      setName('');
      setPhone('');
      setEditingId(null);
      load();
    } catch(e) {
      alert("Erro ao salvar cliente.");
    } finally {
      setLoading(false);
    }
  }

  function startEdit(c: Customer) {
    setEditingId(c.id);
    setName(c.name);
    setPhone(c.phone || '');
  }

  async function removeCustomer(id: string) {
    try {
      setLoading(true);
      await customerService.deleteCustomer(id);
      load();
    } catch (e: any) {
      alert(e?.message || "Erro ao excluir cliente.");
      setLoading(false);
    }
  }

  return (
    <Screen>
      <VStack flex={1} py="$2">
        <Heading size="lg" mb="$3">
          Clientes
        </Heading>
        <VStack space="sm" mb="$4" bg="$white" p="$4" borderRadius="$xl" shadowColor="#000" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.05} shadowRadius={4}>
          <Text fontWeight="$bold" mb="$1">{editingId ? 'Editar Cliente' : 'Adicionar Novo Cliente'}</Text>
          <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
            <InputField placeholder="Nome" value={name} onChangeText={setName} />
          </Input>
          <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
            <InputField placeholder="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Input>
          <HStack space="md" pt="$2">
            <Box flex={1}>
              <AppButton label={editingId ? "Salvar Alterações" : "Salvar Cliente"} onPress={addOrUpdate} disabled={loading} />
            </Box>
            {editingId && (
              <Box>
                <AppButton variant="outline" label="Cancelar" onPress={() => { setEditingId(null); setName(''); setPhone(''); }} disabled={loading} />
              </Box>
            )}
          </HStack>
        </VStack>
        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<EmptyState title="Nenhum cliente cadastrado" />}
          renderItem={({ item }) => (
            <Box bg="$white" borderWidth={0} p="$4" borderRadius="$lg" mb="$2" shadowColor="#000" shadowOffset={{ width: 0, height: 1 }} shadowOpacity={0.05} shadowRadius={2}>
              <HStack justifyContent="space-between" alignItems="center">
                <VStack flex={1}>
                  <Text fontWeight="$bold" color="$textLight900">{item.name}</Text>
                  <Text size="sm" color="$textLight500" mt="$1">
                    {item.phone || 'Sem telefone'}
                  </Text>
                </VStack>
                <HStack space="sm">
                  <Pressable onPress={() => startEdit(item)}>
                    <Box p="$2">
                      <Text color="$blue500" fontWeight="$bold" size="sm">Editar</Text>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => removeCustomer(item.id)}>
                    <Box p="$2">
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
