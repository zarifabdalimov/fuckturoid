import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { demoData } from '../src/modules/demo/index.ts';

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
const { supplier, clients, bankAccounts, invoices } = demoData(today);

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
const preferences = join(container, 'Library', 'Preferences', bundleId);
for (const [key, value] of Object.entries(settings)) {
  simctl('spawn', device, 'defaults', 'write', preferences, `exact.state.${key}`, '-string', JSON.stringify(value));
}

simctl('launch', device, bundleId);
console.log(
  `Seeded ${bundleId} on ${device}: ${clients.length} clients, ${invoices.length} invoices, ${bankAccounts.length} bank accounts.`,
);
