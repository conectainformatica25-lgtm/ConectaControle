import { isApiMode } from '@/services/api/config';
import { apiGet, apiPost } from '@/services/api/http';
import { isMockMode } from '@/services/mock/env';
import { addCustomer, listCustomersForCompany, seedIfEmpty } from '@/services/mock/memoryStore';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Customer } from '@/types/models';

function mapCustomer(row: Record<string, unknown>): Customer {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    name: row.name as string,
    phone: row.phone as string,
  };
}

export async function listCustomers(): Promise<Customer[]> {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return [];
    return listCustomersForCompany(cid);
  }
  if (isApiMode()) {
    const { items } = await apiGet<{ items: Record<string, unknown>[] }>('/customers');
    return (items ?? []).map((r) => mapCustomer(r));
  }
  const { data, error } = await supabase.from('customers').select('*').order('name');
  if (error) throw error;
  return (data ?? []).map((r) => mapCustomer(r as Record<string, unknown>));
}

export async function createCustomer(input: { name: string; phone: string }) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) throw new Error('no_profile');
    return addCustomer(cid, input.name, input.phone);
  }
  if (isApiMode()) {
    const { id } = await apiPost<{ id: string }>('/customers', input);
    return id;
  }
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('no_user');
  const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', uid).single();
  if (!prof) throw new Error('no_profile');
  const { data, error } = await supabase
    .from('customers')
    .insert({
      company_id: prof.company_id as string,
      name: input.name,
      phone: input.phone,
    })
    .select('id')
    .single();
  if (error) throw error;
  return data!.id as string;
}

export async function getCustomer(id: string): Promise<Customer | null> {
  if (isApiMode()) {
    const list = await listCustomers();
    return list.find((c) => c.id === id) ?? null;
  }
  const { data, error } = await supabase.from('customers').select('*').eq('id', id).maybeSingle();
  if (error) throw error;
  if (!data) return null;
  return mapCustomer(data as Record<string, unknown>);
}
