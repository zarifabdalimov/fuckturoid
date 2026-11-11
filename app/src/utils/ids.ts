import * as R from 'remeda';

// The next numeric id after the largest one in use: "1", "2", …
export const nextId = (entries: { id: string }[]): string =>
  String(R.reduce(entries, (max, entry) => Math.max(max, Number(entry.id)), 0) + 1);
