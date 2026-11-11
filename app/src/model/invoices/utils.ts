// The arithmetic behind an invoice. Money is in hellers (1/100 Kč).

import { NUMBER_DIGITS } from './preset.ts';
import type { Invoice, Item } from './types.ts';

// "2026-11-11" plus 14 days → "2026-11-25", by the calendar (UTC, so no DST shift).
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// The issue year and the next number in that year's sequence: "2026-0001".
export function nextNumber(all: Invoice[], issued: string): string {
  const year = issued.slice(0, 4);
  const used = all.filter((i) => i.number.startsWith(`${year}-`)).map((i) => Number(i.number.slice(5)));
  return `${year}-${String(Math.max(0, ...used) + 1).padStart(NUMBER_DIGITS, '0')}`;
}

// Each line rounded to the heller, then summed.
export function invoiceTotal(items: Item[]): number {
  return items.reduce((sum, i) => sum + Math.round(i.quantity * i.unitPrice), 0);
}
