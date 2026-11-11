import * as R from 'remeda';
import { addDays, invoiceTotal, nextNumber, type StoredInvoice } from '../../model/invoices/index.ts';
import { MONTH_NAMES } from '../../model/invoices/preset.ts';
import { BANK_ACCOUNTS, CLIENTS, PLANS, SUPPLIER } from './preset.ts';
import type { DemoData, MonthNames } from './types.ts';

export type { DemoData } from './types.ts';

function monthNames(iso: string): MonthNames {
  const month = Number(iso.slice(5, 7)) - 1;
  const english = MONTH_NAMES[2][month];
  return { czech: MONTH_NAMES[0][month], english: english[0].toUpperCase() + english.slice(1) };
}

export function demoData(today: string): DemoData {
  const invoices: StoredInvoice[] = [];
  R.forEach(PLANS, (plan) => {
    const issued = addDays(today, -plan.issuedDaysAgo);
    const client = CLIENTS[plan.client];
    const items = plan.items(monthNames(issued));
    const account = R.find(BANK_ACCOUNTS, (entry) => entry.currency === client.currency)?.account ?? '';
    invoices.push({
      id: String(invoices.length + 1),
      number: nextNumber(invoices, issued),
      issued,
      due: addDays(issued, plan.dueDays),
      dueDays: plan.dueDays,
      client,
      supplier: { ...SUPPLIER, currency: client.currency },
      items,
      total: invoiceTotal(items),
      paid: plan.paidDaysAgo !== undefined,
      paidOn: plan.paidDaysAgo !== undefined ? addDays(today, -plan.paidDaysAgo) : '',
      account,
      currency: client.currency,
      language: client.currency === 'CZK' ? 'cs' : 'en',
    });
  });
  return { supplier: SUPPLIER, clients: CLIENTS, bankAccounts: BANK_ACCOUNTS, invoices };
}
