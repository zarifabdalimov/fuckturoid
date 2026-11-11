import type { Client } from './types.ts';

// Another client (not `id`) already holding this IČO; none when the IČO is empty.
export function icoHolder(all: Client[], ico: string, id: string): Client | undefined {
  return ico === '' ? undefined : all.find((c) => c.ico === ico && c.id !== id);
}
