import { Box, Text } from '@gluestack-ui/themed';
import type { ReactNode } from 'react';

import { PressableScale } from '@/components/PressableScale';

type Props = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'outline';
  disabled?: boolean;
  leftIcon?: ReactNode;
};

export function AppButton({ label, onPress, variant = 'primary', disabled, leftIcon }: Props) {
  return (
    <PressableScale
      disabled={disabled}
      onPress={onPress}
      style={{ opacity: disabled ? 0.5 : 1 }}
    >
      <Box
        bg={variant === 'primary' ? '$primary500' : 'transparent'}
        borderWidth={variant === 'outline' ? 1.5 : 0}
        borderColor="$primary500"
        py="$1.5"
        px="$4"
        borderRadius="$md"
        flexDirection="row"
        justifyContent="center"
        alignItems="center"
        alignSelf="flex-start"
        gap="$1.5"
      >
        {leftIcon}
        <Text
          color={variant === 'primary' ? '$white' : '$primary500'}
          fontWeight="$600"
          fontSize="$sm"
        >
          {label}
        </Text>
      </Box>
    </PressableScale>
  );
}
