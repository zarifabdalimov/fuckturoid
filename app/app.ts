import type { Answer, Result, Sources, Storage } from './app.contract.d.ts';

// ARES, the Czech register of economic subjects (https://ares.gov.cz).
const ARES = 'https://ares.gov.cz';
const CLIENTS = 'app:/data/clients.json';
const INVOICES = 'app:/data/invoices.json';
export const grants = [
  `net.fetch ${ARES}`,
  `fs.read ${CLIENTS}`,
  `fs.write ${CLIENTS}`,
  `fs.read ${INVOICES}`,
  `fs.write ${INVOICES}`,
].join('\n');

type Company = Result<'lookupIco'>;

type Sidlo = {
  nazevObce?: string;
  nazevMestskehoObvodu?: string;
  nazevCastiObce?: string;
  nazevUlice?: string;
  cisloDomovni?: number;
  cisloOrientacni?: number;
  cisloOrientacniPismeno?: string;
  psc?: number;
  textovaAdresa?: string;
};

function refused(ico: string, error: string): Company {
  return { ok: false, error, ico, name: '', dic: '', street: '', city: '', zip: '' };
}

function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

// "Rohanské nábřeží 678/23": the street (or the village part when there is no
// street), the house number, then the orientation number with its letter.
function streetLine(s: Sidlo): string {
  const place = s.nazevUlice ?? s.nazevCastiObce ?? s.nazevObce ?? '';
  const orientation =
    s.cisloOrientacni !== undefined ? `/${s.cisloOrientacni}${s.cisloOrientacniPismeno ?? ''}` : '';
  const number = s.cisloDomovni !== undefined ? `${s.cisloDomovni}${orientation}` : '';
  return [place, number].filter((p) => p !== '').join(' ');
}

// Prague is written with its district ("Praha 8"), as on an envelope.
function cityLine(s: Sidlo): string {
  if (s.nazevObce === 'Praha' && s.nazevMestskehoObvodu) return s.nazevMestskehoObvodu;
  return s.nazevObce ?? '';
}

function zipLine(psc: number | undefined): string {
  if (psc === undefined) return '';
  const digits = String(psc).padStart(5, '0');
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}

async function lookupIco(ico: string): Promise<Company> {
  const response = await fetch(`${ARES}/ekonomicke-subjekty-v-be/rest/ekonomicke-subjekty/${ico}`, {
    headers: { Accept: 'application/json' },
    exactTimeout: 10000,
  });
  if (response.status === 404 || response.status === 400) {
    return refused(ico, `ARES has no company with IČO ${ico}.`);
  }
  if (!response.ok) {
    throw new Error(`ARES answered ${response.status}.`);
  }
  const body: unknown = await response.json();
  if (!isObject(body) || typeof body.obchodniJmeno !== 'string') {
    throw new Error('ARES sent an answer this app does not understand.');
  }
  const sidlo: Sidlo = isObject(body.sidlo) ? (body.sidlo as Sidlo) : {};
  const structured = sidlo.nazevObce !== undefined;
  return {
    ok: true,
    error: '',
    ico,
    name: body.obchodniJmeno,
    dic: typeof body.dic === 'string' ? body.dic : '',
    street: structured ? streetLine(sidlo) : (sidlo.textovaAdresa ?? ''),
    city: structured ? cityLine(sidlo) : '',
    zip: zipLine(sidlo.psc),
  };
}

// A list kept in a file of the app's own; memory holds it between requests.
function store<T>(file: string) {
  let items: T[] | null = null;
  return {
    async load(storage: Storage): Promise<T[]> {
      if (!items) {
        items = await storage.fs.readFile(file).then(
          (bytes) => JSON.parse(new TextDecoder().decode(bytes)) as T[],
          (e) => {
            if (e.code === 'ENOENT') return []; // no file yet
            throw e;
          },
        );
      }
      return items;
    },
    async save(storage: Storage, next: T[]): Promise<{ ok: boolean; error: string }> {
      items = next;
      await storage.fs.atomicWriteFile(file, new TextEncoder().encode(JSON.stringify(next)));
      return { ok: true, error: '' };
    },
  };
}

const nextId = (xs: { id: string }[]): string => String(Math.max(0, ...xs.map((x) => Number(x.id))) + 1);

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

  // Log out: every client and invoice on this phone is gone.
  eraseAll: async (_args, _store, storage) => {
    await clients.save(storage, []);
    return invoices.save(storage, []);
  },
};
export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
