// An invoice as a PDF, written by hand: no library, no embedded font.
//
// It uses the PDF's standard Helvetica (ISO 32000-1 §9.6.2.2), which every
// viewer supplies, with WinAnsiEncoding (Annex D) for the Latin-1 letters and a
// /Differences array for the Czech ones WinAnsi lacks (č ř ě ů ď ť ň), named
// by their Adobe glyph names. Text is measured with Helvetica's AFM widths so
// amounts can be right-aligned and descriptions wrapped.

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
};

// Characters WinAnsi lacks, at codes 1–14, which WinAnsi leaves undefined.
const EXTRA = ['č', 'Č', 'ě', 'Ě', 'ř', 'Ř', 'ů', 'Ů', 'ď', 'Ď', 'ť', 'Ť', 'ň', 'Ň'];
const EXTRA_NAMES = ['ccaron', 'Ccaron', 'ecaron', 'Ecaron', 'rcaron', 'Rcaron', 'uring', 'Uring',
  'dcaron', 'Dcaron', 'tcaron', 'Tcaron', 'ncaron', 'Ncaron'];

// The WinAnsi codes of the other non-ASCII characters an invoice uses.
const WINANSI: Record<string, number> = {
  á: 225, é: 233, í: 237, ó: 243, ú: 250, ý: 253, Á: 193, É: 201, Í: 205, Ó: 211, Ú: 218, Ý: 221,
  š: 154, Š: 138, ž: 158, Ž: 142, ä: 228, ö: 246, ü: 252, Ä: 196, Ö: 214, Ü: 220,
  '×': 215, '–': 150, '—': 151, '·': 183, '„': 132, '“': 147, '”': 148, '‘': 145, '’': 146, ' ': 160,
};

// The letter each accented one is measured as (an accent doesn't change Helvetica's width).
const BASE: Record<string, string> = {
  č: 'c', Č: 'C', ě: 'e', Ě: 'E', ř: 'r', Ř: 'R', ů: 'u', Ů: 'U', ď: 'd', Ď: 'D', ť: 't', Ť: 'T',
  ň: 'n', Ň: 'N', á: 'a', é: 'e', í: 'i', ó: 'o', ú: 'u', ý: 'y', Á: 'A', É: 'E', Í: 'I', Ó: 'O',
  Ú: 'U', Ý: 'Y', š: 's', Š: 'S', ž: 'z', Ž: 'Z', ä: 'a', ö: 'o', ü: 'u', Ä: 'A', Ö: 'O', Ü: 'U',
  ' ': ' ',
};

// Helvetica and Helvetica-Bold advance widths for ASCII 32–126, in 1/1000 em (Adobe's AFMs).
const REGULAR = [278, 278, 355, 556, 556, 889, 667, 191, 333, 333, 389, 584, 278, 333, 278, 278,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 556, 278, 278, 584, 584, 584, 556, 1015, 667, 667,
  722, 722, 667, 611, 778, 722, 278, 500, 667, 556, 833, 722, 778, 667, 778, 722, 667, 611, 722,
  667, 944, 667, 667, 611, 278, 278, 278, 469, 556, 333, 556, 556, 500, 556, 556, 278, 556, 556,
  222, 222, 500, 222, 833, 556, 556, 556, 556, 333, 500, 278, 556, 500, 722, 500, 500, 500, 334,
  260, 334, 584];
const BOLD = [278, 333, 474, 556, 556, 889, 722, 238, 333, 333, 389, 584, 278, 333, 278, 278, 556,
  556, 556, 556, 556, 556, 556, 556, 556, 556, 333, 333, 584, 584, 584, 611, 975, 722, 722, 722,
  722, 667, 611, 778, 722, 278, 556, 722, 611, 833, 722, 778, 667, 778, 722, 667, 611, 722, 667,
  944, 667, 667, 611, 333, 278, 333, 584, 556, 333, 556, 611, 556, 611, 556, 333, 611, 611, 278,
  278, 556, 278, 889, 611, 611, 611, 611, 389, 556, 333, 611, 556, 778, 556, 556, 500, 389, 280,
  389, 584];
const OTHER_WIDTH: Record<string, number> = { '×': 584, '–': 556, '—': 1000, '·': 278, '„': 333, '“': 333, '”': 333, '‘': 222, '’': 222 };

type Font = 'F1' | 'F2'; // Helvetica, Helvetica-Bold

function width(text: string, font: Font, size: number): number {
  const table = font === 'F2' ? BOLD : REGULAR;
  let units = 0;
  for (const ch of text) {
    const c = BASE[ch] ?? ch;
    const code = c.charCodeAt(0);
    units += code >= 32 && code <= 126 ? table[code - 32] : (OTHER_WIDTH[c] ?? 556);
  }
  return (units * size) / 1000;
}

// A string as a PDF literal of single-byte codes.
function literal(text: string): string {
  let out = '(';
  for (const ch of text) {
    const extra = EXTRA.indexOf(ch);
    const code = extra >= 0 ? extra + 1 : (WINANSI[ch] ?? ch.charCodeAt(0));
    if (ch === '(' || ch === ')' || ch === '\\') out += `\\${ch}`;
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, '0')}`;
    else if (code > 255) out += '?';
    else out += String.fromCharCode(code);
  }
  return `${out})`;
}

// 150050 hellers → "1 500,50 Kč", as the app shows money.
export function kc(hellers: number): string {
  const h = Math.round(hellers);
  const whole = Math.floor(h / 100).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${whole},${String(h % 100).padStart(2, '0')} Kč`;
}

// "2026-11-25" → "25. 11. 2026".
function czDate(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  return `${d}. ${m}. ${y}`;
}

function quantity(q: number): string {
  return String(q).replace('.', ',');
}

const PAGE_W = 595.28; // A4, in points
const PAGE_H = 841.89;
const MARGIN = 48;
const RIGHT = PAGE_W - MARGIN;

// Lines that fit `max` points wide, broken between words.
function wrap(text: string, font: Font, size: number, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(/\s+/).filter(Boolean)) {
    const next = line === '' ? word : `${line} ${word}`;
    if (line !== '' && width(next, font, size) > max) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line !== '') lines.push(line);
  return lines.length ? lines : [''];
}

class Page {
  ops: string[] = [];
  text(s: string, x: number, y: number, font: Font = 'F1', size = 10, gray = 0): void {
    this.ops.push(`BT ${gray} g /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td ${literal(s)} Tj ET`);
  }
  textRight(s: string, right: number, y: number, font: Font = 'F1', size = 10, gray = 0): void {
    this.text(s, right - width(s, font, size), y, font, size, gray);
  }
  rule(x1: number, y: number, x2: number, gray = 0.8, lineWidth = 0.5): void {
    this.ops.push(`${gray} G ${lineWidth} w ${x1.toFixed(2)} ${y.toFixed(2)} m ${x2.toFixed(2)} ${y.toFixed(2)} l S`);
  }
  box(x: number, y: number, w: number, h: number, gray: number): void {
    this.ops.push(`${gray} g ${x.toFixed(2)} ${y.toFixed(2)} ${w.toFixed(2)} ${h.toFixed(2)} re f`);
  }
}

// A party's block: a caption, the name in bold, then IDs and the address.
function party(page: Page, caption: string, p: Party, x: number, top: number, w: number): number {
  page.text(caption.toUpperCase(), x, top, 'F2', 8, 0.45);
  let y = top - 16;
  for (const line of wrap(p.name, 'F2', 11, w)) {
    page.text(line, x, y, 'F2', 11);
    y -= 14;
  }
  const lines = [
    p.street,
    [p.zip, p.city].filter(Boolean).join(' '),
    p.ico ? `IČO: ${p.ico}` : '',
    p.dic ? `DIČ: ${p.dic}` : '',
  ].filter(Boolean);
  for (const line of lines) {
    page.text(line, x, y, 'F1', 10, 0.15);
    y -= 13;
  }
  return y;
}

// The columns of the items table: description, quantity, unit price, amount (right edges).
const COL_QTY = 340;
const COL_PRICE = 440;
const COL_AMOUNT = RIGHT;
const DESC_W = COL_QTY - 50 - MARGIN;

function tableHeader(page: Page, y: number): number {
  page.box(MARGIN, y - 6, RIGHT - MARGIN, 20, 0.94);
  page.text('Popis', MARGIN + 8, y, 'F2', 9, 0.3);
  page.textRight('Množství', COL_QTY, y, 'F2', 9, 0.3);
  page.textRight('Cena za kus', COL_PRICE, y, 'F2', 9, 0.3);
  page.textRight('Celkem', COL_AMOUNT - 8, y, 'F2', 9, 0.3);
  return y - 24;
}

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
  facts.forEach(([label, value], i) => {
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
    lines.forEach((line, i) => page.text(line, MARGIN + 8, y - i * 13, 'F1', 10));
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
    all.forEach((p, i) => p.textRight(`Strana ${i + 1} z ${all.length}`, RIGHT, MARGIN - 20, 'F1', 8, 0.5));
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
    `<< /Type /Encoding /BaseEncoding /WinAnsiEncoding /Differences [1 ${EXTRA_NAMES.map((n) => `/${n}`).join(' ')}] >>`,
  );
  const f1 = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding ${encoding} 0 R >>`);
  const f2 = add(`<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding ${encoding} 0 R >>`);
  const kids: number[] = [];
  for (const p of ps) {
    const content = p.ops.join('\n');
    const stream = add(`<< /Length ${content.length} >>\nstream\n${content}\nendstream`);
    kids.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_W} ${PAGE_H}] ` +
          `/Resources << /Font << /F1 ${f1} 0 R /F2 ${f2} 0 R >> >> /Contents ${stream} 0 R >>`,
      ),
    );
  }
  objects[catalog - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] = `<< /Type /Pages /Kids [${kids.map((k) => `${k} 0 R`).join(' ')}] /Count ${kids.length} >>`;
  const info = add(`<< /Title ${literal(`Faktura ${inv.number}`)} /Producer (F*ckturoid) >>`);

  let file = '%PDF-1.4\n%\xe2\xe3\xcf\xd3\n';
  const offsets: number[] = [];
  objects.forEach((body, i) => {
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
