import type { Answer, Result, Sources, Storage } from './app.contract.d.ts';

// ARES, the Czech register of economic subjects (https://ares.gov.cz).
const ARES = 'https://ares.gov.cz';
export const grants = [`net.fetch ${ARES}`, 'fs.read app:/data/clients.json', 'fs.write app:/data/clients.json'].join('\n');

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

// Clients live in a file of the app's own; memory holds them between requests.
const CLIENTS = 'app:/data/clients.json';
type Client = Result<'loadClients'>[number];
let clients: Client[] | null = null;

async function loadClients(storage: Storage): Promise<Client[]> {
  if (!clients) {
    clients = await storage.fs.readFile(CLIENTS).then(
      (bytes) => JSON.parse(new TextDecoder().decode(bytes)) as Client[],
      (e) => {
        if (e.code === 'ENOENT') return []; // no file yet
        throw e;
      },
    );
  }
  return clients;
}

async function saveClients(storage: Storage, next: Client[]): Promise<Result<'saveClient'>> {
  clients = next;
  await storage.fs.atomicWriteFile(CLIENTS, new TextEncoder().encode(JSON.stringify(next)));
  return { ok: true, error: '' };
}

const byName = (a: Client, b: Client): number => a.name.localeCompare(b.name, 'cs');

const sources: Sources = {
  lookupIco: ([ico]) => lookupIco(ico),
  loadClients: async (_args, _store, storage) => [...(await loadClients(storage))].sort(byName),
  saveClient: async ([id, name, ico, dic, street, city, zip, email], _store, storage) => {
    const all = await loadClients(storage);
    const twin = ico === '' ? undefined : all.find((c) => c.ico === ico && c.id !== id);
    if (twin) return { ok: false, error: `${twin.name} already has this IČO.` };
    const fields = { name, ico, dic, street, city, zip, email };
    if (id === '') {
      const next = String(Math.max(0, ...all.map((c) => Number(c.id))) + 1);
      return saveClients(storage, [...all, { id: next, ...fields }]);
    }
    return saveClients(storage, all.map((c) => (c.id === id ? { id, ...fields } : c)));
  },
  removeClient: async ([id], _store, storage) =>
    saveClients(storage, (await loadClients(storage)).filter((c) => c.id !== id)),
};
export const answer: Answer = (source, args, store, storage, native) =>
  sources[source](args, store, storage, native);
