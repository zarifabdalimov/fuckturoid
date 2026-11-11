import { z } from '../../utils/zod.ts';

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

export const SubjectSchema = z.object({
  obchodniJmeno: z.string(),
  dic: z.string().optional(),
  sidlo: SidloSchema.optional(),
});
export type Subject = z.infer<typeof SubjectSchema>;
