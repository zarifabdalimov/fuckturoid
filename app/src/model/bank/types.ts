import type { Result } from '../../../app.contract.d.ts';

export type CzechAccount = {
  prefix: string;
  number: string;
  bankCode: string;
};

export type BankAccount = Result<'loadBankAccounts'>[number];

export type BankDetails = {
  iban: string;
  bic: string;
  bankName: string;
};
