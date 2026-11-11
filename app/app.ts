// The data module: every source app.contract asks for, wired to src/modules.
// It holds the app's grants (what it may reach) and the rules that tie the
// modules together: invoice numbering and due dates, a client's unique IČO.

import type { Answer, Result, Sources } from './app.contract.d.ts';
import { lookupIco } from './src/modules/ares/ares.ts';
import { invoicePdf } from './src/modules/pdf/invoice-pdf.ts';
import { nextId, store, writeFile } from './src/modules/storage/store.ts';

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

type Client = Result<'loadClients'>[number];
type Invoice = Result<'loadInvoices'>[number];
const clients = store<Client>(CLIENTS);
const invoices = store<Invoice>(INVOICES);

const byName = (a: Client, b: Client): number => a.name.localeCompare(b.name, 'cs');

// "2026-11-11" plus 14 days → "2026-11-25", by the calendar (UTC, so no DST shift).
function addDays(iso: string, days: number): string {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// Fakturoid's numbering: the issue year and a sequence per year, "2026-0001".
function nextNumber(all: Invoice[], issued: string): string {
  const year = issued.slice(0, 4);
  const used = all.filter((i) => i.number.startsWith(`${year}-`)).map((i) => Number(i.number.slice(5)));
  return `${year}-${String(Math.max(0, ...used) + 1).padStart(4, '0')}`;
}

const sources: Sources = {
  lookupIco: ([ico]) => lookupIco(ico),

  loadClients: async (_args, _store, storage) => [...(await clients.load(storage))].sort(byName),
  saveClient: async ([id, name, ico, dic, street, city, zip, email], _store, storage) => {
    const all = await clients.load(storage);
    const twin = ico === '' ? undefined : all.find((c) => c.ico === ico && c.id !== id);
    if (twin) return { ok: false, error: `${twin.name} already has this IČO.` };
    const fields = { name, ico, dic, street, city, zip, email };
    if (id === '') return clients.save(storage, [...all, { id: nextId(all), ...fields }]);
    return clients.save(storage, all.map((c) => (c.id === id ? { id, ...fields } : c)));
  },
  removeClient: async ([id], _store, storage) =>
    clients.save(storage, (await clients.load(storage)).filter((c) => c.id !== id)),

  // Newest first: by issue date, then by number.
  loadInvoices: async (_args, _store, storage) =>
    [...(await invoices.load(storage))].sort(
      (a, b) => b.issued.localeCompare(a.issued) || b.number.localeCompare(a.number),
    ),
  saveInvoice: async ([id, client, supplier, issued, dueDays, items], _store, storage) => {
    const all = await invoices.load(storage);
    const total = items.reduce((sum, i) => sum + Math.round(i.quantity * i.unitPrice), 0);
    const fields = { client, supplier, issued, dueDays, due: addDays(issued, dueDays), items, total };
    if (id === '') {
      const fresh: Invoice = { id: nextId(all), number: nextNumber(all, issued), paid: false, paidOn: '', ...fields };
      return invoices.save(storage, [...all, fresh]);
    }
    return invoices.save(storage, all.map((i) => (i.id === id ? { ...i, ...fields } : i)));
  },
  setInvoicePaid: async ([id, paid, day], _store, storage) =>
    invoices.save(
      storage,
      (await invoices.load(storage)).map((i) => (i.id === id ? { ...i, paid, paidOn: paid ? day : '' } : i)),
    ),
  removeInvoice: async ([id], _store, storage) =>
    invoices.save(storage, (await invoices.load(storage)).filter((i) => i.id !== id)),

  // An invoice's PDF, written where the share sheet can read it.
  makeInvoicePdf: async ([id], _store, storage) => {
    const inv = (await invoices.load(storage)).find((i) => i.id === id);
    if (!inv) return { ok: false, error: 'This invoice no longer exists.', path: '' };
    const path = await writeFile(storage, PDFS, `Faktura-${inv.number}.pdf`, invoicePdf(inv));
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
