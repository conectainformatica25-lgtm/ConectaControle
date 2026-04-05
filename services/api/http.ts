import { API_BASE_URL } from '@/services/api/config';
import { clearStoredToken, getStoredToken } from '@/services/api/tokenStorage';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

async function request<T>(method: Method, path: string, body?: unknown): Promise<T> {
  const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${base.replace(/\/$/, '')}${cleanPath}`;
  const token = await getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    if (res.status === 401 && token) {
      await clearStoredToken();
    }

    const text = await res.text();
    let json: any = {};
    try {
      json = text ? JSON.parse(text) : {};
    } catch (parseErr) {
      console.error(`[API] Erro ao processar JSON de ${method} ${url}. Resposta:`, text.substring(0, 200));
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        throw new Error(
          `O servidor em ${url} retornou uma página HTML em vez de JSON. Verifique se a URL da API está correta.`
        );
      }
      throw new Error('Erro ao processar resposta do servidor (JSON inválido).');
    }

    if (!res.ok) {
      const msg = (json as { error?: string }).error ?? res.statusText;
      throw new Error(msg);
    }

    return json as T;
  } catch (err: any) {
    console.error(`[API] Erro na requisição ${method} ${url}:`, err.message);
    if (err.name === 'AbortError') {
      throw new Error(
        `A requisição para ${url} demorou muito e foi cancelada (timeout). Se o backend estiver no plano 'Free' do Render, ele pode levar até 1 minuto para 'acordar'. Tente novamente em instantes.`
      );
    }
    if (err instanceof TypeError && err.message.includes('fetch')) {
      throw new Error(
        `Não foi possível conectar a ${url}. Verifique sua conexão e se o endereço da API está correto.`
      );
    }
    throw err;
  }
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
