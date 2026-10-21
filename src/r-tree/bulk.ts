import type {Arena} from './Arena';
import {multiSelect, reseed} from './select';

const cuts: number[] = [];

const part = (lo: number, n: number, j: number, k: number): number => lo + Math.floor((j * n) / k);

/** Nodes of the tree that {@link omt} builds over `n` entries. */
const count = (n: number, height: number, M: number): number => {
  if (height === 1) return 1;
  let cap = M;
  for (let h = 2; h < height; h++) cap *= M;
  const k = Math.ceil(n / cap);
  let nodes = 1;
  for (let j = 0; j < k; j++) nodes += count(part(0, n, j + 1, k) - part(0, n, j, k), height - 1, M);
  return nodes;
};

/**
 * @param es source of each entry slot, permuted along
 * @param kx centres times two of `es`, ordering the slices on x; `ky` on y
 */
const omt = <K>(
  a: Arena<K>,
  ids: readonly K[],
  boxes: Float64Array,
  es: Int32Array,
  kx: Float64Array,
  ky: Float64Array,
  lo: number,
  hi: number,
  height: number,
): number => {
  const n = hi - lo;
  const node = a.newNode(height);
  if (height === 1) {
    const kids = a.nKids;
    const leaf = a.eLeaf;
    const eIds = a.eIds;
    const eBox = a.eBox;
    for (let i = lo, j = node * a.stride; i < hi; i++, j++) {
      const s = es[i];
      kids[j] = i;
      leaf[i] = node;
      eIds[i] = ids[s];
      const b = i << 2;
      const p = s << 2;
      eBox[b] = boxes[p];
      eBox[b + 1] = boxes[p + 1];
      eBox[b + 2] = boxes[p + 2];
      eBox[b + 3] = boxes[p + 3];
    }
    a.nCount[node] = n;
    a.refit(node);
    return node;
  }
  const M = a.max;
  let cap = M;
  for (let h = 2; h < height; h++) cap *= M;
  const k = Math.ceil(n / cap);
  const s = Math.ceil(Math.sqrt(k));
  for (let t = 1; t < s; t++) cuts[t - 1] = part(lo, n, Math.floor((t * k) / s), k);
  multiSelect(es, kx, ky, lo, hi, cuts, 0, s - 1, 0);
  const kids = a.nKids;
  const parent = a.nParent;
  const at = node * a.stride;
  let c = 0;
  for (let t = 0; t < s; t++) {
    const j0 = Math.floor((t * k) / s);
    const j1 = Math.floor(((t + 1) * k) / s);
    for (let j = j0 + 1; j < j1; j++) cuts[j - j0 - 1] = part(lo, n, j, k);
    multiSelect(es, kx, ky, part(lo, n, j0, k), part(lo, n, j1, k), cuts, 0, j1 - j0 - 1, 1);
    for (let j = j0; j < j1; j++) {
      const child = omt(a, ids, boxes, es, kx, ky, part(lo, n, j, k), part(lo, n, j + 1, k), height - 1);
      parent[child] = node;
      kids[at + c++] = child;
    }
  }
  a.nCount[node] = c;
  a.refit(node);
  return node;
};

/**
 * OMT bulk loading (Lee and Lee 2003), after rbush (MIT): builds every node
 * of `a`, whose entry slots `0..n` it fills in leaf order with `ids` and
 * their `boxes`. Slices go by centre, not rbush's lower bound: it groups
 * mixed sizes tighter.
 *
 * @returns the source in `ids` of each slot
 */
export const bulkBuild = <K>(a: Arena<K>, ids: readonly K[], boxes: Float64Array, n: number): Int32Array => {
  const M = a.max;
  let height = 1;
  for (let cap = M; cap < n; cap *= M) height++;
  const es = new Int32Array(n);
  const kx = new Float64Array(height > 1 ? n : 0);
  const ky = new Float64Array(kx.length);
  for (let i = 0; i < n; i++) es[i] = i;
  for (let i = 0; i < kx.length; i++) {
    const b = i << 2;
    const x = boxes[b] + boxes[b + 2];
    const y = boxes[b + 1] + boxes[b + 3];
    // A NaN key, as of a band from -Infinity to Infinity, would never compare: equal Infinities split evenly.
    kx[i] = x === x ? x : Infinity;
    ky[i] = y === y ? y : Infinity;
  }
  a.clearNodes();
  // All of them, as omt holds the node arrays across its calls, with headroom for the edits after.
  const c = count(n, height, M);
  a.reserveNodes(c + (c >> 4) + height + 1);
  reseed();
  a.root = omt(a, ids, boxes, es, kx, ky, 0, n, height);
  return es;
};
