export type UserRole = 'admin' | 'employee';

export type PaymentMethod = 'cash' | 'pix' | 'card' | 'credit';

export type InstallmentStatus = 'pending' | 'paid' | 'overdue';

export type Profile = {
  id: string;
  company_id: string;
  full_name: string | null;
  role: UserRole;
};

export type SubscriptionStatus = 'trial' | 'active' | 'overdue';

export type Company = {
  id: string;
  name: string;
  slug: string | null;
  brand_primary: string | null;
  brand_secondary: string | null;
  low_stock_threshold: number;
  status: SubscriptionStatus;
  trial_ends_at: string;
  expires_at: string | null;
};

export type Product = {
  id: string;
  company_id: string;
  name: string;
  code: string | null;
  category: string;
  purchase_price: number;
  sale_price: number;
};

export type ProductVariant = {
  id: string;
  company_id: string;
  product_id: string;
  size_label: string | null;
  color_label: string | null;
  quantity: number;
  sale_price: number | null;
};

export type Customer = {
  id: string;
  company_id: string;
  name: string;
  phone: string;
};

export type Sale = {
  id: string;
  company_id: string;
  total: number;
  payment_method: PaymentMethod;
  created_at: string;
  customer_id: string | null;
};

export type Debt = {
  id: string;
  company_id: string;
  sale_id: string;
  customer_id: string;
  principal: number;
  down_payment: number;
};

export type Installment = {
  id: string;
  debt_id: string;
  installment_number: number;
  amount: number;
  due_date: string;
  status: InstallmentStatus;
  paid_at: string | null;
};
