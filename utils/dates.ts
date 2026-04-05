export function startOfDayIso(d: Date): string {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x.toISOString();
}

export function endOfDayIso(d: Date): string {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x.toISOString();
}

export function startOfMonthIso(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  return startOfDayIso(x);
}

export function endOfMonthIso(d: Date): string {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
  return x.toISOString();
}

export function todayDateString(): string {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}
