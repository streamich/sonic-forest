import {split} from './split';
import type {IRect} from './types';

const grow = <T extends Float64Array | Int32Array | Uint8Array>(a: T, size: number): T => {
  const b = new (a.constructor as new (size: number) => T)(size);
  b.set(a);
  return b;
};

const removeKid = (kids: Int32Array, count: Int32Array, stride: number, node: number, c: number): void => {
  const from = node * stride;
  const last = from + --count[node];
  // Every kid is compared, no early exit: the exit would mispredict.
  let at = 0;
  for (let i = from; i <= last; i++) at |= i & -+(kids[i] === c);
  kids[at] = kids[last];
};

/** Guttman 1984 ChooseLeaf: least enlargement, then least area; skips a NaN enlargement. */
const chooseChildSlow = (
  box: Float64Array,
  kids: Int32Array,
  from: number,
  to: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): number => {
  let best = kids[from];
  let minEnlargement = Infinity;
  let minArea = Infinity;
  for (let i = from; i < to; i++) {
    const c = kids[i];
    const b = c << 2;
    const x0 = box[b];
    const y0 = box[b + 1];
    const x1 = box[b + 2];
    const y1 = box[b + 3];
    const area = (x1 - x0) * (y1 - y0);
    const enlargement = (Math.max(x1, maxX) - Math.min(x0, minX)) * (Math.max(y1, maxY) - Math.min(y0, minY)) - area;
    if (enlargement < minEnlargement || (enlargement === minEnlargement && area < minArea)) {
      minEnlargement = enlargement;
      minArea = area;
      best = c;
    }
  }
  return best;
};

/** Adds to a running minimum to reset it, or to a candidate to drop it. */
const PENALTY = new Float64Array([0, Infinity]);

/** {@link chooseChildSlow} without branches, which mispredict; falls back to it on a NaN. */
const chooseChild = (
  box: Float64Array,
  kids: Int32Array,
  from: number,
  to: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number,
): number => {
  let best = kids[from];
  let minEnlargement = Infinity;
  let minArea = Infinity;
  const pen = PENALTY;
  for (let i = from; i < to; i++) {
    const c = kids[i];
    const b = c << 2;
    const x0 = box[b];
    const y0 = box[b + 1];
    const x1 = box[b + 2];
    const y1 = box[b + 3];
    const area = (x1 - x0) * (y1 - y0);
    const enlargement = (Math.max(x1, maxX) - Math.min(x0, minX)) * (Math.max(y1, maxY) - Math.min(y0, minY)) - area;
    const lt = +(enlargement < minEnlargement);
    const gt = +(enlargement > minEnlargement);
    best ^= (best ^ c) & -(lt | ((gt ^ 1) & +(area < minArea)));
    // Least area among the least enlargements: a lesser enlargement resets it, a greater one is no candidate.
    minArea = Math.min(minArea + pen[lt], area + pen[gt]);
    minEnlargement = Math.min(minEnlargement, enlargement);
  }
  return minEnlargement === minEnlargement && minArea === minArea
    ? best
    : chooseChildSlow(box, kids, from, to, minX, minY, maxX, maxY);
};

/**
 * Struct-of-arrays storage of an R-tree. Entries and nodes live in slots that
 * free lists recycle. A box is `minX, minY, maxX, maxY` at `slot * 4`; the
 * children of node `n` sit at `n * stride`: entry slots under a leaf (height
 * 1), node slots under an inner node.
 */
export class Arena<K> {
  public eBox: Float64Array;
  public eIds: (K | undefined)[] = [];
  /** Leaf of a live entry, the next free slot of a free one. */
  public eLeaf: Int32Array;
  public nBox: Float64Array;
  public nKids: Int32Array;
  public nCount: Int32Array;
  public nHeight: Uint8Array;
  /** Parent of a live node (-1 at the root), the next free slot of a free one. */
  public nParent: Int32Array;
  public root: number;
  public readonly stride: number;
  private eLen = 0;
  private eFree = -1;
  private nLen = 0;
  private nFree = -1;
  /** A full array grows by `length >> shift`: it doubles, or grows by half after a bulk load, which mostly takes edits. */
  private readonly shift: number;
  private readonly orphans: number[] = [];

  /** @param entries slots taken from the start, for `bulkBuild` to fill */
  constructor(
    public readonly max: number,
    public readonly min: number,
    entries = 0,
  ) {
    this.stride = max + 1;
    // Headroom, so that the first edits after a bulk load copy no array.
    const cap = Math.max(16, entries + (entries >> 4));
    this.eBox = new Float64Array(cap * 4);
    this.eLeaf = new Int32Array(cap);
    this.eLen = entries;
    this.shift = entries ? 1 : 0;
    this.nBox = new Float64Array(4);
    this.nKids = new Int32Array(this.stride);
    this.nCount = new Int32Array(1);
    this.nHeight = new Uint8Array(1);
    this.nParent = new Int32Array(1);
    this.root = this.newNode(1);
  }

  private growEntries(need: number): void {
    const len = this.eLeaf.length;
    const size = Math.max(need, len + (len >> this.shift));
    this.eBox = grow(this.eBox, size * 4);
    this.eLeaf = grow(this.eLeaf, size);
  }

  public newEntry(id: K, r: IRect): number {
    // Read before a slot is taken, so that a bad `r` throws with nothing changed.
    const {minX, minY, maxX, maxY} = r;
    let s = this.eFree;
    if (s >= 0) this.eFree = this.eLeaf[s];
    else if ((s = this.eLen++) === this.eLeaf.length) this.growEntries(s + 1);
    this.eIds[s] = id;
    const box = this.eBox;
    const b = s << 2;
    box[b] = minX;
    box[b + 1] = minY;
    box[b + 2] = maxX;
    box[b + 3] = maxY;
    return s;
  }

  public freeEntry(s: number): void {
    const ids = this.eIds;
    // A number pins nothing, and clearing it would box every id of an array of doubles.
    if (typeof ids[s] !== 'number') ids[s] = undefined;
    this.eLeaf[s] = this.eFree;
    this.eFree = s;
  }

  public setBox(s: number, r: IRect): void {
    const box = this.eBox;
    const b = s << 2;
    box[b] = r.minX;
    box[b + 1] = r.minY;
    box[b + 2] = r.maxX;
    box[b + 3] = r.maxY;
  }

  public reserveNodes(n: number): void {
    if (this.nLen + n > this.nCount.length) this.growNodes(this.nLen + n);
  }

  private growNodes(need: number): void {
    const len = this.nCount.length;
    const size = Math.max(need, len + (len >> this.shift));
    this.nBox = grow(this.nBox, size * 4);
    this.nKids = grow(this.nKids, size * this.stride);
    this.nCount = grow(this.nCount, size);
    this.nHeight = grow(this.nHeight, size);
    this.nParent = grow(this.nParent, size);
  }

  /** An empty, parentless node; see {@link reserveNodes}. */
  public newNode(height: number): number {
    let n = this.nFree;
    if (n >= 0) this.nFree = this.nParent[n];
    else if ((n = this.nLen++) === this.nCount.length) this.growNodes(n + 1);
    this.nCount[n] = 0;
    this.nHeight[n] = height;
    this.nParent[n] = -1;
    const box = this.nBox;
    const b = n << 2;
    box[b] = Infinity;
    box[b + 1] = Infinity;
    box[b + 2] = -Infinity;
    box[b + 3] = -Infinity;
    return n;
  }

  /** Frees every node, keeping the capacity. */
  public clearNodes(): void {
    this.nLen = 0;
    this.nFree = -1;
  }

  private freeNode(n: number): void {
    this.nParent[n] = this.nFree;
    this.nFree = n;
  }

  /** @returns whether the box changed */
  public refit(n: number): boolean {
    const src = this.nHeight[n] === 1 ? this.eBox : this.nBox;
    const kids = this.nKids;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = n * this.stride, end = i + this.nCount[n]; i < end; i++) {
      const b = kids[i] << 2;
      minX = Math.min(minX, src[b]);
      minY = Math.min(minY, src[b + 1]);
      maxX = Math.max(maxX, src[b + 2]);
      maxY = Math.max(maxY, src[b + 3]);
    }
    const box = this.nBox;
    const b = n << 2;
    if (minX === box[b] && minY === box[b + 1] && maxX === box[b + 2] && maxY === box[b + 3]) return false;
    box[b] = minX;
    box[b + 1] = minY;
    box[b + 2] = maxX;
    box[b + 3] = maxY;
    return true;
  }

  /** Links entry `item` (`level` 1), or node `item` of height `level - 1`, under a node of height `level`. */
  public place(item: number, level: number): void {
    // Room for a split at every level and a new root, so the arrays held below stay current.
    this.reserveNodes(this.nHeight[this.root] + 1);
    const box = this.nBox;
    const kids = this.nKids;
    const count = this.nCount;
    const parent = this.nParent;
    const stride = this.stride;
    const src = level === 1 ? this.eBox : box;
    let b = item << 2;
    const minX = src[b];
    const minY = src[b + 1];
    const maxX = src[b + 2];
    const maxY = src[b + 3];
    // Grows every box on the way down: no branch, and no walk back up.
    let node = this.root;
    for (let h = this.nHeight[node]; ; h--) {
      b = node << 2;
      box[b] = Math.min(box[b], minX);
      box[b + 1] = Math.min(box[b + 1], minY);
      box[b + 2] = Math.max(box[b + 2], maxX);
      box[b + 3] = Math.max(box[b + 3], maxY);
      if (h === level) break;
      const from = node * stride;
      node = chooseChild(box, kids, from, from + count[node], minX, minY, maxX, maxY);
    }
    kids[node * stride + count[node]++] = item;
    (level === 1 ? this.eLeaf : parent)[item] = node;
    const max = this.max;
    while (count[node] > max) {
      const sibling = split(this, node);
      const p = parent[node];
      if (p < 0) {
        const root = this.newNode(this.nHeight[node] + 1);
        const at = root * stride;
        kids[at] = node;
        kids[at + 1] = sibling;
        count[root] = 2;
        parent[node] = parent[sibling] = root;
        this.refit(root);
        this.root = root;
        return;
      }
      kids[p * stride + count[p]++] = sibling;
      parent[sibling] = p;
      node = p;
    }
  }

  /**
   * Refits `n` and its ancestors after a child of `n` gave up the sides
   * `x0, y0, x1, y1` of its old box, NaN for a side it kept: only a side
   * that one of them touched can move.
   */
  public shrink(n: number, x0: number, y0: number, x1: number, y1: number): void {
    const box = this.nBox;
    const parent = this.nParent;
    for (; n >= 0; n = parent[n]) {
      const b = n << 2;
      const minX = box[b];
      const minY = box[b + 1];
      const maxX = box[b + 2];
      const maxY = box[b + 3];
      const touched = +(x0 === minX) | +(y0 === minY) | +(x1 === maxX) | +(y1 === maxY);
      // A NaN side may come from the child that left: refit it, or it never prunes again.
      const nan = +(minX !== minX) | +(minY !== minY) | +(maxX !== maxX) | +(maxY !== maxY);
      if (!(touched | nan) || !this.refit(n)) return;
      x0 = box[b] === minX ? NaN : minX;
      y0 = box[b + 1] === minY ? NaN : minY;
      x1 = box[b + 2] === maxX ? NaN : maxX;
      y1 = box[b + 3] === maxY ? NaN : maxY;
    }
  }

  /** Guttman 1984 CondenseTree. */
  public detach(e: number): void {
    const kids = this.nKids;
    const count = this.nCount;
    const parent = this.nParent;
    const stride = this.stride;
    const min = this.min;
    const orphans = this.orphans;
    let node = this.eLeaf[e];
    removeKid(kids, count, stride, node, e);
    let box = this.eBox;
    let gone = e;
    // Counted, not emptied: setting an array's length is a runtime call.
    let len = 0;
    for (let p = parent[node]; p >= 0 && count[node] < min; p = parent[node]) {
      removeKid(kids, count, stride, p, node);
      const level = this.nHeight[node];
      for (let i = node * stride, end = i + count[node]; i < end; i++) {
        orphans[len++] = kids[i];
        orphans[len++] = level;
      }
      this.freeNode(node);
      box = this.nBox;
      gone = node;
      node = p;
    }
    const b = gone << 2;
    this.shrink(node, box[b], box[b + 1], box[b + 2], box[b + 3]);
    for (let i = 0; i < len; i += 2) this.place(orphans[i], orphans[i + 1]);
    let root = this.root;
    while (this.nHeight[root] > 1 && this.nCount[root] === 1) {
      const child = this.nKids[root * stride];
      this.freeNode(root);
      this.nParent[child] = -1;
      root = child;
    }
    this.root = root;
  }
}
