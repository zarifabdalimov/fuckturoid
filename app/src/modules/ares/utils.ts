import * as R from 'remeda';
import type { Company, Sidlo } from './types.ts';

export function refused(ico: string, error: string): Company {
  return { ok: false, error, ico, name: '', dic: '', street: '', city: '', zip: '' };
}

export function streetLine(seat: Sidlo): string {
  const place = seat.nazevUlice ?? seat.nazevCastiObce ?? seat.nazevObce ?? '';
  const orientation =
    seat.cisloOrientacni !== undefined ? `/${seat.cisloOrientacni}${seat.cisloOrientacniPismeno ?? ''}` : '';
  const number = seat.cisloDomovni !== undefined ? `${seat.cisloDomovni}${orientation}` : '';
  return R.join(
    R.filter([place, number], (part) => part !== ''),
    ' ',
  );
}

export function cityLine(seat: Sidlo): string {
  if (seat.nazevObce === 'Praha' && seat.nazevMestskehoObvodu) return seat.nazevMestskehoObvodu;
  return seat.nazevObce ?? '';
}

export function zipLine(psc: number | undefined): string {
  if (psc === undefined) return '';
  const digits = String(psc).padStart(5, '0');
  return `${digits.slice(0, 3)} ${digits.slice(3)}`;
}
