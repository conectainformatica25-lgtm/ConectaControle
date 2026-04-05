import { isApiMode } from '@/services/api/config';
import { apiGet, apiPatch } from '@/services/api/http';
import { isMockMode } from '@/services/mock/env';
import { listInstallmentsMock, markPaidMock, seedIfEmpty } from '@/services/mock/memoryStore';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';

export type InstallmentRow = {
  id: string;
  debt_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
  customer_name?: string;
};

export async function listInstallmentsWithDebt() {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return [];
    return listInstallmentsMock(cid);
  }
  if (isApiMode()) {
    const { items } = await apiGet<{ items: InstallmentRow[] }>('/installments');
    return items ?? [];
  }
  const { data: inst, error: e2 } = await supabase.from('installments').select('*');
  if (e2) throw e2;
  const list = inst ?? [];
  if (list.length === 0) return [];
  const debtIds = [...new Set(list.map((i) => i.debt_id as string))];
  const { data: debts, error: e1 } = await supabase
    .from('debts')
    .select('id, customer_id')
    .in('id', debtIds);
  if (e1) throw e1;
  const customerIds = [...new Set((debts ?? []).map((d) => d.customer_id as string))];
  const { data: customers, error: e3 } = await supabase
    .from('customers')
    .select('id, name')
    .in('id', customerIds);
  if (e3) throw e3;
  const nameByCustomer = new Map((customers ?? []).map((c) => [c.id as string, c.name as string]));
  const debtToCustomer = new Map((debts ?? []).map((d) => [d.id as string, d.customer_id as string]));

  const rows: InstallmentRow[] = list.map((i) => {
    const cid = debtToCustomer.get(i.debt_id as string);
    return {
      id: i.id as string,
      debt_id: i.debt_id as string,
      installment_number: i.installment_number as number,
      amount: Number(i.amount),
      due_date: i.due_date as string,
      status: i.status as string,
      paid_at: (i.paid_at as string) ?? null,
      customer_name: cid ? nameByCustomer.get(cid) : undefined,
    };
  });
  return rows;
}

export async function markInstallmentPaid(installmentId: string) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) throw new Error('no_profile');
    markPaidMock(cid, installmentId);
    return;
  }
  if (isApiMode()) {
    await apiPatch(`/installments/${installmentId}/pay`, {});
    return;
  }
  const { error } = await supabase
    .from('installments')
    .update({ status: 'paid', paid_at: new Date().toISOString() })
    .eq('id', installmentId);
  if (error) throw error;
}
