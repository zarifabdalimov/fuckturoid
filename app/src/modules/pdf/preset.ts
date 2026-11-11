import { czDate } from '../../utils/format.ts';
import type { Labels } from './types.ts';

export const EXTRA = ['č', 'Č', 'ě', 'Ě', 'ř', 'Ř', 'ů', 'Ů', 'ď', 'Ď', 'ť', 'Ť', 'ň', 'Ň'];
// prettier-ignore
export const EXTRA_NAMES = ['ccaron', 'Ccaron', 'ecaron', 'Ecaron', 'rcaron', 'Rcaron', 'uring', 'Uring',
  'dcaron', 'Dcaron', 'tcaron', 'Tcaron', 'ncaron', 'Ncaron'];

// prettier-ignore
export const WINANSI: Record<string, number> = {
  á: 225, é: 233, í: 237, ó: 243, ú: 250, ý: 253, Á: 193, É: 201, Í: 205, Ó: 211, Ú: 218, Ý: 221,
  '€': 128, '£': 163,
  š: 154, Š: 138, ž: 158, Ž: 142, ä: 228, ö: 246, ü: 252, Ä: 196, Ö: 214, Ü: 220,
  '×': 215, '–': 150, '—': 151, '·': 183, '„': 132, '“': 147, '”': 148, '‘': 145, '’': 146, ' ': 160,
};

// prettier-ignore
export const BASE: Record<string, string> = {
  č: 'c', Č: 'C', ě: 'e', Ě: 'E', ř: 'r', Ř: 'R', ů: 'u', Ů: 'U', ď: 'd', Ď: 'D', ť: 't', Ť: 'T',
  ň: 'n', Ň: 'N', á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ý: 'y', Á: 'A', É: 'E', Í: 'I', Ó: 'O',
  Ú: 'U', Ý: 'Y', š: 's', Š: 'S', ž: 'z', Ž: 'Z', ä: 'a', ö: 'o', ü: 'u', Ä: 'A', Ö: 'O', Ü: 'U',
  ' ': ' ',
};

// prettier-ignore
export const REGULAR = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667,
  722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722,
  667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556,
  222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
  260, 334, 584];
// prettier-ignore
export const BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722,
  722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667,
  944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278,
  278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280,
  389, 584];
// prettier-ignore
export const OTHER_WIDTH: Record<string, number> = { '€': 556, '£': 556, '×': 584, '–': 556, '—': 1000, '·': 278, '„': 333, '“': 333, '”': 333, '‘': 222, '’': 222 };

export const PAGE_W = 595.28;
export const PAGE_H = 841.89;
export const MARGIN = 48;
export const RIGHT = PAGE_W - MARGIN;

export const COL_QTY = 340;
export const COL_PRICE = 440;
export const COL_AMOUNT = RIGHT;
export const DESC_W = COL_QTY - 50 - MARGIN;

const ENGLISH_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function englishDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${Number(day)} ${ENGLISH_MONTHS[Number(month) - 1]} ${year}`;
}

export const LABELS: Record<string, Labels> = {
  cs: {
    title: 'Faktura',
    supplier: 'Dodavatel',
    client: 'Odběratel',
    issued: 'Datum vystavení',
    due: 'Datum splatnosti',
    variableSymbol: 'Variabilní symbol',
    paymentMethod: 'Způsob platby',
    bankTransfer: 'Převodem',
    description: 'Popis',
    quantity: 'Množství',
    unitPrice: 'Cena za kus',
    amount: 'Celkem',
    total: 'Celkem k úhradě',
    notVatPayer: 'Dodavatel není plátcem DPH.',
    page: (current, count) => `Strana ${current} z ${count}`,
    date: czDate,
    idNumber: 'IČO',
    vatNumber: 'DIČ',
    payment: 'Platební údaje',
    account: 'Číslo účtu',
    bank: 'Banka',
    iban: 'IBAN',
    bic: 'SWIFT / BIC',
    amountDue: 'Částka',
  },
  en: {
    title: 'Invoice',
    supplier: 'Supplier',
    client: 'Bill to',
    issued: 'Issue date',
    due: 'Due date',
    variableSymbol: 'Variable symbol',
    paymentMethod: 'Payment method',
    bankTransfer: 'Bank transfer',
    description: 'Description',
    quantity: 'Qty',
    unitPrice: 'Unit price',
    amount: 'Amount',
    total: 'Total due',
    notVatPayer: 'The supplier is not registered for VAT.',
    page: (current, count) => `Page ${current} of ${count}`,
    date: englishDate,
    idNumber: 'Company ID',
    vatNumber: 'VAT ID',
    payment: 'Payment details',
    account: 'Account number',
    bank: 'Bank',
    iban: 'IBAN',
    bic: 'SWIFT / BIC',
    amountDue: 'Amount',
  },
};
