import type { Answer, Sources } from './app.contract.d.ts';
import { type Client, putClient, removeClient, sortClients } from './src/model/clients/index.ts';
import { czechIban } from './src/model/bank/index.ts';
import {
  findInvoice,
  type Invoice,
  pdfFileName,
  putInvoice,
  removeInvoice,
  setPaid,
  sortInvoices,
  withDefaults,
} from './src/model/invoices/index.ts';
import { lookupIco } from './src/modules/ares/index.ts';
import { invoicePdf } from './src/modules/pdf/index.ts';
import { store, writeFile } from './src/modules/storage/index.ts';

const CLIENTS = 'app:/data/clients.json';
const INVOICES = 'app:/data/invoices.json';
const PDFS = 'app:/cache/invoices';

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
  removeClient: async ([id], _store, storage) => clients.save(storage, removeClient(await clients.load(storage), id)),

  loadInvoices: async (_args, _store, storage) => sortInvoices(withDefaults(await invoices.load(storage))),
  saveInvoice: async ([id, client, supplier, issued, dueDays, items, account], _store, storage) =>
    invoices.save(
      storage,
      putInvoice(await invoices.load(storage), id, { client, supplier, issued, dueDays, items, account }),
    ),
  setInvoicePaid: async ([id, paid, day], _store, storage) =>
    invoices.save(storage, setPaid(await invoices.load(storage), id, paid, day)),
  removeInvoice: async ([id], _store, storage) =>
    invoices.save(storage, removeInvoice(await invoices.load(storage), id)),

  makeInvoicePdf: async ([id], _store, storage) => {
    const found = findInvoice(await invoices.load(storage), id);
    if (!found.ok) return { ok: false, error: found.error, path: '' };
    const path = await writeFile(
      storage,
      PDFS,
      pdfFileName(found.invoice),
      invoicePdf({ ...found.invoice, iban: czechIban(found.invoice.account ?? '') }),
    );
    return { ok: true, error: '', path };
  },

  eraseAll: async (_args, _store, storage) => {
    await clients.save(storage, []);
    return invoices.save(storage, []);
  },
};
export const answer: Answer = (source, args, secretStore, storage, native) =>
  sources[source](args, secretStore, storage, native);
