import * as R from 'remeda';

import type { CzechAccount } from './types.ts';

export function parseAccount(account: string): CzechAccount | undefined {
  const match = /^(?:(\d{1,6})-)?(\d{2,10})\/(\d{4})$/.exec(account.trim());
  if (!match) return undefined;
  return { prefix: match[1] ?? '', number: match[2], bankCode: match[3] };
}

export function mod97(digits: string): number {
  return R.reduce(digits.split(''), (rest, digit) => (rest * 10 + Number(digit)) % 97, 0);
}

export function groupByFour(text: string): string {
  return R.join(text.match(/.{1,4}/g) ?? [], ' ');
}
