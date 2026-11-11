// The rules for invoices: numbering, due dates, totals, payment, export.
// Pure functions: a list in, a new list out.

import * as R from 'remeda';
import { nextId } from '../../utils/ids.ts';
import { MISSING, PDF_PREFIX } from './preset.ts';
import type { Found, Invoice, InvoiceInput } from './types.ts';
import { addDays, invoiceTotal, nextNumber } from './utils.ts';

export type { Found, Invoice, InvoiceInput, Item, Party } from './types.ts';
export { addDays, invoiceTotal, nextNumber } from './utils.ts';

// Newest first: by issue date, then by number.
export function sortInvoices(all: Invoice[]): Invoice[] {
  return R.sortBy(all, [(i) => i.issued, 'desc'], [(i) => i.number, 'desc']);
}

// Adds an invoice (id "") with the next number, or updates one, keeping its
// number and payment.
export function putInvoice(all: Invoice[], id: string, input: InvoiceInput): Invoice[] {
  const fields = { ...input, due: addDays(input.issued, input.dueDays), total: invoiceTotal(input.items) };
  if (id === '') {
    return R.concat(all, [{ id: nextId(all), number: nextNumber(all, input.issued), paid: false, paidOn: '', ...fields }]);
  }
  return R.map(all, (i) => (i.id === id ? { ...i, ...fields } : i));
}

// Paid on `day`, or back to unpaid.
export function setPaid(all: Invoice[], id: string, paid: boolean, day: string): Invoice[] {
  return R.map(all, (i) => (i.id === id ? { ...i, paid, paidOn: paid ? day : '' } : i));
}

export function removeInvoice(all: Invoice[], id: string): Invoice[] {
  return R.filter(all, (i) => i.id !== id);
}

// The invoice to export, or why there is none.
export function findInvoice(all: Invoice[], id: string): Found {
  const invoice = R.find(all, (i) => i.id === id);
  return invoice ? { ok: true, invoice } : { ok: false, error: MISSING };
}

// What an exported invoice is called: "Faktura-2026-0001.pdf".
export function pdfFileName(inv: Invoice): string {
  return `${PDF_PREFIX}-${inv.number}.pdf`;
}
