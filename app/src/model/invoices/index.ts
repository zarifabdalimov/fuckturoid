import * as R from 'remeda';
import { nextId } from '../../utils/ids.ts';
import { bankDetails } from '../bank/index.ts';
import { LANGUAGES, MISSING, PDF_PREFIX } from './preset.ts';
import type { Duplicated, Found, Invoice, InvoiceInput, Party, StoredInvoice } from './types.ts';
import { addDays, invoiceTotal, monthOf, nextNumber, shiftMonthNames } from './utils.ts';

export type { Duplicated, Found, Invoice, InvoiceInput, Item, Party, StoredInvoice } from './types.ts';
export { addDays, invoiceTotal, nextNumber, shiftMonthNames } from './utils.ts';

export function withDefaults(all: StoredInvoice[]): Invoice[] {
  return R.map(all, (invoice) => {
    const currency = invoice.currency ?? 'CZK';
    const account = invoice.account ?? '';
    return {
      ...invoice,
      ...bankDetails(account),
      account,
      currency,
      language: LANGUAGES.includes(invoice.language) ? invoice.language : 'cs',
      client: { ...invoice.client, currency: invoice.client.currency ?? currency },
      supplier: { ...invoice.supplier, currency: invoice.supplier.currency ?? currency },
    };
  });
}

export function sortInvoices(all: Invoice[]): Invoice[] {
  return R.sortBy(all, [(invoice) => invoice.issued, 'desc'], [(invoice) => invoice.number, 'desc']);
}

export function putInvoice(all: StoredInvoice[], id: string, input: InvoiceInput): StoredInvoice[] {
  const fields = { ...input, due: addDays(input.issued, input.dueDays), total: invoiceTotal(input.items) };
  if (id === '') {
    return R.concat(all, [
      { id: nextId(all), number: nextNumber(all, input.issued), paid: false, paidOn: '', ...fields },
    ]);
  }
  return R.map(all, (invoice) => (invoice.id === id ? { ...invoice, ...fields } : invoice));
}

export function setPaid(all: StoredInvoice[], id: string, paid: boolean, day: string): StoredInvoice[] {
  return R.map(all, (invoice) => (invoice.id === id ? { ...invoice, paid, paidOn: paid ? day : '' } : invoice));
}

export function removeInvoice(all: StoredInvoice[], id: string): StoredInvoice[] {
  return R.filter(all, (invoice) => invoice.id !== id);
}

export function findInvoice(all: StoredInvoice[], id: string): Found {
  const invoice = R.find(all, (candidate) => candidate.id === id);
  return invoice ? { ok: true, invoice } : { ok: false, error: MISSING };
}

export function pdfFileName(inv: StoredInvoice): string {
  return `${PDF_PREFIX[inv.language] ?? PDF_PREFIX.cs}-${inv.number}.pdf`;
}

export function duplicateInvoice(
  all: StoredInvoice[],
  id: string,
  today: string,
  supplier: Party,
  account: string,
): Duplicated | undefined {
  const original = R.find(all, (invoice) => invoice.id === id);
  if (!original) return undefined;
  const items = R.map(original.items, (item) => ({
    ...item,
    description: shiftMonthNames(item.description, monthOf(original.issued), monthOf(today)),
  }));
  const copy: StoredInvoice = {
    ...original,
    id: nextId(all),
    number: nextNumber(all, today),
    issued: today,
    due: addDays(today, original.dueDays),
    supplier,
    account,
    items,
    paid: false,
    paidOn: '',
  };
  return { next: R.concat(all, [copy]), id: copy.id };
}
