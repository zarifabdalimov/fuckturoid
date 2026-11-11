// Drawing helpers: measuring and encoding text, a page's drawing operators, and
// the blocks an invoice repeats (a party, the items table's header).

import {
  BASE, BOLD, COL_AMOUNT, COL_PRICE, COL_QTY, EXTRA, MARGIN, OTHER_WIDTH, REGULAR, RIGHT, WINANSI,
} from './preset.ts';
import type { Font, Party } from './types.ts';

export function width(text: string, font: Font, size: number): number {
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
export function literal(text: string): string {
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

export function quantity(q: number): string {
  return String(q).replace('.', ',');
}

// Lines that fit `max` points wide, broken between words.
export function wrap(text: string, font: Font, size: number, max: number): string[] {
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

export class Page {
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
export function party(page: Page, caption: string, p: Party, x: number, top: number, w: number): number {
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

export function tableHeader(page: Page, y: number): number {
  page.box(MARGIN, y - 6, RIGHT - MARGIN, 20, 0.94);
  page.text('Popis', MARGIN + 8, y, 'F2', 9, 0.3);
  page.textRight('Množství', COL_QTY, y, 'F2', 9, 0.3);
  page.textRight('Cena za kus', COL_PRICE, y, 'F2', 9, 0.3);
  page.textRight('Celkem', COL_AMOUNT - 8, y, 'F2', 9, 0.3);
  return y - 24;
}
