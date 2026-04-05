import { Box } from '@gluestack-ui/themed';
import type { ReactNode } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

type Props = {
  children: ReactNode;
  scroll?: boolean;
};

export function Screen({ children, scroll }: Props) {
  const inner = scroll ? (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
      {children}
    </ScrollView>
  ) : (
    children
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#F8F9FD' }}>
      <Box flex={1} bg="$backgroundLight0" px="$4" pt="$2">
        {inner}
      </Box>
    </SafeAreaView>
  );
}
