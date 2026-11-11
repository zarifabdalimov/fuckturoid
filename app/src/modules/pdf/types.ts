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
  iban?: string;
};

export type Font = 'F1' | 'F2';
