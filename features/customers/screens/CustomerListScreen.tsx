import { Box, Heading, Input, InputField, Text, VStack } from '@gluestack-ui/themed';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';

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

  async function add() {
    if (!name.trim()) return;
    await customerService.createCustomer({ name: name.trim(), phone: phone.trim() });
    setName('');
    setPhone('');
    load();
  }

  return (
    <Screen>
      <VStack flex={1} py="$2">
        <Heading size="lg" mb="$3">
          Clientes
        </Heading>
        <VStack space="sm" mb="$4" bg="$white" p="$4" borderRadius="$xl" shadowColor="#000" shadowOffset={{ width: 0, height: 2 }} shadowOpacity={0.05} shadowRadius={4}>
          <Text fontWeight="$bold" mb="$1">Adicionar novo cliente</Text>
          <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
            <InputField placeholder="Nome" value={name} onChangeText={setName} />
          </Input>
          <Input bg="$backgroundLight50" borderColor="$borderLight200" borderRadius="$md">
            <InputField placeholder="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Input>
          <Box pt="$2">
            <AppButton label="Salvar Cliente" onPress={add} />
          </Box>
        </VStack>
        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<EmptyState title="Nenhum cliente cadastrado" />}
          renderItem={({ item }) => (
            <Box bg="$white" borderWidth={0} p="$4" borderRadius="$lg" mb="$2" shadowColor="#000" shadowOffset={{ width: 0, height: 1 }} shadowOpacity={0.05} shadowRadius={2}>
              <Text fontWeight="$bold" color="$textLight900">{item.name}</Text>
              <Text size="sm" color="$textLight500" mt="$1">
                {item.phone}
              </Text>
            </Box>
          )}
        />
      </VStack>
    </Screen>
  );
}
