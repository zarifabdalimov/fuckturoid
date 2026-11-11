import type { Result } from '../../../app.contract.d.ts';

export type Client = Result<'loadClients'>[number];
export type ClientFields = Omit<Client, 'id'>;

export type Change<Entry> = { ok: true; next: Entry[] } | { ok: false; error: string };
