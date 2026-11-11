import * as R from 'remeda';
import { money } from '../../utils/format.ts';
import {
  COL_AMOUNT,
  COL_PRICE,
  COL_QTY,
  DESC_W,
  EXTRA_NAMES,
  LABELS,
  MARGIN,
  PAGE_H,
  PAGE_W,
  RIGHT,
} from './preset.ts';
import type { InvoiceForPdf, Labels } from './types.ts';
import { literal, Page, party, quantity, tableHeader, wrap } from './utils.ts';

export type { InvoiceForPdf, Party } from './types.ts';

function paymentBlock(page: Page, labels: Labels, inv: InvoiceForPdf, top: number, currency: string): number {
  const candidates: [string, string][] = [
    [labels.account, inv.account ?? ''],
    [labels.bank, inv.bankName ?? ''],
    [labels.iban, inv.iban ?? ''],
    [labels.bic, inv.bic ?? ''],
    [labels.variableSymbol, inv.number.replace(/\D/g, '')],
    [labels.amountDue, money(inv.total, currency)],
  ];
  const rows = R.filter(candidates, ([, value]) => value !== '');
  const blockHeight = 30 + rows.length * 16;
  const blockWidth = (RIGHT - MARGIN) / 2 + 40;
  page.box(MARGIN, top - blockHeight + 12, blockWidth, blockHeight, 0.96);
  page.text(labels.payment.toUpperCase(), MARGIN + 10, top - 4, 'F2', 8, 0.45);
  R.forEach(rows, ([label, value], index) => {
    const baseline = top - 24 - index * 16;
    page.text(label, MARGIN + 10, baseline, 'F1', 9, 0.45);
    page.text(value, MARGIN + 110, baseline, 'F2', 10);
  });
  return top - blockHeight - 8;
}

function pages(inv: InvoiceForPdf): Page[] {
  const labels = LABELS[inv.language ?? 'cs'] ?? LABELS.cs;
  const all: Page[] = [];
  let page = new Page();
  all.push(page);

  let baseline = PAGE_H - MARGIN - 14;
  page.text(labels.title, MARGIN, baseline, 'F2', 24);
  page.textRight(inv.number, RIGHT, baseline, 'F2', 16, 0.35);
  baseline -= 44;

  const half = (RIGHT - MARGIN) / 2;
  const left = party(page, labels, labels.supplier, inv.supplier, MARGIN, baseline, half - 20);
  const right = party(page, labels, labels.client, inv.client, MARGIN + half + 10, baseline, half - 20);
  baseline = Math.min(left, right) - 14;

  const account = inv.account ?? '';
  const currency = inv.currency ?? 'CZK';
  const bandHeight = 50;
  page.box(MARGIN, baseline - bandHeight + 12, RIGHT - MARGIN, bandHeight, 0.96);
  const facts: [string, string][] = [
    [labels.issued, labels.date(inv.issued)],
    [labels.due, labels.date(inv.due)],
    [labels.variableSymbol, inv.number.replace(/\D/g, '')],
    [labels.paymentMethod, labels.bankTransfer],
  ];
  const step = (RIGHT - MARGIN) / facts.length;
  R.forEach(facts, ([label, value], index) => {
    page.text(label, MARGIN + 10 + index * step, baseline - 4, 'F1', 8, 0.45);
    page.text(value, MARGIN + 10 + index * step, baseline - 22, 'F2', 11);
  });
  baseline -= bandHeight + 20;

  baseline = tableHeader(page, labels, baseline);
  for (const item of inv.items) {
    const lines = wrap(item.description, 'F1', 10, DESC_W);
    const height = (lines.length - 1) * 13 + 23;
    if (baseline - height < MARGIN + 90) {
      page = new Page();
      all.push(page);
      baseline = tableHeader(page, labels, PAGE_H - MARGIN - 14);
    }
    R.forEach(lines, (line, index) => page.text(line, MARGIN + 8, baseline - index * 13, 'F1', 10));
    page.textRight(quantity(item.quantity), COL_QTY, baseline, 'F1', 10);
    page.textRight(money(item.unitPrice, currency), COL_PRICE, baseline, 'F1', 10);
    page.textRight(money(Math.round(item.quantity * item.unitPrice), currency), COL_AMOUNT - 8, baseline, 'F1', 10);
    page.rule(MARGIN, baseline - (lines.length - 1) * 13 - 7, RIGHT, 0.88);
    baseline -= height;
  }

  baseline -= 18;
  page.text(labels.total, COL_PRICE - 120, baseline, 'F2', 12);
  page.textRight(money(inv.total, currency), COL_AMOUNT - 8, baseline, 'F2', 16);
  baseline -= 36;

  if (account) {
    if (baseline - 140 < MARGIN) {
      page = new Page();
      all.push(page);
      baseline = PAGE_H - MARGIN - 14;
    }
    baseline = paymentBlock(page, labels, inv, baseline, currency);
  }
  if (!inv.supplier.dic) page.text(labels.notVatPayer, MARGIN, baseline - 6, 'F1', 9, 0.45);

  if (all.length > 1) {
    R.forEach(all, (each, index) =>
      each.textRight(labels.page(index + 1, all.length), RIGHT, MARGIN - 20, 'F1', 8, 0.5),
    );
  }
  return all;
}

export function invoicePdf(inv: InvoiceForPdf): Uint8Array {
  const drawn = pages(inv);
  const objects: string[] = [];
  const add = (body: string): number => objects.push(body);

  const catalog = add('');
  const pagesId = add('');
  const encoding = add(
    `<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [1 ${R.join(
      R.map(EXTRA_NAMES, (name) => `/${name}`),
      ' ',
    )}] >>`,
  );
  const f1 = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding ${encoding} 0 R >>`);
  const f2 = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding ${encoding} 0 R >>`);
  const kids: number[] = [];
  for (const page of drawn) {
    const content = R.join(page.ops, '\n');
    const stream = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
          `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${stream} 0 R >>`,
      ),
    );
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${R.join(
    R.map(kids, (kid) => `${kid} 0 R`),
    ' ',
  )}] /Count ${kids.length} >>`;
  const info = add(
    `<< /Title ${literal(`${(LABELS[inv.language ?? 'cs'] ?? LABELS.cs).title} ${inv.number}`)} /Producer (F*ckturoid) >>`,
  );

  let file = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets: number[] = [];
  R.forEach(objects, (body, index) => {
    offsets.push(file.length);
    file += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const offset of offsets) file += `${String(offset).padStart(10, '0')} 00000 n \n`;
  file += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(file.length);
  for (let index = 0; index < file.length; index++) bytes[index] = file.charCodeAt(index) & 0xff;
  return bytes;
}
