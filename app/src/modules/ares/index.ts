// ARES, the Czech register of economic subjects (https://ares.gov.cz): a
// company's name, DIČ and registered address by its IČO.

import { ARES, COMPANY_PATH, TIMEOUT_MS } from './preset.ts';
import { type Company, SubjectSchema } from './types.ts';
import { cityLine, refused, streetLine, zipLine } from './utils.ts';

export type { Company } from './types.ts';

export async function lookupIco(ico: string): Promise<Company> {
  const response = await fetch(`${ARES}${COMPANY_PATH}/${ico}`, {
    headers: { Accept: 'application/json' },
    exactTimeout: TIMEOUT_MS,
  });
  if (response.status === 404 || response.status === 400) {
    return refused(ico, `ARES has no company with IČO ${ico}.`);
  }
  if (!response.ok) {
    throw new Error(`ARES answered ${response.status}.`);
  }
  const parsed = SubjectSchema.safeParse(await response.json());
  if (!parsed.success) {
    throw new Error(`ARES sent an answer this app does not understand: ${parsed.error.message}`);
  }
  const subject = parsed.data;
  const sidlo = subject.sidlo ?? {};
  const structured = sidlo.nazevObce !== undefined;
  return {
    ok: true,
    error: '',
    ico,
    name: subject.obchodniJmeno,
    dic: subject.dic ?? '',
    street: structured ? streetLine(sidlo) : (sidlo.textovaAdresa ?? ''),
    city: structured ? cityLine(sidlo) : '',
    zip: zipLine(sidlo.psc),
  };
}
