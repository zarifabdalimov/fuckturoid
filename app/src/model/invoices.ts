// The rules for invoices: numbering, due dates, totals, payment. Pure
// functions: a list in, a new list out. Money is in hellers (1/100 Kč).

import type { Args, Result } from '../../app.contract.d.ts';
import { nextId } from './ids.ts';

export type Invoice = Result<'loadInvoices'>[number];
type SaveArgs = Args<'saveInvoice'>;
export type Party = SaveArgs[1];
export type Item = SaveArgs[5][number];

// What the person decides; the rest (number, due date, total) follows from it.
export type InvoiceInput = {
  client: Party;
  supplier: Party;
  issued: string;
  dueDays: number;
  items: Item[];
};

// Newest first: by issue date, then by number.
export function sortInvoices(all: Invoice[]): Invoice[] {
  return [...all].sort((a, b) => b.issued.localeCompare(a.issued) || b.number.localeCompare(a.number));
}

// "2026-11-11" plus 14 days → "2026-11-25", by the calendar (UTC, so no DST shift).
export function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Fakturoid's numbering: the issue year and a sequence per year, "2026-0001".
export function nextNumber(all: Invoice[], issued: string): string {
  const year = issued.slice(0, 4);
  const used = all.filter((i) => i.number.startsWith(`${year}-`)).map((i) => Number(i.number.slice(5)));
  return `${year}-${String(Math.max(0, ...used) + 1).padStart(4, '0')}`;
}

// Each line rounded to the heller, then summed.
export function invoiceTotal(items: Item[]): number {
  return items.reduce((sum, i) => sum + Math.round(i.quantity * i.unitPrice), 0);
}

// Adds an invoice (id "") with the next number, or updates one, keeping its
// number and payment.
export function putInvoice(all: Invoice[], id: string, input: InvoiceInput): Invoice[] {
  const fields = { ...input, due: addDays(input.issued, input.dueDays), total: invoiceTotal(input.items) };
  if (id === '') {
    return [...all, { id: nextId(all), number: nextNumber(all, input.issued), paid: false, paidOn: '', ...fields }];
  }
  return all.map((i) => (i.id === id ? { ...i, ...fields } : i));
}

// Paid on `day`, or back to unpaid.
export function setPaid(all: Invoice[], id: string, paid: boolean, day: string): Invoice[] {
  return all.map((i) => (i.id === id ? { ...i, paid, paidOn: paid ? day : '' } : i));
}

// The invoice to export, or why there is none.
export function findInvoice(all: Invoice[], id: string): { ok: true; invoice: Invoice } | { ok: false; error: string } {
  const invoice = all.find((i) => i.id === id);
  return invoice ? { ok: true, invoice } : { ok: false, error: 'This invoice no longer exists.' };
}

// What an exported invoice is called: "Faktura-2026-0001.pdf".
export function pdfFileName(inv: Invoice): string {
  return `Faktura-${inv.number}.pdf`;
}

export function removeInvoice(all: Invoice[], id: string): Invoice[] {
  return all.filter((i) => i.id !== id);
}
