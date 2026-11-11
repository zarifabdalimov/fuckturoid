import type { Args, Result } from '../../../app.contract.d.ts';

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

export type Found = { ok: true; invoice: Invoice } | { ok: false; error: string };
