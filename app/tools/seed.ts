import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { addDays, invoiceTotal, nextNumber } from '../src/model/invoices/index.ts';
import { MONTH_NAMES } from '../src/model/invoices/preset.ts';

const appDirectory = join(import.meta.dir, '..');
const bundleId: string = JSON.parse(readFileSync(join(appDirectory, 'app.json'), 'utf8')).app.id;

function simctl(...args: string[]): string {
  return execFileSync('xcrun', ['simctl', ...args], { encoding: 'utf8' }).trim();
}

function bootedDevice(): string {
  const requested = process.argv.indexOf('--device');
  if (requested !== -1 && process.argv[requested + 1]) return process.argv[requested + 1];
  const listing = JSON.parse(simctl('list', 'devices', 'booted', '-j')) as {
    devices: Record<string, { udid: string; name: string }[]>;
  };
  const found = Object.values(listing.devices).flat()[0];
  if (!found) throw new Error('No booted simulator. Boot one, or pass --device <udid>.');
  return found.udid;
}

const today = new Date().toISOString().slice(0, 10);
const daysAgo = (days: number): string => addDays(today, -days);
const monthName = (iso: string, form: number): string => MONTH_NAMES[form][Number(iso.slice(5, 7)) - 1];
const capitalized = (word: string): string => word[0].toUpperCase() + word.slice(1);

const supplier = {
  id: 'me',
  name: 'Jan Novák',
  ico: '12345679',
  dic: '',
  street: 'Vinohradská 1',
  city: 'Praha 2',
  zip: '120 00',
  email: '',
  currency: 'CZK',
};

const clients = [
  { id: '1', name: 'STRV s.r.o.', ico: '28888286', dic: 'CZ28888286', street: 'Rohanské nábřeží 678/23', city: 'Praha 8', zip: '186 00', email: 'billing@strv.com', currency: 'CZK' },
  { id: '2', name: 'Seznam.cz, a.s.', ico: '26168685', dic: 'CZ26168685', street: 'Radlická 3294/10', city: 'Praha 5', zip: '150 00', email: '', currency: 'CZK' },
  { id: '3', name: 'Alza.cz a.s.', ico: '27082440', dic: 'CZ27082440', street: 'Jankovcova 1522/53', city: 'Praha 7', zip: '170 00', email: '', currency: 'CZK' },
  { id: '4', name: 'Acme GmbH', ico: '', dic: '', street: 'Friedrichstraße 123', city: 'Berlin', zip: '10117', email: 'invoices@acme.example', currency: 'EUR' },
];

const bankAccounts = [
  { id: '1', account: '19-2000145399/0800', currency: 'CZK' },
  { id: '2', account: '2000145399/0800', currency: 'EUR' },
];

type Plan = {
  client: number;
  issuedDaysAgo: number;
  dueDays: number;
  paidDaysAgo?: number;
  items: (issued: string) => { description: string; quantity: number; unitPrice: number }[];
};

const plans: Plan[] = [
  { client: 0, issuedDaysAgo: 400, dueDays: 14, paidDaysAgo: 390, items: () => [{ description: 'Návrh aplikace', quantity: 1, unitPrice: 6000000 }] },
  { client: 0, issuedDaysAgo: 75, dueDays: 14, paidDaysAgo: 62, items: (issued) => [{ description: `Vývoj iOS aplikace – ${monthName(issued, 0)}`, quantity: 40, unitPrice: 125000 }] },
  { client: 1, issuedDaysAgo: 50, dueDays: 14, paidDaysAgo: 40, items: () => [{ description: 'Konzultace', quantity: 6, unitPrice: 180000 }] },
  { client: 2, issuedDaysAgo: 40, dueDays: 14, items: () => [{ description: 'UX audit e-shopu', quantity: 1, unitPrice: 4500000 }] },
  { client: 3, issuedDaysAgo: 30, dueDays: 30, paidDaysAgo: 12, items: (issued) => [{ description: `Mobile app maintenance – ${capitalized(monthName(issued, 2))}`, quantity: 20, unitPrice: 6000 }] },
  { client: 0, issuedDaysAgo: 20, dueDays: 14, items: (issued) => [{ description: `Vývoj iOS aplikace – ${monthName(issued, 0)}`, quantity: 32, unitPrice: 125000 }, { description: 'App Store submission', quantity: 1, unitPrice: 500000 }] },
  { client: 1, issuedDaysAgo: 5, dueDays: 14, items: () => [{ description: 'Workshop pro produktový tým', quantity: 1, unitPrice: 2400000 }] },
  { client: 3, issuedDaysAgo: 2, dueDays: 30, items: (issued) => [{ description: `Mobile app maintenance – ${capitalized(monthName(issued, 2))}`, quantity: 16, unitPrice: 6000 }] },
];

type Invoice = Record<string, unknown> & { number: string };
const invoices: Invoice[] = [];
for (const plan of plans) {
  const issued = daysAgo(plan.issuedDaysAgo);
  const client = clients[plan.client];
  const items = plan.items(issued);
  const account = bankAccounts.find((entry) => entry.currency === client.currency)?.account ?? '';
  invoices.push({
    id: String(invoices.length + 1),
    number: nextNumber(invoices as never, issued),
    issued,
    due: addDays(issued, plan.dueDays),
    dueDays: plan.dueDays,
    client,
    supplier: { ...supplier, currency: client.currency },
    items,
    total: invoiceTotal(items),
    paid: plan.paidDaysAgo !== undefined,
    paidOn: plan.paidDaysAgo !== undefined ? daysAgo(plan.paidDaysAgo) : '',
    account,
    currency: client.currency,
  });
}

const device = bootedDevice();
try {
  simctl('terminate', device, bundleId);
} catch {}

const container = simctl('get_app_container', device, bundleId, 'data');
const dataDirectory = join(container, 'Library', 'Application Support', 'exact', bundleId, 'data');
mkdirSync(dataDirectory, { recursive: true });
writeFileSync(join(dataDirectory, 'clients.json'), JSON.stringify(clients));
writeFileSync(join(dataDirectory, 'invoices.json'), JSON.stringify(invoices));
writeFileSync(join(dataDirectory, 'bank-accounts.json'), JSON.stringify(bankAccounts));

const settings: Record<string, unknown> = {
  onboarded: true,
  ico: supplier.ico,
  name: supplier.name,
  dic: supplier.dic,
  street: supplier.street,
  city: supplier.city,
  zip: supplier.zip,
};
for (const [key, value] of Object.entries(settings)) {
  simctl('spawn', device, 'defaults', 'write', bundleId, `exact.state.${key}`, '-string', JSON.stringify(value));
}

simctl('launch', device, bundleId);
console.log(
  `Seeded ${bundleId} on ${device}: ${clients.length} clients, ${invoices.length} invoices, ${bankAccounts.length} bank accounts.`,
);
