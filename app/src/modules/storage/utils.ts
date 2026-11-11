export function decodeList<Entry>(bytes: ArrayBuffer): Entry[] {
  return JSON.parse(new TextDecoder().decode(bytes)) as Entry[];
}

export function encodeList<Entry>(items: Entry[]): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(items));
}
