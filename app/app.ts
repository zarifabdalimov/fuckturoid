import type { Answer, Sources } from './app.contract.d.ts';
import {
  type Client,
  putClient,
  removeClient,
  sortClients,
  withDefaults as clientDefaults,
} from './src/model/clients/index.ts';
import {
  type BankAccount,
  bankDetails,
  putBankAccount,
  removeBankAccount,
  sortBankAccounts,
} from './src/model/bank/index.ts';
import {
  duplicateInvoice,
  findInvoice,
  type StoredInvoice,
  pdfFileName,
  putInvoice,
  removeInvoice,
  setPaid,
  sortInvoices,
  withDefaults,
} from './src/model/invoices/index.ts';
import { lookupIco } from './src/modules/ares/index.ts';
import { demoData } from './src/modules/demo/index.ts';
import { invoicePdf } from './src/modules/pdf/index.ts';
import { store, writeFile } from './src/modules/storage/index.ts';

const CLIENTS = 'app:/data/clients.json';
const INVOICES = 'app:/data/invoices.json';
const BANK_ACCOUNTS = 'app:/data/bank-accounts.json';
const PDFS = 'app:/cache/invoices';

export const grants = [
  'net.fetch https://ares.gov.cz',
  `fs.read ${CLIENTS}`,
  `fs.write ${CLIENTS}`,
  `fs.read ${INVOICES}`,
  `fs.write ${INVOICES}`,
  `fs.read ${BANK_ACCOUNTS}`,
  `fs.write ${BANK_ACCOUNTS}`,
  `fs.read ${PDFS}`,
  `fs.write ${PDFS}`,
].join('\n');

const clients = store<Client>(CLIENTS);
const invoices = store<StoredInvoice>(INVOICES);
const bankAccounts = store<BankAccount>(BANK_ACCOUNTS);

const sources: Sources = {
  lookupIco: ([ico]) => lookupIco(ico),

  loadClients: async (_args, _store, storage) => sortClients(clientDefaults(await clients.load(storage))),
  saveClient: async ([id, name, ico, dic, street, city, zip, email, currency], _store, storage) => {
    const change = putClient(await clients.load(storage), id, { name, ico, dic, street, city, zip, email, currency });
    return change.ok ? clients.save(storage, change.next) : { ok: false, error: change.error };
  },
  removeClient: async ([id], _store, storage) => clients.save(storage, removeClient(await clients.load(storage), id)),

  loadInvoices: async (_args, _store, storage) => sortInvoices(withDefaults(await invoices.load(storage))),
  saveInvoice: async ([id, client, supplier, issued, dueDays, items, account, currency, language], _store, storage) =>
    invoices.save(
      storage,
      putInvoice(await invoices.load(storage), id, {
        client,
        supplier,
        issued,
        dueDays,
        items,
        account,
        currency,
        language,
      }),
    ),
  duplicateInvoice: async ([id, today, supplier, account], _store, storage) => {
    const duplicated = duplicateInvoice(await invoices.load(storage), id, today, supplier, account);
    if (!duplicated) return { ok: false, error: 'This invoice no longer exists.', id: '' };
    await invoices.save(storage, duplicated.next);
    return { ok: true, error: '', id: duplicated.id };
  },
  setInvoicePaid: async ([id, paid, day], _store, storage) =>
    invoices.save(storage, setPaid(await invoices.load(storage), id, paid, day)),
  removeInvoice: async ([id], _store, storage) =>
    invoices.save(storage, removeInvoice(await invoices.load(storage), id)),

  makeInvoicePdf: async ([id], _store, storage) => {
    const found = findInvoice(await invoices.load(storage), id);
    if (!found.ok) return { ok: false, error: found.error, path: '' };
    const path = await writeFile(
      storage,
      PDFS,
      pdfFileName(found.invoice),
      invoicePdf({ ...found.invoice, ...bankDetails(found.invoice.account ?? '') }),
    );
    return { ok: true, error: '', path };
  },

  loadBankAccounts: async (_args, _store, storage) => sortBankAccounts(await bankAccounts.load(storage)),
  saveBankAccount: async ([id, account, currency], _store, storage) =>
    bankAccounts.save(storage, putBankAccount(await bankAccounts.load(storage), id, account, currency)),
  removeBankAccount: async ([id], _store, storage) =>
    bankAccounts.save(storage, removeBankAccount(await bankAccounts.load(storage), id)),

  loadDemo: async ([today], _store, storage) => {
    const demo = demoData(today);
    await clients.save(storage, demo.clients);
    await bankAccounts.save(storage, demo.bankAccounts);
    await invoices.save(storage, demo.invoices as StoredInvoice[]);
    const { supplier } = demo;
    return {
      ok: true,
      error: '',
      ico: supplier.ico,
      name: supplier.name,
      dic: supplier.dic,
      street: supplier.street,
      city: supplier.city,
      zip: supplier.zip,
    };
  },

  eraseAll: async (_args, _store, storage) => {
    await clients.save(storage, []);
    await bankAccounts.save(storage, []);
    return invoices.save(storage, []);
  },
};
export const answer: Answer = (source, args, secretStore, storage, native) =>
  sources[source](args, secretStore, storage, native);
