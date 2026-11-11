// A list as a file's bytes, and back.

export function decodeList<T>(bytes: ArrayBuffer): T[] {
  return JSON.parse(new TextDecoder().decode(bytes)) as T[];
}

export function encodeList<T>(items: T[]): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(items));
}
