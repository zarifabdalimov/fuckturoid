// The rules for clients. Pure functions: a list in, a new list (or a refusal) out.

import * as R from 'remeda';
import { nextId } from '../../utils/ids.ts';
import { duplicateIco, SORT_LOCALE } from './preset.ts';
import type { Change, Client, ClientFields } from './types.ts';
import { icoHolder } from './utils.ts';

export type { Change, Client, ClientFields } from './types.ts';

export function sortClients(all: Client[]): Client[] {
  return R.sort(all, (first, second) => first.name.localeCompare(second.name, SORT_LOCALE));
}

// Adds a client (id "") or updates one. Two clients can't share an IČO.
export function putClient(all: Client[], id: string, fields: ClientFields): Change<Client> {
  const holder = icoHolder(all, fields.ico, id);
  if (holder) return { ok: false, error: duplicateIco(holder.name) };
  if (id === '') return { ok: true, next: R.concat(all, [{ id: nextId(all), ...fields }]) };
  return { ok: true, next: R.map(all, (client) => (client.id === id ? { id, ...fields } : client)) };
}

export function removeClient(all: Client[], id: string): Client[] {
  return R.filter(all, (client) => client.id !== id);
}
