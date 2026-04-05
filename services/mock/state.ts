import type { Company, Customer, PaymentMethod, Product, ProductVariant, Profile } from '@/types/models';

export type UserRow = {
  id: string;
  company_id: string;
  email: string;
  password: string;
  full_name: string | null;
  role: Profile['role'];
};

export type SaleRow = {
  id: string;
  company_id: string;
  user_id: string;
  customer_id: string | null;
  total: number;
  payment_method: PaymentMethod;
  created_at: string;
};

export type SaleItemRow = {
  sale_id: string;
  product_variant_id: string;
  quantity: number;
  unit_sale_price: number;
  unit_purchase_price: number;
};

export type DebtRow = {
  id: string;
  company_id: string;
  sale_id: string;
  customer_id: string;
  principal: number;
  down_payment: number;
};

export type InstRow = {
  id: string;
  debt_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: string;
  paid_at: string | null;
};

export const mockState = {
  companies: [] as Company[],
  users: [] as UserRow[],
  products: [] as Product[],
  variants: [] as ProductVariant[],
  customers: [] as Customer[],
  sales: [] as SaleRow[],
  saleItems: [] as SaleItemRow[],
  debts: [] as DebtRow[],
  installments: [] as InstRow[],
  seeded: false,
};

export function mockId() {
  return `m_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}
