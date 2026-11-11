import * as R from 'remeda';

export const NBSP = ' ';
export const CURRENCY = 'Kč';

export function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function kc(hellers: number): string {
  const whole = Math.round(hellers);
  return `${groupThousands(Math.floor(whole / 100))},${String(whole % 100).padStart(2, '0')}${NBSP}${CURRENCY}`;
}

export function czDate(iso: string): string {
  const [year, month, day] = R.map(iso.split('-'), Number);
  return `${day}. ${month}. ${year}`;
}
