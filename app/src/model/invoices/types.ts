import type { Args, Result } from '../../../app.contract.d.ts';

export type Invoice = Result<'loadInvoices'>[number];
export type StoredInvoice = Omit<Invoice, 'iban' | 'bic' | 'bankName'>;
type SaveArgs = Args<'saveInvoice'>;
export type Party = SaveArgs[1];
export type Item = SaveArgs[5][number];

export type InvoiceInput = {
  client: Party;
  supplier: Party;
  issued: string;
  dueDays: number;
  items: Item[];
  account: string;
  currency: string;
  language: string;
};

export type Found = { ok: true; invoice: StoredInvoice } | { ok: false; error: string };

export type Duplicated = { next: StoredInvoice[]; id: string };
