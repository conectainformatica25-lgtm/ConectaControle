import { isApiMode } from '@/services/api/config';
import { apiGet, apiPost } from '@/services/api/http';
import { clearStoredToken, getStoredToken, setStoredToken } from '@/services/api/tokenStorage';
import {
  addCompanyAndAdmin,
  findUser,
  findUserByEmail,
  getCompany,
  getMockTokenConstant,
  seedIfEmpty,
} from '@/services/mock/memoryStore';
import { isMockMode } from '@/services/mock/env';
import { clearMockUserId, getPersistedMockUserId, persistMockUserId } from '@/services/mock/session';
import { supabase, isSupabaseConfigured } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Company, Profile } from '@/types/models';

function mapCompany(row: Record<string, unknown>): Company {
  let trialEndsStr = row.trial_ends_at as string | undefined;
  if (!trialEndsStr) {
    const createdAt = row.created_at ? new Date(row.created_at as string) : new Date();
    trialEndsStr = new Date(createdAt.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
  }

  return {
    id: row.id as string,
    name: row.name as string,
    slug: (row.slug as string) ?? null,
    brand_primary: (row.brand_primary as string) ?? null,
    brand_secondary: (row.brand_secondary as string) ?? null,
    low_stock_threshold: Number(row.low_stock_threshold ?? 5),
    status: (row.status as any) ?? 'trial',
    trial_ends_at: trialEndsStr,
    expires_at: (row.expires_at as string) ?? null,
  };
}

function mapProfile(row: Record<string, unknown>): Profile {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    full_name: (row.full_name as string) ?? null,
    role: row.role as Profile['role'],
  };
}

async function applySessionFromMe() {
  const me = await apiGet<{ profile: Record<string, unknown>; company: Record<string, unknown> }>('/me');
  useAuthStore.getState().setSession({
    profile: mapProfile(me.profile),
    company: mapCompany(me.company),
  });
}

function applyMockSession(userId: string) {
  seedIfEmpty();
  const u = findUser(userId);
  if (!u) return;
  const c = getCompany(u.company_id);
  if (!c) return;
  useAuthStore.getState().setSession({
    profile: {
      id: u.id,
      company_id: u.company_id,
      full_name: u.full_name,
      role: u.role,
    },
    company: c,
  });
}

export async function signIn(email: string, password: string) {
  if (isMockMode()) {
    seedIfEmpty();
    const u = findUserByEmail(email.trim());
    if (!u || u.password !== password) {
      throw new Error('E-mail ou senha inválidos');
    }
    await setStoredToken(getMockTokenConstant());
    await persistMockUserId(u.id);
    applyMockSession(u.id);
    return {};
  }
  if (isApiMode()) {
    const r = await apiPost<{ token: string; profile: Record<string, unknown> }>('/login', {
      email: email.trim(),
      password,
    });
    await setStoredToken(r.token);
    await applySessionFromMe();
    return r;
  }
  if (!isSupabaseConfigured) {
    throw new Error('Configure EXPO_PUBLIC_MOCK=1, EXPO_PUBLIC_API_URL ou Supabase no .env');
  }
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signUp(email: string, password: string) {
  if (isMockMode() || isApiMode()) {
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Configure EXPO_PUBLIC_SUPABASE_* no .env');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signOut() {
  if (isMockMode()) {
    await clearStoredToken();
    await clearMockUserId();
    useAuthStore.getState().signOutLocal();
    return;
  }
  if (isApiMode()) {
    await clearStoredToken();
    useAuthStore.getState().signOutLocal();
    return;
  }
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function registerCompany(params: {
  companyName: string;
  slug: string;
  fullName: string;
  email: string;
  password: string;
}) {
  if (isMockMode()) {
    seedIfEmpty();
    if (findUserByEmail(params.email.trim())) {
      throw new Error('E-mail já em uso');
    }
    const { userId } = addCompanyAndAdmin({
      companyName: params.companyName,
      slug: params.slug,
      fullName: params.fullName,
      email: params.email,
      password: params.password,
    });
    await setStoredToken(getMockTokenConstant());
    await persistMockUserId(userId);
    applyMockSession(userId);
    return;
  }
  if (isApiMode()) {
    const r = await apiPost<{ token: string }>('/register-company', {
      email: params.email.trim(),
      password: params.password,
      companyName: params.companyName.trim(),
      slug: params.slug.trim(),
      fullName: params.fullName.trim(),
    });
    await setStoredToken(r.token);
    await applySessionFromMe();
    return;
  }
  if (!isSupabaseConfigured) throw new Error('Configure EXPO_PUBLIC_SUPABASE_* no .env');
  await signUp(params.email, params.password);
  const { data, error } = await supabase.rpc('register_company', {
    p_company_name: params.companyName,
    p_slug: params.slug,
    p_full_name: params.fullName,
  });
  if (error) throw error;
  return data as string;
}

export async function fetchProfile(): Promise<Profile | null> {
  if (isMockMode()) {
    const token = await getStoredToken();
    if (token !== getMockTokenConstant()) return null;
    const uid = await getPersistedMockUserId();
    if (!uid) return null;
    seedIfEmpty();
    const u = findUser(uid);
    if (!u) return null;
    return {
      id: u.id,
      company_id: u.company_id,
      full_name: u.full_name,
      role: u.role,
    };
  }
  if (isApiMode()) {
    const token = await getStoredToken();
    if (!token) return null;
    try {
      const me = await apiGet<{ profile: Record<string, unknown>; company: Record<string, unknown> }>(
        '/me'
      );
      return mapProfile(me.profile);
    } catch {
      return null;
    }
  }
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) return null;
  const { data, error } = await supabase.from('profiles').select('*').eq('id', uid).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapProfile(data as Record<string, unknown>);
}

export async function fetchCompany(companyId: string): Promise<Company | null> {
  if (isMockMode()) {
    seedIfEmpty();
    const uid = await getPersistedMockUserId();
    const u = uid ? findUser(uid) : null;
    if (!u || u.company_id !== companyId) return null;
    return getCompany(companyId) ?? null;
  }
  if (isApiMode()) {
    try {
      const me = await apiGet<{ company: Record<string, unknown> }>('/me');
      if (me.company.id !== companyId) return null;
      return mapCompany(me.company);
    } catch {
      return null;
    }
  }
  const { data, error } = await supabase.from('companies').select('*').eq('id', companyId).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapCompany(data as Record<string, unknown>);
}
