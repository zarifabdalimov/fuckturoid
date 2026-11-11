// An invoice as a PDF, written by hand: no library, no embedded font.
//
// It uses the PDF's standard Helvetica (ISO 32000-1 §9.6.2.2), which every
// viewer supplies, with WinAnsiEncoding (Annex D) for the Latin-1 letters and a
// /Differences array for the Czech ones WinAnsi lacks (č ř ě ů ď ť ň), named
// by their Adobe glyph names. Text is measured with Helvetica's AFM widths so
// amounts can be right-aligned and descriptions wrapped.

import * as R from 'remeda';
import { czDate, kc } from '../../utils/format.ts';
import { COL_AMOUNT, COL_PRICE, COL_QTY, DESC_W, EXTRA_NAMES, MARGIN, PAGE_H, PAGE_W, RIGHT } from './preset.ts';
import type { InvoiceForPdf } from './types.ts';
import { literal, Page, party, quantity, tableHeader, wrap } from './utils.ts';

export type { InvoiceForPdf, Party } from './types.ts';

function pages(inv: InvoiceForPdf): Page[] {
  const all: Page[] = [];
  let page = new Page();
  all.push(page);

  // Title and number.
  let y = PAGE_H - MARGIN - 14;
  page.text('Faktura', MARGIN, y, 'F2', 24);
  page.textRight(inv.number, RIGHT, y, 'F2', 16, 0.35);
  y -= 44;

  // Supplier and client, side by side.
  const half = (RIGHT - MARGIN) / 2;
  const left = party(page, 'Dodavatel', inv.supplier, MARGIN, y, half - 20);
  const right = party(page, 'Odběratel', inv.client, MARGIN + half + 10, y, half - 20);
  y = Math.min(left, right) - 14;

  // Dates and payment, in a shaded band.
  page.box(MARGIN, y - 38, RIGHT - MARGIN, 50, 0.96);
  const facts: [string, string][] = [
    ['Datum vystavení', czDate(inv.issued)],
    ['Datum splatnosti', czDate(inv.due)],
    ['Variabilní symbol', inv.number.replace(/\D/g, '')],
    ['Způsob platby', 'Převodem'],
  ];
  const step = (RIGHT - MARGIN) / facts.length;
  R.forEach(facts, ([label, value], i) => {
    page.text(label, MARGIN + 10 + i * step, y - 4, 'F1', 8, 0.45);
    page.text(value, MARGIN + 10 + i * step, y - 22, 'F2', 11);
  });
  y -= 70;

  // Items, onto further pages as they need.
  y = tableHeader(page, y);
  for (const it of inv.items) {
    const lines = wrap(it.description, 'F1', 10, DESC_W);
    // A row: its lines from baseline y down, a rule 7 pt under the last, the next row 16 pt under that.
    const height = (lines.length - 1) * 13 + 23;
    if (y - height < MARGIN + 90) {
      page = new Page();
      all.push(page);
      y = tableHeader(page, PAGE_H - MARGIN - 14);
    }
    R.forEach(lines, (line, i) => page.text(line, MARGIN + 8, y - i * 13, 'F1', 10));
    page.textRight(quantity(it.quantity), COL_QTY, y, 'F1', 10);
    page.textRight(kc(it.unitPrice), COL_PRICE, y, 'F1', 10);
    page.textRight(kc(Math.round(it.quantity * it.unitPrice)), COL_AMOUNT - 8, y, 'F1', 10);
    page.rule(MARGIN, y - (lines.length - 1) * 13 - 7, RIGHT, 0.88);
    y -= height;
  }

  // The total.
  y -= 18;
  page.text('Celkem k úhradě', COL_PRICE - 120, y, 'F2', 12);
  page.textRight(kc(inv.total), COL_AMOUNT - 8, y, 'F2', 16);
  y -= 30;
  if (!inv.supplier.dic) page.text('Dodavatel není plátcem DPH.', MARGIN, y, 'F1', 9, 0.45);

  // Page numbers when there is more than one.
  if (all.length > 1) {
    R.forEach(all, (p, i) => p.textRight(`Strana ${i + 1} z ${all.length}`, RIGHT, MARGIN - 20, 'F1', 8, 0.5));
  }
  return all;
}

// The PDF file's bytes. Every byte of the file is below 256, so a string's
// length is its byte length and the xref offsets are string offsets.
export function invoicePdf(inv: InvoiceForPdf): Uint8Array {
  const ps = pages(inv);
  const objects: string[] = [];
  const add = (body: string): number => objects.push(body); // its object number

  const catalog = add(''); // filled once the pages' number is known
  const pagesId = add('');
  const encoding = add(
    `<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [1 ${R.join(R.map(EXTRA_NAMES, (n) => `/${n}`), ' ')}] >>`,
  );
  const f1 = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding ${encoding} 0 R >>`);
  const f2 = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding ${encoding} 0 R >>`);
  const kids: number[] = [];
  for (const p of ps) {
    const content = R.join(p.ops, '\n');
    const stream = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
          `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${stream} 0 R >>`,
      ),
    );
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${R.join(R.map(kids, (k) => `${k} 0 R`), ' ')}] /Count ${kids.length} >>`;
  const info = add(`<< /Title ${literal(`Faktura ${inv.number}`)} /Producer (F*ckturoid) >>`);

  let file = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets: number[] = [];
  R.forEach(objects, (body, i) => {
    offsets.push(file.length);
    file += `${i + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = file.length;
  file += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (const o of offsets) file += `${String(o).padStart(10, '0')} 00000 n \n`;
  file += `trailer\n<< /Size ${objects.length + 1} /Root ${catalog} 0 R /Info ${info} 0 R >>\nstartxref\n${xref}\n%%EOF\n`;

  const bytes = new Uint8Array(file.length);
  for (let i = 0; i < file.length; i++) bytes[i] = file.charCodeAt(i) & 0xff;
  return bytes;
}
