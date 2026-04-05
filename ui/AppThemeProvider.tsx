import { config as baseConfig } from '@gluestack-ui/config';
import { GluestackUIProvider } from '@gluestack-ui/themed';
import { useMemo, type ReactNode } from 'react';

import { useThemeStore } from '@/store/themeStore';
import { defaultBrand } from '@/ui/themes/default.theme';

type Props = { children: ReactNode };

export function AppThemeProvider({ children }: Props) {
  const brand = useThemeStore((s) => s.brand);
  const merged = useMemo(() => {
    const primary = '#5E8BF7';
    const secondary = '#EDF1F9';
    return {
      ...baseConfig,
      tokens: {
        ...baseConfig.tokens,
        colors: {
          ...baseConfig.tokens.colors,
          primary500: primary,
          primary600: '#4A76E1',
          primary700: '#3D62D2',
          backgroundLight0: '#F8F9FD',
          borderLight50: '#EDF1F9',
        },
      },
    };
  }, [brand.primary, brand.secondary]);

  return <GluestackUIProvider config={merged}>{children}</GluestackUIProvider>;
}
