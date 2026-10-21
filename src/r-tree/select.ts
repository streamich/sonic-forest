import type {IRect} from './types';

export type Axis = 0 | 1;

// The centre, not rbush's lower bound: it groups mixed sizes tighter.
const key = (r: IRect, axis: Axis): number => (axis === 0 ? r.minX + r.maxX : r.minY + r.maxY);

const swap = <T>(a: T[], i: number, j: number): void => {
  const t = a[i];
  a[i] = a[j];
  a[j] = t;
};

/** Hoare's FIND (1961); `hi` is inclusive. */
const select = <T extends IRect>(a: T[], k: number, lo: number, hi: number, axis: Axis): void => {
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (key(a[mid], axis) < key(a[lo], axis)) swap(a, lo, mid);
    if (key(a[hi], axis) < key(a[lo], axis)) swap(a, lo, hi);
    if (key(a[hi], axis) < key(a[mid], axis)) swap(a, mid, hi);
    const p = key(a[mid], axis);
    let i = lo;
    let j = hi;
    while (i <= j) {
      while (key(a[i], axis) < p) i++;
      while (key(a[j], axis) > p) j--;
      if (i <= j) swap(a, i++, j--);
    }
    if (k <= j) hi = j;
    else if (k >= i) lo = i;
    else return;
  }
};

/** Partitions `a[lo..hi)` at every position in `cuts[c0..c1)`, which strictly increase inside `(lo, hi)`. */
export const multiSelect = <T extends IRect>(
  a: T[],
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
  select(a, at, lo, hi - 1, axis);
  multiSelect(a, lo, at, cuts, c0, cm, axis);
  multiSelect(a, at + 1, hi, cuts, cm + 1, c1, axis);
};
