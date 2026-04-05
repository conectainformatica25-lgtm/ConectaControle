import { mockState } from '@/services/mock/state';

export function reportsTotalsMock(cid: string, fromIso: string, toIso: string) {
  const inRange = mockState.sales.filter(
    (s) => s.company_id === cid && s.created_at >= fromIso && s.created_at <= toIso
  );
  let total = 0;
  const byPayment: Record<string, number> = {};
  for (const s of inRange) {
    total += s.total;
    byPayment[s.payment_method] = (byPayment[s.payment_method] ?? 0) + s.total;
  }
  const saleIds = new Set(inRange.map((s) => s.id));
  let revenue = 0;
  let cost = 0;
  const qtyByVariant = new Map<string, number>();
  for (const si of mockState.saleItems) {
    if (!saleIds.has(si.sale_id)) continue;
    revenue += si.quantity * si.unit_sale_price;
    cost += si.quantity * si.unit_purchase_price;
    qtyByVariant.set(
      si.product_variant_id,
      (qtyByVariant.get(si.product_variant_id) ?? 0) + si.quantity
    );
  }
  const top: { name: string; qty: number }[] = [];
  for (const [vid, qty] of qtyByVariant) {
    const v = mockState.variants.find((x) => x.id === vid);
    const p = v ? mockState.products.find((x) => x.id === v.product_id) : undefined;
    if (p) top.push({ name: p.name, qty });
  }
  top.sort((a, b) => b.qty - a.qty);
  return {
    totalSales: total,
    byPayment,
    profit: { revenue, cost, profit: revenue - cost },
    topProducts: top.slice(0, 10),
  };
}
