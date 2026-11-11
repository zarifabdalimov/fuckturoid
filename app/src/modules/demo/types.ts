export type DemoClient = {
  id: string;
  name: string;
  ico: string;
  dic: string;
  street: string;
  city: string;
  zip: string;
  email: string;
  currency: string;
};

export type DemoItem = { description: string; quantity: number; unitPrice: number };

export type MonthNames = { czech: string; english: string };

export type DemoPlan = {
  client: number;
  issuedDaysAgo: number;
  dueDays: number;
  paidDaysAgo?: number;
  items: (month: MonthNames) => DemoItem[];
};

export type DemoData = {
  supplier: DemoClient;
  clients: DemoClient[];
  bankAccounts: { id: string; account: string; currency: string }[];
  invoices: Record<string, unknown>[];
};
