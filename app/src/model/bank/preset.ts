export const COUNTRY = 'CZ';
export const COUNTRY_DIGITS = '1235';
export const PREFIX_LENGTH = 6;
export const NUMBER_LENGTH = 10;
export const CURRENCY_ORDER = ['CZK', 'EUR', 'USD', 'GBP'];

export const BANKS: Record<string, { name: string; bic: string }> = {
  '0100': { name: 'Komerční banka', bic: 'KOMBCZPP' },
  '0300': { name: 'ČSOB', bic: 'CEKOCZPP' },
  '0600': { name: 'MONETA Money Bank', bic: 'AGBACZPP' },
  '0710': { name: 'Česká národní banka', bic: 'CNBACZPP' },
  '0800': { name: 'Česká spořitelna', bic: 'GIBACZPX' },
  '2010': { name: 'Fio banka', bic: 'FIOBCZPP' },
  '2250': { name: 'Banka CREDITAS', bic: 'CTASCZ22' },
  '2700': { name: 'UniCredit Bank', bic: 'BACXCZPP' },
  '3030': { name: 'Air Bank', bic: 'AIRACZPP' },
  '3500': { name: 'ING Bank', bic: 'INGBCZPP' },
  '5500': { name: 'Raiffeisenbank', bic: 'RZBCCZPP' },
  '6210': { name: 'mBank', bic: 'BREXCZPP' },
};
