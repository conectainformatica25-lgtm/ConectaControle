/** URL base da API no seu servidor, ex.: http://192.168.0.10:4000/api */
const PREDEFINED_BACKEND_URL = 'https://conectacontrole-api.onrender.com';

const envUrl = (process.env.EXPO_PUBLIC_API_URL ?? '').replace(/\/$/, '');

// Lógica de proteção: se for produção no Render e a URL ambiente estiver vazia ou apontando para o site (web), forçamos a API.
const isPointingToWeb = envUrl.includes('web.onrender.com');
export const API_BASE_URL = (isPointingToWeb || !envUrl) ? PREDEFINED_BACKEND_URL : envUrl;

console.log('[API Config] Usando Base URL:', API_BASE_URL);

export function isApiMode(): boolean {
  return Boolean(API_BASE_URL.trim());
}
