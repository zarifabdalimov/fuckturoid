import * as R from 'remeda';
import { nextId } from '../../utils/ids.ts';
import { MISSING, PDF_PREFIX } from './preset.ts';
import type { Found, Invoice, InvoiceInput } from './types.ts';
import { addDays, invoiceTotal, nextNumber } from './utils.ts';

export type { Found, Invoice, InvoiceInput, Item, Party } from './types.ts';
export { addDays, invoiceTotal, nextNumber } from './utils.ts';

export function withDefaults(all: Invoice[]): Invoice[] {
  return R.map(all, (invoice) => {
    const currency = invoice.currency ?? 'CZK';
    return {
      ...invoice,
      account: invoice.account ?? '',
      currency,
      client: { ...invoice.client, currency: invoice.client.currency ?? currency },
      supplier: { ...invoice.supplier, currency: invoice.supplier.currency ?? currency },
    };
  });
}

export function sortInvoices(all: Invoice[]): Invoice[] {
  return R.sortBy(all, [(invoice) => invoice.issued, 'desc'], [(invoice) => invoice.number, 'desc']);
}

export function putInvoice(all: Invoice[], id: string, input: InvoiceInput): Invoice[] {
  const fields = { ...input, due: addDays(input.issued, input.dueDays), total: invoiceTotal(input.items) };
  if (id === '') {
    return R.concat(all, [
      { id: nextId(all), number: nextNumber(all, input.issued), paid: false, paidOn: '', ...fields },
    ]);
  }
  return R.map(all, (invoice) => (invoice.id === id ? { ...invoice, ...fields } : invoice));
}

export function setPaid(all: Invoice[], id: string, paid: boolean, day: string): Invoice[] {
  return R.map(all, (invoice) => (invoice.id === id ? { ...invoice, paid, paidOn: paid ? day : '' } : invoice));
}

export function removeInvoice(all: Invoice[], id: string): Invoice[] {
  return R.filter(all, (invoice) => invoice.id !== id);
}

export function findInvoice(all: Invoice[], id: string): Found {
  const invoice = R.find(all, (candidate) => candidate.id === id);
  return invoice ? { ok: true, invoice } : { ok: false, error: MISSING };
}

export function pdfFileName(inv: Invoice): string {
  return `${PDF_PREFIX}-${inv.number}.pdf`;
}
