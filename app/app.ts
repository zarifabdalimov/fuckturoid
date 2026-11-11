// The data module: grants, and every source app.contract asks for. Each source
// loads what it needs, applies a rule from src/model/, and saves the result;
// ARES and the PDF come from src/modules/.

import type { Answer, Sources } from './app.contract.d.ts';
import { type Client, putClient, removeClient, sortClients } from './src/model/clients.ts';
import {
  findInvoice,
  type Invoice,
  pdfFileName,
  putInvoice,
  removeInvoice,
  setPaid,
  sortInvoices,
} from './src/model/invoices.ts';
import { lookupIco } from './src/modules/ares/ares.ts';
import { invoicePdf } from './src/modules/pdf/invoice-pdf.ts';
import { store, writeFile } from './src/modules/storage/store.ts';

const CLIENTS = 'app:/data/clients.json';
const INVOICES = 'app:/data/invoices.json';
// Exported PDFs: made again whenever they're shared.
const PDFS = 'app:/cache/invoices';

// What the app may reach. The build reads this without running the module, so
// it is written out here rather than gathered from the modules.
export const grants = [
  'net.fetch https://ares.gov.cz',
  `fs.read ${CLIENTS}`,
  `fs.write ${CLIENTS}`,
  `fs.read ${INVOICES}`,
  `fs.write ${INVOICES}`,
  `fs.read ${PDFS}`,
  `fs.write ${PDFS}`,
].join('\n');

const clients = store<Client>(CLIENTS);
const invoices = store<Invoice>(INVOICES);

const sources: Sources = {
  lookupIco: ([ico]) => lookupIco(ico),

  loadClients: async (_args, _store, storage) => sortClients(await clients.load(storage)),
  saveClient: async ([id, name, ico, dic, street, city, zip, email], _store, storage) => {
    const change = putClient(await clients.load(storage), id, { name, ico, dic, street, city, zip, email });
    return change.ok ? clients.save(storage, change.next) : { ok: false, error: change.error };
  },
  removeClient: async ([id], _store, storage) =>
    clients.save(storage, removeClient(await clients.load(storage), id)),

  loadInvoices: async (_args, _store, storage) => sortInvoices(await invoices.load(storage)),
  saveInvoice: async ([id, client, supplier, issued, dueDays, items], _store, storage) =>
    invoices.save(storage, putInvoice(await invoices.load(storage), id, { client, supplier, issued, dueDays, items })),
  setInvoicePaid: async ([id, paid, day], _store, storage) =>
    invoices.save(storage, setPaid(await invoices.load(storage), id, paid, day)),
  removeInvoice: async ([id], _store, storage) =>
    invoices.save(storage, removeInvoice(await invoices.load(storage), id)),

  // An invoice's PDF, written where the share sheet can read it.
  makeInvoicePdf: async ([id], _store, storage) => {
    const found = findInvoice(await invoices.load(storage), id);
    if (!found.ok) return { ok: false, error: found.error, path: '' };
    const path = await writeFile(storage, PDFS, pdfFileName(found.invoice), invoicePdf(found.invoice));
    return { ok: true, error: '', path };
  },

  // Log out: every client and invoice on this phone is gone.
  eraseAll: async (_args, _store, storage) => {
    await clients.save(storage, []);
    return invoices.save(storage, []);
  },
};
export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
