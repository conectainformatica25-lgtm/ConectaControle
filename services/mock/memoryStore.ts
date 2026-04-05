import type { Company, Customer, PaymentMethod, Product, ProductVariant, Profile } from '@/types/models';

import { mockId, mockState } from '@/services/mock/state';

const MOCK_TOKEN = 'mock-token';

export function getMockTokenConstant() {
  return MOCK_TOKEN;
}

export function seedIfEmpty() {
  if (mockState.seeded) return;
  mockState.seeded = true;
  const cid = mockId();
  const uid = mockId();
  mockState.companies.push({
    id: cid,
    name: 'Loja Demo',
    slug: 'demo',
    brand_primary: '#2563eb',
    brand_secondary: '#1d4ed8',
    low_stock_threshold: 5,
    status: 'trial',
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
  });
  mockState.users.push({
    id: uid,
    company_id: cid,
    email: 'demo@demo.com',
    password: 'demo',
    full_name: 'Administrador Demo',
    role: 'admin',
  });
  const pid = mockId();
  const vid = mockId();
  mockState.products.push({
    id: pid,
    company_id: cid,
    name: 'Camiseta básica',
    category: 'Roupas',
    purchase_price: 25,
    sale_price: 59.9,
  });
  mockState.variants.push({
    id: vid,
    company_id: cid,
    product_id: pid,
    size_label: 'M',
    color_label: 'Azul',
    quantity: 10,
    sale_price: null,
  });
  mockState.customers.push({
    id: mockId(),
    company_id: cid,
    name: 'Cliente Teste',
    phone: '11999990000',
  });
}

export function findUserByEmail(email: string) {
  return mockState.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
}

export function findUser(id: string) {
  return mockState.users.find((u) => u.id === id);
}

export function addCompanyAndAdmin(input: {
  companyName: string;
  slug: string;
  fullName: string;
  email: string;
  password: string;
}) {
  const cid = mockId();
  const uid = mockId();
  mockState.companies.push({
    id: cid,
    name: input.companyName,
    slug: input.slug || null,
    brand_primary: null,
    brand_secondary: null,
    low_stock_threshold: 5,
    status: 'trial',
    trial_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    expires_at: null,
  });
  mockState.users.push({
    id: uid,
    company_id: cid,
    email: input.email.trim().toLowerCase(),
    password: input.password,
    full_name: input.fullName,
    role: 'admin',
  });
  return { userId: uid, companyId: cid };
}

export function getCompany(cid: string): Company | undefined {
  return mockState.companies.find((c) => c.id === cid);
}

export function updateCompany(cid: string, patch: Partial<Company>) {
  const i = mockState.companies.findIndex((c) => c.id === cid);
  if (i >= 0) mockState.companies[i] = { ...mockState.companies[i], ...patch };
}

export function getProductsWithVariants(cid: string): (Product & { variants: ProductVariant[] })[] {
  const plist = mockState.products.filter((p) => p.company_id === cid);
  return plist.map((p) => ({
    ...p,
    variants: mockState.variants.filter((v) => v.product_id === p.id),
  }));
}

export function createProductForCompany(
  cid: string,
  input: {
    name: string;
    category: string;
    purchase_price: number;
    sale_price: number;
    variants: { size_label?: string; color_label?: string; quantity: number; sale_price?: number }[];
  }
) {
  const pid = mockId();
  mockState.products.push({
    id: pid,
    company_id: cid,
    name: input.name,
    category: input.category,
    purchase_price: input.purchase_price,
    sale_price: input.sale_price,
  });
  for (const v of input.variants) {
    mockState.variants.push({
      id: mockId(),
      company_id: cid,
      product_id: pid,
      size_label: v.size_label ?? null,
      color_label: v.color_label ?? null,
      quantity: v.quantity,
      sale_price: v.sale_price ?? null,
    });
  }
  return pid;
}

export function listCustomersForCompany(cid: string): Customer[] {
  return mockState.customers.filter((c) => c.company_id === cid);
}

export function addCustomer(cid: string, name: string, phone: string) {
  const id = mockId();
  mockState.customers.push({ id, company_id: cid, name, phone });
  return id;
}

export function processSaleMock(
  cid: string,
  userId: string,
  params: {
    payment_method: PaymentMethod;
    customer_id: string | null;
    items: {
      variant_id: string;
      qty: number;
      unit_sale_price: number;
      unit_purchase_price: number;
    }[];
    credit?: {
      principal: number;
      down_payment: number;
      installments: { installment_number: number; amount: number; due_date: string }[];
    } | null;
  }
) {
  let total = 0;
  for (const it of params.items) total += it.qty * it.unit_sale_price;
  const saleId = mockId();
  const now = new Date().toISOString();
  mockState.sales.push({
    id: saleId,
    company_id: cid,
    user_id: userId,
    customer_id: params.payment_method === 'credit' ? params.customer_id : null,
    total,
    payment_method: params.payment_method,
    created_at: now,
  });
  for (const it of params.items) {
    const vi = mockState.variants.find((v) => v.id === it.variant_id && v.company_id === cid);
    if (!vi || vi.quantity < it.qty) throw new Error('insufficient_stock');
    vi.quantity -= it.qty;
    mockState.saleItems.push({
      sale_id: saleId,
      product_variant_id: it.variant_id,
      quantity: it.qty,
      unit_sale_price: it.unit_sale_price,
      unit_purchase_price: it.unit_purchase_price,
    });
  }
  if (params.payment_method === 'credit' && params.credit && params.customer_id) {
    const debtId = mockId();
    mockState.debts.push({
      id: debtId,
      company_id: cid,
      sale_id: saleId,
      customer_id: params.customer_id,
      principal: params.credit.principal,
      down_payment: params.credit.down_payment,
    });
    for (const ins of params.credit.installments) {
      mockState.installments.push({
        id: mockId(),
        debt_id: debtId,
        installment_number: ins.installment_number,
        amount: ins.amount,
        due_date: ins.due_date,
        status: 'pending',
        paid_at: null,
      });
    }
  }
  return saleId;
}

export function listInstallmentsMock(cid: string) {
  const companyDebts = mockState.debts.filter((d) => d.company_id === cid);
  const debtIds = new Set(companyDebts.map((d) => d.id));
  return mockState.installments
    .filter((i) => debtIds.has(i.debt_id))
    .map((i) => {
      const d = companyDebts.find((x) => x.id === i.debt_id);
      const cust = d ? mockState.customers.find((c) => c.id === d.customer_id) : undefined;
      return {
        id: i.id,
        debt_id: i.debt_id,
        installment_number: i.installment_number,
        amount: i.amount,
        due_date: i.due_date,
        status: i.status,
        paid_at: i.paid_at,
        customer_name: cust?.name,
      };
    });
}

export function markPaidMock(cid: string, installmentId: string) {
  const dIds = mockState.debts.filter((d) => d.company_id === cid).map((d) => d.id);
  const inst = mockState.installments.find(
    (i) => i.id === installmentId && dIds.includes(i.debt_id)
  );
  if (!inst) throw new Error('not_found');
  inst.status = 'paid';
  inst.paid_at = new Date().toISOString();
}

export function listUsersForCompany(cid: string) {
  return mockState.users
    .filter((u) => u.company_id === cid)
    .map((u) => ({ id: u.id, full_name: u.full_name, role: u.role }));
}

export function setVariantQuantityMock(cid: string, variantId: string, quantity: number) {
  const v = mockState.variants.find((x) => x.id === variantId && x.company_id === cid);
  if (v) v.quantity = quantity;
}

export function resetMockData() {
  mockState.companies = [];
  mockState.users = [];
  mockState.products = [];
  mockState.variants = [];
  mockState.customers = [];
  mockState.sales = [];
  mockState.saleItems = [];
  mockState.debts = [];
  mockState.installments = [];
  mockState.seeded = false;
  seedIfEmpty();
}
