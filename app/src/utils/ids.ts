import * as R from 'remeda';

export const nextId = (entries: { id: string }[]): string =>
  String(R.reduce(entries, (max, entry) => Math.max(max, Number(entry.id)), 0) + 1);
