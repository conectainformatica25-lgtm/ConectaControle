/** URL base da API no seu servidor, ex.: http://192.168.0.10:4000/api */
export const API_BASE_URL = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

export function isApiMode(): boolean {
  return Boolean(API_BASE_URL.trim());
}
