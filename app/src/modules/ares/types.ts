// ARES's answer as this app uses it, and the schema of the part of ARES's JSON
// it reads. The schemas validate the response; the types follow from them.

import { z } from '../../utils/zod.ts';

// What a lookup answers: the company, or why there is none (`ok: false`).
// A network failure or an answer that fails the schema throws instead.
export type Company = {
  ok: boolean;
  error: string;
  ico: string;
  name: string;
  dic: string;
  street: string;
  city: string;
  zip: string;
};

// The registered address ("sídlo"); every field may be missing.
export const SidloSchema = z.object({
  nazevObce: z.string().optional(),
  nazevMestskehoObvodu: z.string().optional(),
  nazevCastiObce: z.string().optional(),
  nazevUlice: z.string().optional(),
  cisloDomovni: z.number().optional(),
  cisloOrientacni: z.number().optional(),
  cisloOrientacniPismeno: z.string().optional(),
  psc: z.number().optional(),
  textovaAdresa: z.string().optional(),
});
export type Sidlo = z.infer<typeof SidloSchema>;

// An economic subject (GET /ekonomicke-subjekty/{ico}): the fields this app
// uses. Others are dropped.
export const SubjectSchema = z.object({
  obchodniJmeno: z.string(),
  dic: z.string().optional(),
  sidlo: SidloSchema.optional(),
});
export type Subject = z.infer<typeof SubjectSchema>;
