import * as R from 'remeda';

// The next numeric id after the largest one in use: "1", "2", …
export const nextId = (xs: { id: string }[]): string =>
  String(R.reduce(xs, (max, x) => Math.max(max, Number(x.id)), 0) + 1);
