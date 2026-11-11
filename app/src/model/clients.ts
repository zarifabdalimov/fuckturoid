// The rules for clients. Pure functions: a list in, a new list (or a refusal) out.

import type { Result } from '../../app.contract.d.ts';
import { nextId } from './ids.ts';

export type Client = Result<'loadClients'>[number];
export type ClientFields = Omit<Client, 'id'>;

// What a write gives back: the new list, or why it was refused.
export type Change<T> = { ok: true; next: T[] } | { ok: false; error: string };

// By name, as Czech sorts it (Č after C, Ř after R…).
export function sortClients(all: Client[]): Client[] {
  return [...all].sort((a, b) => a.name.localeCompare(b.name, 'cs'));
}

// Adds a client (id "") or updates one. Two clients can't share an IČO.
export function putClient(all: Client[], id: string, fields: ClientFields): Change<Client> {
  const twin = fields.ico === '' ? undefined : all.find((c) => c.ico === fields.ico && c.id !== id);
  if (twin) return { ok: false, error: `${twin.name} already has this IČO.` };
  if (id === '') return { ok: true, next: [...all, { id: nextId(all), ...fields }] };
  return { ok: true, next: all.map((c) => (c.id === id ? { id, ...fields } : c)) };
}

export function removeClient(all: Client[], id: string): Client[] {
  return all.filter((c) => c.id !== id);
}
