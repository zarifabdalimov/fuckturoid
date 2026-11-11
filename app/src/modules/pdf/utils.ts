import * as R from 'remeda';
import {
  BASE,
  BOLD,
  COL_AMOUNT,
  COL_PRICE,
  COL_QTY,
  EXTRA,
  MARGIN,
  OTHER_WIDTH,
  REGULAR,
  RIGHT,
  WINANSI,
} from './preset.ts';
import type { Font, Labels, Party } from './types.ts';

export function width(text: string, font: Font, size: number): number {
  const table = font === 'F2' ? BOLD : REGULAR;
  let units = 0;
  for (const char of text) {
    const base = BASE[char] ?? char;
    const code = base.charCodeAt(0);
    units += code >= 32 && code <= 126 ? table[code - 32] : (OTHER_WIDTH[base] ?? 556);
  }
  return (units * size) / 1000;
}

export function literal(text: string): string {
  let out = '(';
  for (const char of text) {
    const extra = EXTRA.indexOf(char);
    const code = extra >= 0 ? extra + 1 : (WINANSI[char] ?? char.charCodeAt(0));
    if (char === '(' || char === ')' || char === '\\') out += `\\${char}`;
    else if (code > 255) out += '?';
    else if (code < 32 || code > 126) out += `\\${code.toString(8).padStart(3, '0')}`;
    else out += String.fromCharCode(code);
  }
  return `${out})`;
}

export function quantity(value: number): string {
  return String(value).replace('.', ',');
}

export function wrap(text: string, font: Font, size: number, max: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of R.filter(text.split(/\s+/), R.isTruthy)) {
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
  text(content: string, left: number, baseline: number, font: Font = 'F1', size = 10, gray = 0): void {
    this.ops.push(
      `BT ${gray} g /${font} ${size} Tf ${left.toFixed(2)} ${baseline.toFixed(2)} Td ${literal(content)} Tj ET`,
    );
  }
  textRight(content: string, right: number, baseline: number, font: Font = 'F1', size = 10, gray = 0): void {
    this.text(content, right - width(content, font, size), baseline, font, size, gray);
  }
  rule(left: number, height: number, right: number, gray = 0.8, lineWidth = 0.5): void {
    this.ops.push(
      `${gray} G ${lineWidth} w ${left.toFixed(2)} ${height.toFixed(2)} m ${right.toFixed(2)} ${height.toFixed(2)} l S`,
    );
  }
  box(left: number, bottom: number, boxWidth: number, boxHeight: number, gray: number): void {
    this.ops.push(
      `${gray} g ${left.toFixed(2)} ${bottom.toFixed(2)} ${boxWidth.toFixed(2)} ${boxHeight.toFixed(2)} re f`,
    );
  }
}

export function party(
  page: Page,
  labels: Labels,
  caption: string,
  who: Party,
  left: number,
  top: number,
  columnWidth: number,
): number {
  page.text(caption.toUpperCase(), left, top, 'F2', 8, 0.45);
  let baseline = top - 16;
  for (const line of wrap(who.name, 'F2', 11, columnWidth)) {
    page.text(line, left, baseline, 'F2', 11);
    baseline -= 14;
  }
  const lines = R.filter(
    [
      who.street,
      R.join(R.filter([who.zip, who.city], R.isTruthy), ' '),
      who.ico ? `${labels.idNumber}: ${who.ico}` : '',
      who.dic ? `${labels.vatNumber}: ${who.dic}` : '',
    ],
    R.isTruthy,
  );
  for (const line of lines) {
    page.text(line, left, baseline, 'F1', 10, 0.15);
    baseline -= 13;
  }
  return baseline;
}

export function tableHeader(page: Page, labels: Labels, baseline: number): number {
  page.box(MARGIN, baseline - 6, RIGHT - MARGIN, 20, 0.94);
  page.text(labels.description, MARGIN + 8, baseline, 'F2', 9, 0.3);
  page.textRight(labels.quantity, COL_QTY, baseline, 'F2', 9, 0.3);
  page.textRight(labels.unitPrice, COL_PRICE, baseline, 'F2', 9, 0.3);
  page.textRight(labels.amount, COL_AMOUNT - 8, baseline, 'F2', 9, 0.3);
  return baseline - 24;
}
