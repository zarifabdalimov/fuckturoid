// ARES's answer as this app uses it, and the part of ARES's JSON it reads.

// What a lookup answers: the company, or why there is none (`ok: false`).
// A network failure or an answer this code doesn't understand throws instead.
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

// The registered address ("sídlo") in ARES's JSON; every field may be missing.
export type Sidlo = {
  nazevObce?: string;
  nazevMestskehoObvodu?: string;
  nazevCastiObce?: string;
  nazevUlice?: string;
  cisloDomovni?: number;
  cisloOrientacni?: number;
  cisloOrientacniPismeno?: string;
  psc?: number;
  textovaAdresa?: string;
};
