import { API_BASE_URL } from '@/services/api/config';
import { clearStoredToken, getStoredToken } from '@/services/api/tokenStorage';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const url = `${API_BASE_URL}${path.startsWith('/') ? path : `/${path}`}`;
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && token) {
    await clearStoredToken();
  }

  const text = await res.text();
  const json = text ? JSON.parse(text) : {};

  if (!res.ok) {
    const msg = (json as { error?: string }).error ?? res.statusText;
    throw new Error(msg);
  }

  return json as T;
}

export async function apiGet<T>(path: string): Promise<T> {
  return request<T>('GET', path);
}

export async function apiPost<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('POST', path, body);
}

export async function apiPatch<T>(path: string, body?: unknown): Promise<T> {
  return request<T>('PATCH', path, body);
}
