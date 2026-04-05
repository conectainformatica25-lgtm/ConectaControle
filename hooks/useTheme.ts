import { useMemo } from 'react';

import { useThemeStore } from '@/store/themeStore';
import { buildAppColors } from '@/ui/themes/default.theme';

export function useTheme() {
  const brand = useThemeStore((s) => s.brand);
  return useMemo(() => buildAppColors(brand), [brand]);
}
