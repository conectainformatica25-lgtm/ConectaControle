import { isApiMode } from '@/services/api/config';
import { apiPost } from '@/services/api/http';
import { isMockMode } from '@/services/mock/env';
import { processSaleMock, seedIfEmpty } from '@/services/mock/memoryStore';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { PaymentMethod } from '@/types/models';

export type SaleItemPayload = {
  variant_id: string;
  qty: number;
  unit_sale_price: number;
  unit_purchase_price: number;
};

export type CreditPayload = {
  principal: number;
  down_payment: number;
  installments: { installment_number: number; amount: number; due_date: string }[];
};

export async function processSale(params: {
  payment_method: PaymentMethod;
  customer_id: string | null;
  items: SaleItemPayload[];
  credit?: CreditPayload | null;
}) {
  if (isMockMode()) {
    seedIfEmpty();
    const p = useAuthStore.getState().profile;
    if (!p) throw new Error('no_profile');
    const creditJson =
      params.payment_method === 'credit' && params.credit
        ? {
            principal: params.credit.principal,
            down_payment: params.credit.down_payment,
            installments: params.credit.installments,
          }
        : null;
    return processSaleMock(p.company_id, p.id, {
      payment_method: params.payment_method,
      customer_id: params.customer_id,
      items: params.items,
      credit: creditJson,
    });
  }
  if (isApiMode()) {
    const creditJson =
      params.payment_method === 'credit' && params.credit
        ? {
            principal: params.credit.principal,
            down_payment: params.credit.down_payment,
            installments: params.credit.installments,
          }
        : null;
    const { saleId } = await apiPost<{ saleId: string }>('/sales/process', {
      payment_method: params.payment_method,
      customer_id: params.customer_id,
      items: params.items,
      credit: creditJson,
    });
    return saleId;
  }
  const items = params.items.map((i) => ({
    variant_id: i.variant_id,
    qty: i.qty,
    unit_sale_price: i.unit_sale_price,
    unit_purchase_price: i.unit_purchase_price,
  }));

  const creditJson =
    params.payment_method === 'credit' && params.credit
      ? {
          principal: params.credit.principal,
          down_payment: params.credit.down_payment,
          installments: params.credit.installments,
        }
      : null;

  const { data, error } = await supabase.rpc('process_sale', {
    p_payment_method: params.payment_method,
    p_customer_id: params.customer_id,
    p_items: items,
    p_credit: creditJson,
  });
  if (error) throw error;
  return data as string;
}

export async function listSalesInRange(fromIso: string, toIso: string) {
  const { data, error } = await supabase
    .from('sales')
    .select('id, total, payment_method, created_at, customer_id')
    .gte('created_at', fromIso)
    .lte('created_at', toIso)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
}
