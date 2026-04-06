import { isApiMode } from '@/services/api/config';
import { apiGet, apiPost } from '@/services/api/http';
import { isMockMode } from '@/services/mock/env';
import {
  createProductForCompany,
  getProductsWithVariants,
  seedIfEmpty,
  setVariantQuantityMock,
} from '@/services/mock/memoryStore';
import { supabase } from '@/services/supabase/client';
import { useAuthStore } from '@/store/authStore';
import type { Product, ProductVariant } from '@/types/models';

export type ProductWithVariants = Product & { variants: ProductVariant[] };

function mapProduct(row: Record<string, unknown>): Product {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    name: row.name as string,
    code: (row.code as string) ?? null,
    category: row.category as string,
    purchase_price: Number(row.purchase_price),
    sale_price: Number(row.sale_price),
  };
}

function mapVariant(row: Record<string, unknown>): ProductVariant {
  return {
    id: row.id as string,
    company_id: row.company_id as string,
    product_id: row.product_id as string,
    size_label: (row.size_label as string) ?? null,
    color_label: (row.color_label as string) ?? null,
    quantity: Number(row.quantity),
    sale_price: row.sale_price != null ? Number(row.sale_price) : null,
  };
}

export async function listProductsWithVariants(): Promise<ProductWithVariants[]> {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return [];
    return getProductsWithVariants(cid);
  }
  if (isApiMode()) {
    const { items } = await apiGet<{ items: Record<string, unknown>[] }>('/products');
    return (items ?? []).map((row) => {
      const { variants: va, ...rest } = row;
      const vars = (va as Record<string, unknown>[] | undefined) ?? [];
      return {
        ...mapProduct(rest as Record<string, unknown>),
        variants: vars.map((v) => mapVariant(v)),
      };
    });
  }
  const { data: products, error: e1 } = await supabase
    .from('products')
    .select('*')
    .order('name');
  if (e1) throw e1;
  const { data: variants, error: e2 } = await supabase.from('product_variants').select('*');
  if (e2) throw e2;
  const list = (products ?? []).map((r) => mapProduct(r as Record<string, unknown>));
  const vmap = new Map<string, ProductVariant[]>();
  for (const v of variants ?? []) {
    const pv = mapVariant(v as Record<string, unknown>);
    const arr = vmap.get(pv.product_id) ?? [];
    arr.push(pv);
    vmap.set(pv.product_id, arr);
  }
  return list.map((p) => ({ ...p, variants: vmap.get(p.id) ?? [] }));
}

export async function createProduct(input: {
  name: string;
  code: string | null;
  category: string;
  purchase_price: number;
  sale_price: number;
  variants: { size_label?: string; color_label?: string; quantity: number; sale_price?: number }[];
}) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) throw new Error('no_profile');
    return createProductForCompany(cid, input);
  }
  if (isApiMode()) {
    const { id } = await apiPost<{ id: string }>('/products', input);
    return id;
  }
  const { data: userData } = await supabase.auth.getUser();
  const uid = userData.user?.id;
  if (!uid) throw new Error('no_user');
  const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', uid).single();
  if (!prof) throw new Error('no_profile');
  const companyId = prof.company_id as string;

  const { data: prod, error: pe } = await supabase
    .from('products')
    .insert({
      company_id: companyId,
      name: input.name,
      code: input.code,
      category: input.category,
      purchase_price: input.purchase_price,
      sale_price: input.sale_price,
    })
    .select('id')
    .single();
  if (pe) throw pe;
  const productId = prod!.id as string;

  const rows = input.variants.map((v) => ({
    company_id: companyId,
    product_id: productId,
    size_label: v.size_label ?? null,
    color_label: v.color_label ?? null,
    quantity: v.quantity,
    sale_price: v.sale_price ?? null,
  }));
  const { error: ve } = await supabase.from('product_variants').insert(rows);
  if (ve) throw ve;
  return productId;
}

export async function updateVariantQuantity(variantId: string, quantity: number) {
  if (isMockMode()) {
    seedIfEmpty();
    const cid = useAuthStore.getState().profile?.company_id;
    if (!cid) return;
    setVariantQuantityMock(cid, variantId, quantity);
    return;
  }
  if (isApiMode()) {
    throw new Error('Atualize estoque via ajuste futuro ou API');
  }
  const { error } = await supabase.from('product_variants').update({ quantity }).eq('id', variantId);
  if (error) throw error;
}
