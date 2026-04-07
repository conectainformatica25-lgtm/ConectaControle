/**
 * Divide o principal em parcelas com vencimentos a partir de 30 dias da data base.
 *
 * Regra de negócio:
 *   - Parcela 1 → baseDate + 30 dias
 *   - Parcela 2 → baseDate + 60 dias
 *   - Parcela N → baseDate + (N * 30) dias
 *
 * A entrada (down_payment) é paga no ato e NÃO gera parcela.
 * Funciona igual com ou sem entrada.
 */
export function buildMonthlyInstallments(
  principal: number,
  count: number,
  baseDate: Date   // data da compra (today)
): { installment_number: number; amount: number; due_date: string }[] {
  if (count <= 0 || principal <= 0) return [];
  const base = Math.floor((principal * 100) / count) / 100;
  const rows: { installment_number: number; amount: number; due_date: string }[] = [];
  let acc = 0;
  for (let i = 0; i < count; i++) {
    const d = new Date(baseDate);
    // Parcela i+1 vence em (i+1) * 30 dias após a data base
    d.setDate(d.getDate() + (i + 1) * 30);
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
