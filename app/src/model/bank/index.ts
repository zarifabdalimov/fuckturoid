import * as R from 'remeda';

import { nextId } from '../../utils/ids.ts';
import { CURRENCY_ORDER, COUNTRY, COUNTRY_DIGITS, NUMBER_LENGTH, PREFIX_LENGTH } from './preset.ts';
import { groupByFour, mod97, parseAccount } from './utils.ts';

import type { BankAccount } from './types.ts';

export type { BankAccount, CzechAccount } from './types.ts';
export { parseAccount } from './utils.ts';

export function czechIban(account: string): string {
  const parsed = parseAccount(account);
  if (!parsed) return '';
  const bban = `${parsed.bankCode}${parsed.prefix.padStart(PREFIX_LENGTH, '0')}${parsed.number.padStart(NUMBER_LENGTH, '0')}`;
  const check = String(98 - mod97(`${bban}${COUNTRY_DIGITS}00`)).padStart(2, '0');
  return groupByFour(`${COUNTRY}${check}${bban}`);
}

export function sortBankAccounts(all: BankAccount[]): BankAccount[] {
  return R.sortBy(
    all,
    [(entry) => CURRENCY_ORDER.indexOf(entry.currency), 'asc'],
    [(entry) => Number(entry.id), 'asc'],
  );
}

export function putBankAccount(all: BankAccount[], id: string, account: string, currency: string): BankAccount[] {
  if (id === '') return R.concat(all, [{ id: nextId(all), account, currency }]);
  return R.map(all, (entry) => (entry.id === id ? { id, account, currency } : entry));
}

export function removeBankAccount(all: BankAccount[], id: string): BankAccount[] {
  return R.filter(all, (entry) => entry.id !== id);
}
