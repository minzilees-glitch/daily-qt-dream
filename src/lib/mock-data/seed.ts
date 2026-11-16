/** Deterministic mulberry32 PRNG for reproducible mock data. */
export function mulberry32(seed: number) {
  let t = seed >>> 0;
  return function next() {
    t += 0x6d2b79f5;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r ^= r + Math.imul(r ^ (r >>> 7), 61 | r);
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function pick<T>(rng: () => number, arr: readonly T[]): T {
  return arr[Math.floor(rng() * arr.length)]!;
}

export function chance(rng: () => number, p: number): boolean {
  return rng() < p;
}

/** Shuffle a copy (Fisher–Yates) with the given PRNG. */
export function shuffle<T>(rng: () => number, arr: readonly T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    const tmp = out[i]!;
    out[i] = out[j]!;
    out[j] = tmp;
  }
  return out;
}

/** Pick `n` distinct items (or all if fewer). */
export function sampleN<T>(rng: () => number, arr: readonly T[], n: number): T[] {
  if (n <= 0) return [];
  if (n >= arr.length) return [...arr];
  return shuffle(rng, arr).slice(0, n);
}
