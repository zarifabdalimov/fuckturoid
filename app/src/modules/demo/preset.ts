import type { DemoClient, DemoPlan } from './types.ts';

export const SUPPLIER = {
  id: 'me',
  name: 'Jan Novák',
  ico: '12345679',
  dic: '',
  street: 'Vinohradská 1',
  city: 'Praha 2',
  zip: '120 00',
  email: '',
  currency: 'CZK',
};

export const CLIENTS: DemoClient[] = [
  {
    id: '1',
    name: 'STRV s.r.o.',
    ico: '28888286',
    dic: 'CZ28888286',
    street: 'Rohanské nábřeží 678/23',
    city: 'Praha 8',
    zip: '186 00',
    email: 'billing@strv.com',
    currency: 'CZK',
  },
  {
    id: '2',
    name: 'Seznam.cz, a.s.',
    ico: '26168685',
    dic: 'CZ26168685',
    street: 'Radlická 3294/10',
    city: 'Praha 5',
    zip: '150 00',
    email: '',
    currency: 'CZK',
  },
  {
    id: '3',
    name: 'Alza.cz a.s.',
    ico: '27082440',
    dic: 'CZ27082440',
    street: 'Jankovcova 1522/53',
    city: 'Praha 7',
    zip: '170 00',
    email: '',
    currency: 'CZK',
  },
  {
    id: '4',
    name: 'Acme GmbH',
    ico: '',
    dic: '',
    street: 'Friedrichstraße 123',
    city: 'Berlin',
    zip: '10117',
    email: 'invoices@acme.example',
    currency: 'EUR',
  },
];

export const BANK_ACCOUNTS = [
  { id: '1', account: '19-2000145399/0800', currency: 'CZK' },
  { id: '2', account: '2000145399/0800', currency: 'EUR' },
];

export const PLANS: DemoPlan[] = [
  {
    client: 0,
    issuedDaysAgo: 400,
    dueDays: 14,
    paidDaysAgo: 390,
    items: () => [{ description: 'Návrh aplikace', quantity: 1, unitPrice: 6000000 }],
  },
  {
    client: 0,
    issuedDaysAgo: 75,
    dueDays: 14,
    paidDaysAgo: 62,
    items: (month) => [{ description: `Vývoj iOS aplikace – ${month.czech}`, quantity: 40, unitPrice: 125000 }],
  },
  {
    client: 1,
    issuedDaysAgo: 50,
    dueDays: 14,
    paidDaysAgo: 40,
    items: () => [{ description: 'Konzultace', quantity: 6, unitPrice: 180000 }],
  },
  {
    client: 2,
    issuedDaysAgo: 40,
    dueDays: 14,
    items: () => [{ description: 'UX audit e-shopu', quantity: 1, unitPrice: 4500000 }],
  },
  {
    client: 3,
    issuedDaysAgo: 30,
    dueDays: 30,
    paidDaysAgo: 12,
    items: (month) => [{ description: `Mobile app maintenance – ${month.english}`, quantity: 20, unitPrice: 6000 }],
  },
  {
    client: 0,
    issuedDaysAgo: 20,
    dueDays: 14,
    items: (month) => [
      { description: `Vývoj iOS aplikace – ${month.czech}`, quantity: 32, unitPrice: 125000 },
      { description: 'App Store submission', quantity: 1, unitPrice: 500000 },
    ],
  },
  {
    client: 1,
    issuedDaysAgo: 5,
    dueDays: 14,
    items: () => [{ description: 'Workshop pro produktový tým', quantity: 1, unitPrice: 2400000 }],
  },
  {
    client: 3,
    issuedDaysAgo: 2,
    dueDays: 30,
    items: (month) => [{ description: `Mobile app maintenance – ${month.english}`, quantity: 16, unitPrice: 6000 }],
  },
];
