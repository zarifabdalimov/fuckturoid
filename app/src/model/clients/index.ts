// The rules for clients. Pure functions: a list in, a new list (or a refusal) out.

import { nextId } from '../../utils/ids.ts';
import { duplicateIco, SORT_LOCALE } from './preset.ts';
import type { Change, Client, ClientFields } from './types.ts';
import { icoHolder } from './utils.ts';

export type { Change, Client, ClientFields } from './types.ts';

export function sortClients(all: Client[]): Client[] {
  return [...all].sort((a, b) => a.name.localeCompare(b.name, SORT_LOCALE));
}

// Adds a client (id "") or updates one. Two clients can't share an IČO.
export function putClient(all: Client[], id: string, fields: ClientFields): Change<Client> {
  const holder = icoHolder(all, fields.ico, id);
  if (holder) return { ok: false, error: duplicateIco(holder.name) };
  if (id === '') return { ok: true, next: [...all, { id: nextId(all), ...fields }] };
  return { ok: true, next: all.map((c) => (c.id === id ? { id, ...fields } : c)) };
}

export function removeClient(all: Client[], id: string): Client[] {
  return all.filter((c) => c.id !== id);
}
