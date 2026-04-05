/** Ative com EXPO_PUBLIC_MOCK=1 para testar sem PostgreSQL nem API (dados em memória). */
export function isMockMode(): boolean {
  const v = process.env.EXPO_PUBLIC_MOCK;
  return v === '1' || v === 'true';
}
