import * as R from 'remeda';
import type { Client } from './types.ts';

// Another client (not `id`) already holding this IČO; none when the IČO is empty.
export function icoHolder(all: Client[], ico: string, id: string): Client | undefined {
  return ico === '' ? undefined : R.find(all, (c) => c.ico === ico && c.id !== id);
}
