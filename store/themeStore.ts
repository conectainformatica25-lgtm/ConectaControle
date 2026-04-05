import { create } from 'zustand';

import type { BrandOverride } from '@/ui/themes/theme.types';

type ThemeState = {
  brand: Partial<BrandOverride>;
  setBrand: (b: Partial<BrandOverride>) => void;
  resetBrand: () => void;
};

export const useThemeStore = create<ThemeState>((set) => ({
  brand: {},
  setBrand: (b) => set((s) => ({ brand: { ...s.brand, ...b } })),
  resetBrand: () => set({ brand: {} }),
}));
