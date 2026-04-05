import { Text, VStack } from '@gluestack-ui/themed';
import type { ReactNode } from 'react';

type Props = {
  title: string;
  description?: string;
  action?: ReactNode;
};

export function EmptyState({ title, description, action }: Props) {
  return (
    <VStack space="md" alignItems="center" py="$10" px="$4">
      <Text fontSize="$lg" fontWeight="$bold" textAlign="center">
        {title}
      </Text>
      {description ? (
        <Text color="$textLight500" textAlign="center">
          {description}
        </Text>
      ) : null}
      {action}
    </VStack>
  );
}
