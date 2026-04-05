/** Divide principal em parcelas mensais a partir da primeira data. */
export function buildMonthlyInstallments(
  principal: number,
  count: number,
  firstDue: Date
): { installment_number: number; amount: number; due_date: string }[] {
  if (count <= 0 || principal <= 0) return [];
  const base = Math.floor((principal * 100) / count) / 100;
  const rows: { installment_number: number; amount: number; due_date: string }[] = [];
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const d = new Date(firstDue);
    d.setMonth(d.getMonth() + i);
    const amt = i === count - 1 ? Math.round((principal - acc) * 100) / 100 : base;
    acc += amt;
    rows.push({
      installment_number: i + 1,
      amount: amt,
      due_date: d.toISOString().slice(0, 10),
    });
  }
  return rows;
}
