export type LedgerCharge = { id: string; amount: number; dueDate: string; payments: { amount: number }[] };
export function chargeBalance(charge: LedgerCharge) { return Math.max(0, charge.amount - charge.payments.reduce((sum, p) => sum + p.amount, 0)); }
export function chargeState(charge: LedgerCharge, today: string) {
  const balance = chargeBalance(charge);
  return balance === 0 ? 'Pagado' : charge.dueDate.slice(0, 10) < today ? 'Vencido' : balance < charge.amount ? 'Abonado' : 'Pendiente';
}
export function chileToday(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Santiago', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return `${parts.find(p=>p.type==='year')!.value}-${parts.find(p=>p.type==='month')!.value}-${parts.find(p=>p.type==='day')!.value}`;
}
