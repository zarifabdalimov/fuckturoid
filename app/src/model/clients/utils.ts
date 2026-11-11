import * as R from 'remeda';
import type { Client } from './types.ts';

export function icoHolder(all: Client[], ico: string, id: string): Client | undefined {
  return ico === '' ? undefined : R.find(all, (client) => client.ico === ico && client.id !== id);
}
