import type { AppThemeColors, BrandOverride } from './theme.types';

/** Tema padrão: branco + azul. Sobrescrever via store (multi-empresa). */
export const defaultBrand: BrandOverride = {
  primary: '#2563eb',
  secondary: '#1d4ed8',
};

export const buildAppColors = (brand?: Partial<BrandOverride>): AppThemeColors => {
  const primary = brand?.primary ?? defaultBrand.primary;
  const secondary = brand?.secondary ?? defaultBrand.secondary;
  return {
    background: '#ffffff',
    surface: '#f8fafc',
    text: '#0f172a',
    textMuted: '#64748b',
    primary,
    primaryForeground: '#ffffff',
    secondary,
    border: '#e2e8f0',
    danger: '#dc2626',
    success: '#16a34a',
  };
};
