import type {Arena} from './Arena';

// TODO: drop these after a split of over a few hundred children once such fanouts get used: they stay at the largest size.
/** Children of the node being split, by position. */
let kid = new Int32Array(0);
/** Child boxes, by position. */
let cb = new Float64Array(0);
/** Sort keys of a split with a NaN lower bound: `cb` with NaN as Infinity. */
let nk = new Float64Array(0);
/** Ranks by position: by (minX, minY, position) in the low 16 bits, by (minY, minX, position) above. */
let rank = new Int32Array(0);
/** Positions in rank order. */
let px = new Int32Array(0);
let py = new Int32Array(0);
/** Both halves of every candidate split, 8 numbers each: the head's box, then the tail's. */
let cutX = new Float64Array(0);
let cutY = new Float64Array(0);

const reserve = (n: number): void => {
  kid = new Int32Array(n);
  cb = new Float64Array(n * 4);
  nk = new Float64Array(n * 4);
  rank = new Int32Array(n);
  px = new Int32Array(n);
  py = new Int32Array(n);
  cutX = new Float64Array(n * 8);
  cutY = new Float64Array(n * 8);
};

/**
 * Whether a later position, keyed `jx, jy`, precedes an earlier one keyed
 * `x, y`: by (minX, minY) in bit 0, by (minY, minX) in bit 16.
 */
const before = (jx: number, jy: number, x: number, y: number): number => {
  const ltx = +(jx < x);
  const lty = +(jy < y);
  return ltx | (+(jx === x) & lty) | ((lty | (+(jy === y) & ltx)) << 16);
};

// The unions take Math.min and Math.max, not branches, which mispredict; they differ from
// branches only in the sign of a zero, which no decision below sees, and in spreading a NaN.

/** Sums the margins of every split of `p` into at least `m` and `m`, in rbush's order, keeping the halves in `cut`. */
const sweep = (c: Float64Array, p: Int32Array, n: number, m: number, cut: Float64Array): number => {
  let sum = 0;
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (let i = 0, end = n - m; i < end; i++) {
    const b = p[i] << 2;
    x0 = Math.min(x0, c[b]);
    y0 = Math.min(y0, c[b + 1]);
    x1 = Math.max(x1, c[b + 2]);
    y1 = Math.max(y1, c[b + 3]);
    if (i < m - 1) continue;
    const o = (i + 1 - m) << 3;
    cut[o] = x0;
    cut[o + 1] = y0;
    cut[o + 2] = x1;
    cut[o + 3] = y1;
    sum += x1 - x0 + (y1 - y0);
  }
  x0 = y0 = Infinity;
  x1 = y1 = -Infinity;
  for (let i = n - 1, end = n - m; i >= m; i--) {
    const b = p[i] << 2;
    x0 = Math.min(x0, c[b]);
    y0 = Math.min(y0, c[b + 1]);
    x1 = Math.max(x1, c[b + 2]);
    y1 = Math.max(y1, c[b + 3]);
    if (i > end) continue;
    const o = ((i - m) << 3) + 4;
    cut[o] = x0;
    cut[o + 1] = y0;
    cut[o + 2] = x1;
    cut[o + 3] = y1;
    sum += x1 - x0 + (y1 - y0);
  }
  return sum;
};

/** The candidate of least overlap, then least area. */
const choose = (cut: Float64Array, count: number): number => {
  let best = 0;
  let minOverlap = Infinity;
  let minArea = Infinity;
  for (let i = 0; i < count; i++) {
    const o = i << 3;
    const ax0 = cut[o];
    const ay0 = cut[o + 1];
    const ax1 = cut[o + 2];
    const ay1 = cut[o + 3];
    const bx0 = cut[o + 4];
    const by0 = cut[o + 5];
    const bx1 = cut[o + 6];
    const by1 = cut[o + 7];
    const w = Math.min(ax1, bx1) - Math.max(ax0, bx0);
    const h = Math.min(ay1, by1) - Math.max(ay0, by0);
    const overlap = w > 0 && h > 0 ? w * h : 0;
    const area = (ax1 - ax0) * (ay1 - ay0) + (bx1 - bx0) * (by1 - by0);
    if (overlap < minOverlap || (overlap === minOverlap && area < minArea)) {
      minOverlap = overlap;
      minArea = area;
      best = i;
    }
  }
  return best;
};

/**
 * The R*-tree split of Beckmann et al. 1990, sorting by the lower bound only:
 * moves the tail of the best split of an overfull node to a new sibling. Ties
 * go by the other axis, then by position.
 *
 * @returns the sibling
 */
export const split = <K>(a: Arena<K>, node: number): number => {
  const m = a.min;
  const height = a.nHeight[node];
  const box = height === 1 ? a.eBox : a.nBox;
  const kids = a.nKids;
  const from = node * a.stride;
  const n = a.nCount[node];
  if (kid.length < n) reserve(n);
  const k = kid;
  const c = cb;
  const r = rank;
  let sum = 0;
  for (let i = 0; i < n; i++) {
    const e = kids[from + i];
    k[i] = e;
    const b = e << 2;
    const p = i << 2;
    const x0 = (c[p] = box[b]);
    const y0 = (c[p + 1] = box[b + 1]);
    c[p + 2] = box[b + 2];
    c[p + 3] = box[b + 3];
    sum += x0 + y0;
    r[i] = 0;
  }
  // A NaN key would make ranks collide: it sorts last.
  let key = c;
  if (sum !== sum) {
    key = nk;
    for (let p = 0; p < n * 4; p += 4) {
      key[p] = c[p] === c[p] ? c[p] : Infinity;
      key[p + 1] = c[p + 1] === c[p + 1] ? c[p + 1] : Infinity;
    }
  }
  // Stable ranks by counting, both orders at once, two positions per pass: no branch to mispredict.
  let i = 0;
  for (; i + 1 < n; i += 2) {
    const x = key[i << 2];
    const y = key[(i << 2) + 1];
    const x2 = key[(i << 2) + 4];
    const y2 = key[(i << 2) + 5];
    const d0 = before(x2, y2, x, y);
    let ri = r[i] + d0;
    let ri2 = r[i + 1] + 0x10001 - d0;
    for (let j = i + 2; j < n; j++) {
      const jx = key[j << 2];
      const jy = key[(j << 2) + 1];
      const d = before(jx, jy, x, y);
      const d2 = before(jx, jy, x2, y2);
      ri += d;
      ri2 += d2;
      r[j] += 0x20002 - d - d2;
    }
    px[ri & 0xffff] = i;
    py[ri >>> 16] = i;
    px[ri2 & 0xffff] = i + 1;
    py[ri2 >>> 16] = i + 1;
  }
  if (i < n) {
    px[r[i] & 0xffff] = i;
    py[r[i] >>> 16] = i;
  }
  let p = py;
  let cut = cutY;
  if (sweep(c, px, n, m, cutX) < sweep(c, py, n, m, cutY)) {
    p = px;
    cut = cutX;
  }
  const best = choose(cut, n - 2 * m + 1);
  const at = m + best;
  const sibling = a.newNode(height);
  const up = height === 1 ? a.eLeaf : a.nParent;
  for (let i = 0; i < at; i++) kids[from + i] = k[p[i]];
  const to = sibling * a.stride - at;
  for (let i = at; i < n; i++) {
    const e = k[p[i]];
    kids[to + i] = e;
    up[e] = sibling;
  }
  a.nCount[node] = at;
  a.nCount[sibling] = n - at;
  const nBox = a.nBox;
  const o = best << 3;
  let b = node << 2;
  nBox[b] = cut[o];
  nBox[b + 1] = cut[o + 1];
  nBox[b + 2] = cut[o + 2];
  nBox[b + 3] = cut[o + 3];
  b = sibling << 2;
  nBox[b] = cut[o + 4];
  nBox[b + 1] = cut[o + 5];
  nBox[b + 2] = cut[o + 6];
  nBox[b + 3] = cut[o + 7];
  return sibling;
};
