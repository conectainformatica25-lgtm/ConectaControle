import { create } from 'zustand';

import type { PaymentMethod } from '@/types/models';

export type CartLine = {
  variantId: string;
  productName: string;
  label: string;
  qty: number;
  unitSalePrice: number;
  unitPurchasePrice: number;
};

type CreditDraft = {
  customerId: string;
  downPayment: number;
  installments: { installment_number: number; amount: number; due_date: string }[];
};

type CartState = {
  lines: CartLine[];
  paymentMethod: PaymentMethod;
  creditDraft: CreditDraft | null;
  addLine: (line: CartLine) => void;
  setQty: (variantId: string, qty: number) => void;
  removeLine: (variantId: string) => void;
  clear: () => void;
  setPaymentMethod: (m: PaymentMethod) => void;
  setCreditDraft: (c: CreditDraft | null) => void;
};

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  paymentMethod: 'cash',
  creditDraft: null,
  addLine: (line) => {
    const cur = get().lines;
    const i = cur.findIndex((l) => l.variantId === line.variantId);
    if (i >= 0) {
      const next = [...cur];
      next[i] = { ...next[i], qty: next[i].qty + line.qty };
      set({ lines: next });
    } else {
      set({ lines: [...cur, line] });
    }
  },
  setQty: (variantId, qty) => {
    if (qty <= 0) {
      set({ lines: get().lines.filter((l) => l.variantId !== variantId) });
      return;
    }
    set({
      lines: get().lines.map((l) => (l.variantId === variantId ? { ...l, qty } : l)),
    });
  },
  removeLine: (variantId) =>
    set({ lines: get().lines.filter((l) => l.variantId !== variantId) }),
  clear: () => set({ lines: [], paymentMethod: 'cash', creditDraft: null }),
  setPaymentMethod: (paymentMethod) => set({ paymentMethod }),
  setCreditDraft: (creditDraft) => set({ creditDraft }),
}));
