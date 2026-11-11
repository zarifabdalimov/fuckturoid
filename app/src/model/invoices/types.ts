import type { Args, Result } from '../../../app.contract.d.ts';

export type Invoice = Result<'loadInvoices'>[number];
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
};

export type Found = { ok: true; invoice: Invoice } | { ok: false; error: string };
