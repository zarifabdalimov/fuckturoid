export type Party = {
  name: string;
  ico: string;
  dic: string;
  street: string;
  city: string;
  zip: string;
};

export type InvoiceForPdf = {
  number: string;
  issued: string;
  due: string;
  client: Party;
  supplier: Party;
  items: { description: string; quantity: number; unitPrice: number }[];
  total: number;
  account?: string;
  currency?: string;
  iban?: string;
  bic?: string;
  bankName?: string;
  language?: string;
};

export type Labels = {
  title: string;
  supplier: string;
  client: string;
  issued: string;
  due: string;
  variableSymbol: string;
  paymentMethod: string;
  bankTransfer: string;
  description: string;
  quantity: string;
  unitPrice: string;
  amount: string;
  total: string;
  notVatPayer: string;
  page: (current: number, count: number) => string;
  date: (iso: string) => string;
  idNumber: string;
  vatNumber: string;
  payment: string;
  account: string;
  bank: string;
  iban: string;
  bic: string;
  amountDue: string;
};

export type Font = 'F1' | 'F2';
