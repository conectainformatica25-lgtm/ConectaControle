import { isApiMode } from '@/services/api/config';
import { apiGet, apiPatch } from '@/services/api/http';
import { isMockMode } from '@/services/mock/env';
import { listUsersForCompany, seedIfEmpty, updateCompany } from '@/services/mock/memoryStore';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Company } from '@/types/models';

export async function updateCompanyBranding(
  companyId: string,
  patch: Pick<Company, 'brand_primary' | 'brand_secondary' | 'low_stock_threshold'>
) {
  if (isMockMode()) {
    seedIfEmpty();
    updateCompany(companyId, patch);
    const st = useAuthStore.getState();
    if (st.profile && st.company?.id === companyId) {
      st.setSession({
        profile: st.profile,
        company: { ...st.company, ...patch },
      });
    }
    return;
  }
  if (isApiMode()) {
    await apiPatch('/company', {
      brand_primary: patch.brand_primary,
      brand_secondary: patch.brand_secondary,
      low_stock_threshold: patch.low_stock_threshold,
    });
    return;
  }
  const { error } = await supabase
    .from('companies')
    .update({
      brand_primary: patch.brand_primary,
      brand_secondary: patch.brand_secondary,
      low_stock_threshold: patch.low_stock_threshold,
    })
    .eq('id', companyId);
  if (error) throw error;
}

export async function listProfilesForCompany(): Promise<
  { id: string; full_name: string | null; role: string }[]
> {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return [];
    return listUsersForCompany(cid);
  }
  if (isApiMode()) {
    const { items } = await apiGet<{ items: { id: string; full_name: string | null; role: string }[] }>(
      '/profiles'
    );
    return items ?? [];
  }
  const { data, error } = await supabase.from('profiles').select('id, full_name, role');
  if (error) throw error;
  return data ?? [];
}
