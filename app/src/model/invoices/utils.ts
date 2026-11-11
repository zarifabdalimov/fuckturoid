import * as R from 'remeda';
import { NUMBER_DIGITS } from './preset.ts';
import type { Invoice, Item } from './types.ts';

export function addDays(iso: string, days: number): string {
  const [year, month, day] = R.map(iso.split('-'), Number);
  return new Date(Date.UTC(year, month - 1, day + days)).toISOString().slice(0, 10);
}

export function nextNumber(all: Invoice[], issued: string): string {
  const year = issued.slice(0, 4);
  const last = R.pipe(
    all,
    R.filter((invoice) => invoice.number.startsWith(`${year}-`)),
    R.reduce((max, invoice) => Math.max(max, Number(invoice.number.slice(5))), 0),
  );
  return `${year}-${String(last + 1).padStart(NUMBER_DIGITS, '0')}`;
}

export function invoiceTotal(items: Item[]): number {
  return R.sumBy(items, (item) => Math.round(item.quantity * item.unitPrice));
}
