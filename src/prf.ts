function mix32 (x: number): number {
  x = x >>> 0;
  x ^= x >>> 16;
  x = Math.imul(x, 0x7feb352d);
  x ^= x >>> 15;
  x = Math.imul(x, 0x846ca68b);
  x ^= x >>> 16;
  return x >>> 0;
}

function prf32 (seed: number, a: number, b = 0, c = 0, d = 0): number {
  let h = seed >>> 0;
  h ^= mix32(a);
  h = mix32(h);
  h ^= mix32(b + 0x9e3779b9);
  h = mix32(h);
  h ^= mix32(c + 0x85ebca6b);
  h = mix32(h);
  h ^= mix32(d + 0xc2b2ae35);
  return mix32(h);
}

export function prf32n (seed: number, min: number, max: number, a: number, b = 0, c = 0, d = 0): number {
    return prf32(seed, a, b, c, d) % (max - min) + min;
}

export function prf32f (seed: number, a: number, b = 0, c = 0, d = 0): number {
    return prf32(seed, a, b, c, d) / 0x100000000;
}