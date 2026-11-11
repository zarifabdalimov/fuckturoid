import { COUNTRY, COUNTRY_DIGITS, NUMBER_LENGTH, PREFIX_LENGTH } from './preset.ts';
import { groupByFour, mod97, parseAccount } from './utils.ts';

export type { CzechAccount } from './types.ts';
export { parseAccount } from './utils.ts';

export function czechIban(account: string): string {
  const parsed = parseAccount(account);
  if (!parsed) return '';
  const bban = `${parsed.bankCode}${parsed.prefix.padStart(PREFIX_LENGTH, '0')}${parsed.number.padStart(NUMBER_LENGTH, '0')}`;
  const check = String(98 - mod97(`${bban}${COUNTRY_DIGITS}00`)).padStart(2, '0');
  return groupByFour(`${COUNTRY}${check}${bban}`);
}
