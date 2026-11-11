import type { Result } from '../../../app.contract.d.ts';

export type Client = Result<'loadClients'>[number];
export type ClientFields = Omit<Client, 'id'>;

// What a write gives back: the new list, or why it was refused.
export type Change<Entry> = { ok: true; next: Entry[] } | { ok: false; error: string };
