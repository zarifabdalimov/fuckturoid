// Lists kept as JSON files in the app's own storage, read once and then held
// in memory; every save rewrites the file atomically. The paths are app.ts's,
// whose grants must cover them.

import type { Storage } from '../../../app.contract.d.ts';
import type { Saved } from './types.ts';
import { decodeList, encodeList } from './utils.ts';

export type { Saved } from './types.ts';

export function store<T>(file: string) {
  let items: T[] | null = null;
  return {
    async load(storage: Storage): Promise<T[]> {
      if (!items) {
        items = await storage.fs.readFile(file).then(decodeList<T>, (e) => {
          if (e.code === 'ENOENT') return []; // no file yet
          throw e;
        });
      }
      return items;
    },
    async save(storage: Storage, next: T[]): Promise<Saved> {
      items = next;
      await storage.fs.atomicWriteFile(file, encodeList(next));
      return { ok: true, error: '' };
    },
  };
}

// A file's bytes written into `dir` (made if missing); the file's path.
export async function writeFile(storage: Storage, dir: string, name: string, bytes: Uint8Array): Promise<string> {
  const path = `${dir}/${name}`;
  await storage.fs.mkdir(dir).catch(() => {}); // already there
  await storage.fs.atomicWriteFile(path, bytes);
  return path;
}
