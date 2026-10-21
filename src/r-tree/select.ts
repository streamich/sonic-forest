export type Axis = 0 | 1;

const swap = (a: Int32Array, kx: Float64Array, ky: Float64Array, i: number, j: number): void => {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
  const x = kx[i];
  kx[i] = kx[j];
  kx[j] = x;
  const y = ky[i];
  ky[i] = ky[j];
  ky[j] = y;
};

/**
 * Whether position `i` precedes `j`: by `key`, then by the other axis, which
 * keeps slices of equal keys compact, then by `a`, so that equal keys still
 * split evenly.
 */
const less = (key: Float64Array, other: Float64Array, a: Int32Array, i: number, j: number): boolean =>
  key[i] < key[j] || (key[i] === key[j] && (other[i] < other[j] || (other[i] === other[j] && a[i] < a[j])));

let seed = 1;

/** Restarts the pivot sampling, so that equal loads build equal trees. */
export const reseed = (): void => {
  seed = 1;
};

/** A position in `[lo, hi]` from Numerical Recipes' LCG. */
const pick = (lo: number, hi: number): number => {
  seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
  return lo + Math.floor(((seed >>> 0) / 4294967296) * (hi - lo + 1));
};

/** Quickselect by {@link less}; `hi` is inclusive. A branch-free Lomuto partition: Hoare's mispredicts its scans. */
const select = (
  a: Int32Array,
  kx: Float64Array,
  ky: Float64Array,
  k: number,
  lo: number,
  hi: number,
  axis: Axis,
): void => {
  const key = axis === 0 ? kx : ky;
  const other = axis === 0 ? ky : kx;
  // After a round that keeps over 3/4 of the range, the pivot's candidates come from random positions:
  // the partition rotates what it keeps, so on organ-pipe input fixed positions keep failing.
  let random = false;
  while (lo < hi) {
    let mid = (lo + hi) >>> 1;
    if (random) {
      swap(a, kx, ky, lo, pick(lo, hi));
      swap(a, kx, ky, hi, pick(lo, hi));
      mid = pick(lo, hi);
    }
    if (less(key, other, a, mid, lo)) swap(a, kx, ky, lo, mid);
    if (less(key, other, a, hi, lo)) swap(a, kx, ky, lo, hi);
    if (less(key, other, a, mid, hi)) swap(a, kx, ky, mid, hi);
    const p = key[hi];
    const po = other[hi];
    const pa = a[hi];
    let s = lo;
    for (let i = lo; i < hi; i++) {
      const x = key[i];
      const y = other[i];
      const ai = a[i];
      key[i] = key[s];
      other[i] = other[s];
      a[i] = a[s];
      key[s] = x;
      other[s] = y;
      a[s] = ai;
      // not a ternary: V8 branches on those
      s += +(x < p) | (+(x === p) & (+(y < po) | (+(y === po) & +(ai < pa))));
    }
    swap(a, kx, ky, s, hi);
    const len = hi - lo;
    if (k < s) hi = s - 1;
    else if (k > s) lo = s + 1;
    else return;
    random = (hi - lo) * 4 > len * 3;
  }
};

/**
 * Partitions `a[lo..hi)` at every position in `cuts[c0..c1)`, which strictly
 * increase inside `(lo, hi)`, by `kx` or `ky`: keys parallel to `a`, swapped
 * along with it.
 */
export const multiSelect = (
  a: Int32Array,
  kx: Float64Array,
  ky: Float64Array,
  lo: number,
  hi: number,
  cuts: readonly number[],
  c0: number,
  c1: number,
  axis: Axis,
): void => {
  if (c0 >= c1) return;
  const cm = (c0 + c1) >>> 1;
  const at = cuts[cm];
  select(a, kx, ky, at, lo, hi - 1, axis);
  multiSelect(a, kx, ky, lo, at, cuts, c0, cm, axis);
  multiSelect(a, kx, ky, at + 1, hi, cuts, cm + 1, c1, axis);
};
