// Lists kept as JSON files in the app's own storage, read once and then held
// in memory; every save rewrites the file atomically.

import type { Storage } from '../../../app.contract.d.ts';

export type Saved = { ok: boolean; error: string };

export function store<T>(file: string) {
  let items: T[] | null = null;
  return {
    async load(storage: Storage): Promise<T[]> {
      if (!items) {
        items = await storage.fs.readFile(file).then(
          (bytes) => JSON.parse(new TextDecoder().decode(bytes)) as T[],
          (e) => {
            if (e.code === 'ENOENT') return []; // no file yet
            throw e;
          },
        );
      }
      return items;
    },
    async save(storage: Storage, next: T[]): Promise<Saved> {
      items = next;
      await storage.fs.atomicWriteFile(file, new TextEncoder().encode(JSON.stringify(next)));
      return { ok: true, error: '' };
    },
  };
}

// The next numeric id after the largest one in use.
export const nextId = (xs: { id: string }[]): string => String(Math.max(0, ...xs.map((x) => Number(x.id))) + 1);

// A file's bytes written into `dir` (made if missing); the file's path.
export async function writeFile(storage: Storage, dir: string, name: string, bytes: Uint8Array): Promise<string> {
  const path = `${dir}/${name}`;
  await storage.fs.mkdir(dir).catch(() => {}); // already there
  await storage.fs.atomicWriteFile(path, bytes);
  return path;
}
