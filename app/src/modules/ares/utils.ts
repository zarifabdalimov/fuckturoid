// Reading ARES's JSON into the app's fields.

import * as R from 'remeda';
import type { Company, Sidlo } from './types.ts';

export function refused(ico: string, error: string): Company {
  return { ok: false, error, ico, name: '', dic: '', street: '', city: '', zip: '' };
}

export function isObject(v: unknown): v is Record<string, unknown> {
  return v !== null && typeof v === 'object';
}

// "Rohanské nábřeží 678/23": the street (or the village part when there is no
// street), the house number, then the orientation number with its letter.
export function streetLine(s: Sidlo): string {
  const place = s.nazevUlice ?? s.nazevCastiObce ?? s.nazevObce ?? '';
  const orientation =
    s.cisloOrientacni !== undefined ? `/${s.cisloOrientacni}${s.cisloOrientacniPismeno ?? ''}` : '';
  const number = s.cisloDomovni !== undefined ? `${s.cisloDomovni}${orientation}` : '';
  return R.join(R.filter([place, number], (p) => p !== ''), ' ');
}

// Prague is written with its district ("Praha 8"), as on an envelope.
export function cityLine(s: Sidlo): string {
  if (s.nazevObce === 'Praha' && s.nazevMestskehoObvodu) return s.nazevMestskehoObvodu;
  return s.nazevObce ?? '';
}

export function zipLine(psc: number | undefined): string {
  if (psc === undefined) return '';
  const digits = String(psc).padStart(5, '0');
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}
