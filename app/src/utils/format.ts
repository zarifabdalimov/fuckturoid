import * as R from 'remeda';

export const NBSP = ' ';
export const CURRENCY_SYMBOLS: Record<string, string> = { CZK: 'Kč', EUR: '€', USD: '$', GBP: '£' };

export function groupThousands(value: number): string {
  return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, NBSP);
}

export function money(cents: number, currency: string): string {
  const whole = Math.round(cents);
  const symbol = CURRENCY_SYMBOLS[currency] ?? currency;
  return `${groupThousands(Math.floor(whole / 100))},${String(whole % 100).padStart(2, '0')}${NBSP}${symbol}`;
}

export function czDate(iso: string): string {
  const [year, month, day] = R.map(iso.split('-'), Number);
  return `${day}. ${month}. ${year}`;
}
