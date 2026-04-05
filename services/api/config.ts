/** URL base da API no seu servidor, ex.: http://192.168.0.10:4000/api */
const PREDEFINED_BACKEND_URL = 'https://conectacontrole-api.onrender.com';

const envUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// Se não houver URL no ambiente mas estivermos rodando no Render (web), usamos o fallback hardcoded
export const API_BASE_URL = envUrl || PREDEFINED_BACKEND_URL;

export function isApiMode(): boolean {
  return Boolean(API_BASE_URL.trim());
}
