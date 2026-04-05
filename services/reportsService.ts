import { isApiMode } from '@/services/api/config';
import { apiGet } from '@/services/api/http';
import { isMockMode } from '@/services/mock/env';
import { seedIfEmpty } from '@/services/mock/memoryStore';
import { reportsTotalsMock } from '@/services/mock/mockReports';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';

export async function aggregateSalesByPayment(fromIso: string, toIso: string) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return {};
    return reportsTotalsMock(cid, fromIso, toIso).byPayment;
  }
  if (isApiMode()) {
    const r = await apiGet<{ byPayment: Record<string, number> }>(
      `/reports/summary?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
    return r.byPayment ?? {};
  }
  const { data, error } = await supabase
    .from('sales')
    .select('payment_method, total')
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
  if (error) throw error;
  const map = new Map<string, number>();
  for (const row of data ?? []) {
    const k = row.payment_method as string;
    map.set(k, (map.get(k) ?? 0) + Number(row.total));
  }
  return Object.fromEntries(map);
}

export async function topProducts(fromIso: string, toIso: string, limit = 10) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return [];
    return reportsTotalsMock(cid, fromIso, toIso).topProducts.slice(0, limit);
  }
  if (isApiMode()) {
    const r = await apiGet<{ topProducts: { name: string; qty: number }[] }>(
      `/reports/summary?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
    return (r.topProducts ?? []).slice(0, limit);
  }
  const { data: sales, error: e1 } = await supabase
    .from('sales')
    .select('id')
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
  if (e1) throw e1;
  const ids = (sales ?? []).map((s) => s.id as string);
  if (ids.length === 0) return [];
  const { data: items, error: e2 } = await supabase
    .from('sale_items')
    .select('product_variant_id, quantity')
    .in('sale_id', ids);
  if (e2) throw e2;
  const qtyByVariant = new Map<string, number>();
  for (const it of items ?? []) {
    const vid = it.product_variant_id as string;
    qtyByVariant.set(vid, (qtyByVariant.get(vid) ?? 0) + Number(it.quantity));
  }
  const vids = [...qtyByVariant.keys()];
  const { data: vars, error: e3 } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .in('id', vids);
  if (e3) throw e3;
  const pidSet = [...new Set((vars ?? []).map((v) => v.product_id as string))];
  const { data: prods, error: e4 } = await supabase.from('products').select('id, name').in('id', pidSet);
  if (e4) throw e4;
  const nameByProduct = new Map((prods ?? []).map((p) => [p.id as string, p.name as string]));
  const rows: { name: string; qty: number }[] = [];
  for (const v of vars ?? []) {
    const pid = v.product_id as string;
    rows.push({
      name: nameByProduct.get(pid) ?? '?',
      qty: qtyByVariant.get(v.id as string) ?? 0,
    });
  }
  return rows.sort((a, b) => b.qty - a.qty).slice(0, limit);
}

export async function profitEstimate(fromIso: string, toIso: string) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return { revenue: 0, cost: 0, profit: 0 };
    return reportsTotalsMock(cid, fromIso, toIso).profit;
  }
  if (isApiMode()) {
    const r = await apiGet<{ profit: { revenue: number; cost: number; profit: number } }>(
      `/reports/summary?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
    return r.profit ?? { revenue: 0, cost: 0, profit: 0 };
  }
  const { data: sales, error: e1 } = await supabase
    .from('sales')
    .select('id')
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
  if (e1) throw e1;
  const ids = (sales ?? []).map((s) => s.id as string);
  if (ids.length === 0) return { revenue: 0, cost: 0, profit: 0 };
  const { data: items, error: e2 } = await supabase
    .from('sale_items')
    .select('quantity, unit_sale_price, unit_purchase_price')
    .in('sale_id', ids);
  if (e2) throw e2;
  let revenue = 0;
  let cost = 0;
  for (const it of items ?? []) {
    const q = Number(it.quantity);
    revenue += q * Number(it.unit_sale_price);
    cost += q * Number(it.unit_purchase_price);
  }
  return { revenue, cost, profit: revenue - cost };
}

export async function salesTotalInRange(fromIso: string, toIso: string): Promise<number> {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return 0;
    return reportsTotalsMock(cid, fromIso, toIso).totalSales;
  }
  if (isApiMode()) {
    const r = await apiGet<{ total: number }>(
      `/reports/sales-total?from=${encodeURIComponent(fromIso)}&to=${encodeURIComponent(toIso)}`
    );
    return Number(r.total ?? 0);
  }
  const { data, error } = await supabase
    .from('sales')
    .select('total')
    .gte('created_at', fromIso)
    .lte('created_at', toIso);
  if (error) throw error;
  return (data ?? []).reduce((s, row) => s + Number(row.total), 0);
}
