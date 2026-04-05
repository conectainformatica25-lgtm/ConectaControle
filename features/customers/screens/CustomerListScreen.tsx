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
        <VStack space="sm" mb="$4">
          <Input>
            <InputField placeholder="Nome" value={name} onChangeText={setName} />
          </Input>
          <Input>
            <InputField placeholder="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          </Input>
          <AppButton label="Adicionar cliente" onPress={add} />
        </VStack>
        <FlatList
          data={list}
          keyExtractor={(c) => c.id}
          refreshControl={<RefreshControl refreshing={loading} onRefresh={load} />}
          ListEmptyComponent={<EmptyState title="Nenhum cliente" />}
          renderItem={({ item }) => (
            <Box borderWidth={1} borderColor="$borderLight200" p="$3" borderRadius="$md" mb="$2">
              <Text fontWeight="$bold">{item.name}</Text>
              <Text size="sm" color="$textLight500">
                {item.phone}
              </Text>
            </Box>
          )}
        />
      </VStack>
    </Screen>
  );
}
