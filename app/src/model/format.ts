// How money and dates are written, for what TypeScript makes (the PDF).
// Screens write them with the same rules in model.contract (`kc`, `czDate`):
// Contract can't import TypeScript, so a change here belongs there too.

// 150050 hellers → "1 500,50 Kč" (no-break spaces, so it never wraps).
export function kc(hellers: number): string {
  const h = Math.round(hellers);
  const whole = Math.floor(h / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
  return `${whole},${String(h % 100).padStart(2, '0')}\u00a0Kč`;
}

// "2026-11-25" → "25. 11. 2026".
export function czDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
}
