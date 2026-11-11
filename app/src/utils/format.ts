// How money and dates are written, for what TypeScript makes (the PDF).
// Screens write them with the same rules in src/model/model.contract (`kc`,
// `czDate`): Contract can't import TypeScript, so a change here belongs there too.

import * as R from 'remeda';

// A no-break space: amounts and their currency never wrap apart.
export const NBSP = ' ';
export const CURRENCY = 'Kč';

// 1500000 → "1 500 000", thousands set apart by no-break spaces.
export function groupThousands(n: number): string {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

// 150050 hellers → "1 500,50 Kč".
export function kc(hellers: number): string {
  const h = Math.round(hellers);
  return `${groupThousands(Math.floor(h / 100))},${String(h % 100).padStart(2, '0')}${NBSP}${CURRENCY}`;
}

// "2026-11-25" → "25. 11. 2026".
export function czDate(iso: string): string {
  const [y, m, d] = R.map(iso.split('-'), Number);
  return `${d}. ${m}. ${y}`;
}
