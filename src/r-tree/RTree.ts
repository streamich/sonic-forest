import {Arena} from './Arena';
import {bulkBuild} from './bulk';
import {MinQueue} from './MinQueue';
import {Rect} from './Rect';
import type {RTreeNode} from './RTreeNode';
import {nearestIn, searchIn} from './query';
import {snapshot} from './snapshot';
import type {IRect, SpatialIndex} from './types';

const putRect = (boxes: Float64Array, i: number, r: IRect): void => {
  const b = i << 2;
  boxes[b] = r.minX;
  boxes[b + 1] = r.minY;
  boxes[b + 2] = r.maxX;
  boxes[b + 3] = r.maxY;
};

// TODO: implement Printable from tree-dump, as the other sonic-forest trees do.
/**
 * Dynamic R-tree, after rbush (MIT), stored as a struct of typed arrays. It
 * never rebuilds itself: once {@link needsRebuild} turns true, the owner
 * calls {@link rebuild} while idle.
 */
export class RTree<K = unknown> implements SpatialIndex<K> {
  public version = 0;
  /** Inserts, removes and re-placements since the last bulk build. */
  public churn = 0;
  public readonly maxEntries: number;
  public readonly minEntries: number;
  private a: Arena<K>;
  private slots = new Map<K, number>();
  // Query scratch.
  private readonly stack: number[] = [];
  private readonly queue = new MinQueue();
  private readonly near = new MinQueue();
  private readonly held: number[] = [];

  /** @param maxEntries fanout, clamped to 4..65535 */
  constructor(maxEntries: number = 9) {
    // not Math.max(4, f), which keeps a NaN
    const f = Math.floor(maxEntries);
    const max = f >= 4 ? Math.min(0xffff, f) : 4;
    this.maxEntries = max;
    this.minEntries = Math.max(2, Math.ceil(max * 0.4));
    this.a = new Arena<K>(max, this.minEntries);
  }

  /** A copy of the tree, built in O(n) on every read, for walks and debugging. */
  public get root(): RTreeNode<K> {
    return snapshot(this.a);
  }

  public get size(): number {
    return this.slots.size;
  }

  public get needsRebuild(): boolean {
    const size = this.slots.size;
    return size > this.maxEntries && this.churn >= size;
  }

  public has(id: K): boolean {
    return this.slots.has(id);
  }

  public insert(id: K, r: IRect): void {
    const s = this.slots.get(id);
    if (s === undefined) this.add(id, r);
    else this.move(s, r);
  }

  public update(id: K, r: IRect): void {
    this.insert(id, r);
  }

  public remove(id: K): void {
    const slots = this.slots;
    const s = slots.get(id);
    if (s === undefined) return;
    slots.delete(id);
    const a = this.a;
    a.detach(s);
    a.freeEntry(s);
    const size = slots.size;
    // Down to one leaf in grown arrays: an O(maxEntries) rebuild releases them.
    if (size <= this.maxEntries && a.eLeaf.length > 4 * size + 64) {
      const churn = this.churn;
      this.rebuild();
      this.churn = churn;
    }
    this.version++;
    this.churn++;
  }

  public load(ids: readonly K[], rects: readonly IRect[]): void {
    const n = ids.length;
    if (!n) return;
    const slots = this.slots;
    // A batch smaller than the tree costs less inserted one by one than rebuilt in.
    if (n < slots.size) {
      for (let i = 0; i < n; i++) this.insert(ids[i], rects[i]);
      return;
    }
    // TODO: bump only when an id is new or a rectangle differs, as LinearIndex.load does, once a consumer keys caches on version.
    this.version++;
    if (!slots.size) {
      const boxes = new Float64Array(n * 4);
      for (let i = 0; i < n; i++) putRect(boxes, i, rects[i]);
      if (this.build(ids, boxes, n, true)) return;
    }
    // Entries keep their Map order and new ids follow in input order: the order a rebuild sees.
    const all: K[] = [];
    const boxes = new Float64Array((slots.size + n) * 4);
    const at = new Int32Array(this.a.eLeaf.length);
    let len = this.gather(all, boxes, at);
    try {
      for (let i = 0; i < n; i++) {
        const id = ids[i];
        const s = slots.get(id);
        let j: number;
        // Until the build, a new id maps to the complement of its index in `all`.
        if (s === undefined) {
          slots.set(id, ~(j = len++));
          all[j] = id;
        } else j = s < 0 ? ~s : at[s];
        putRect(boxes, j, rects[i]);
      }
    } catch (error) {
      slots.forEach((s, id) => {
        if (s < 0) slots.delete(id);
      });
      throw error;
    }
    this.build(all, boxes, len, false);
  }

  /** Results and `version` stay as they are. */
  public rebuild(): void {
    const all: K[] = [];
    const boxes = new Float64Array(this.slots.size * 4);
    this.build(all, boxes, this.gather(all, boxes, new Int32Array(this.a.eLeaf.length)), false);
  }

  public clear(): void {
    this.churn = 0;
    if (!this.slots.size) return;
    this.slots.clear();
    this.a = new Arena<K>(this.maxEntries, this.minEntries);
    this.version++;
  }

  public search(r: IRect, out: K[]): void {
    searchIn(this.a, r, out, this.stack);
  }

  public nearest(x: number, y: number, k: number, maxDist2: number, out: K[]): void {
    // A fractional k would never fill the bounded heap, which would then drop nearer entries.
    const n = Math.floor(k);
    if (n > 0 && this.slots.size) nearestIn(this.a, x, y, n, maxDist2, out, this.queue, this.near, this.held);
  }

  /** Hands `fn` one rectangle, overwritten for every entry: copy it to keep it. */
  public forEach(fn: (id: K, r: IRect) => void): void {
    const a = this.a;
    // One per call: a forEach nested in `fn` must not overwrite the outer one.
    const r = new Rect();
    this.slots.forEach((s, id) => {
      const box = a.eBox;
      const b = s << 2;
      r.minX = box[b];
      r.minY = box[b + 1];
      r.maxX = box[b + 2];
      r.maxY = box[b + 3];
      fn(id, r);
    });
  }

  /** Copies out every entry in Map order: its id to `all`, its box to `boxes`, its index there to `at[slot]`. */
  private gather(all: K[], boxes: Float64Array, at: Int32Array): number {
    const eBox = this.a.eBox;
    let i = 0;
    this.slots.forEach((s, id) => {
      at[s] = i;
      all.push(id);
      const b = s << 2;
      const p = i++ << 2;
      boxes[p] = eBox[b];
      boxes[p + 1] = eBox[b + 1];
      boxes[p + 2] = eBox[b + 2];
      boxes[p + 3] = eBox[b + 3];
    });
    return i;
  }

  /**
   * Replaces the tree, and the Map, with ones bulk loaded from `all` and
   * their `boxes`, sized to fit.
   *
   * @param fresh `all` may repeat an id: then nothing changes, and this returns false
   */
  private build(all: readonly K[], boxes: Float64Array, n: number, fresh: boolean): boolean {
    const a = new Arena<K>(this.maxEntries, this.minEntries, n);
    const from = bulkBuild(a, all, boxes, n);
    const slot = new Int32Array(n);
    for (let j = 0; j < n; j++) slot[from[j]] = j;
    // In the order of `all`, which a later rebuild follows.
    const slots = new Map<K, number>();
    for (let i = 0; i < n; i++) {
      slots.set(all[i], slot[i]);
      if (fresh && slots.size === i) return false;
    }
    this.slots = slots;
    this.a = a;
    this.churn = 0;
    return true;
  }

  private add(id: K, r: IRect): void {
    const a = this.a;
    const s = a.newEntry(id, r);
    this.slots.set(id, s);
    a.place(s, 1);
    this.version++;
    this.churn++;
  }

  private move(s: number, r: IRect): void {
    const a = this.a;
    const box = a.eBox;
    const b = s << 2;
    const {minX, minY, maxX, maxY} = r;
    const x0 = box[b];
    const y0 = box[b + 1];
    const x1 = box[b + 2];
    const y1 = box[b + 3];
    if (x0 === minX && y0 === minY && x1 === maxX && y1 === maxY) return;
    const leaf = a.eLeaf[s];
    const nBox = a.nBox;
    const l = leaf << 2;
    if (minX >= nBox[l] && maxX <= nBox[l + 2] && minY >= nBox[l + 1] && maxY <= nBox[l + 3]) {
      box[b] = minX;
      box[b + 1] = minY;
      box[b + 2] = maxX;
      box[b + 3] = maxY;
      // `x0 + NaN`, not a ternary of NaN and `x0`, which would box both.
      a.shrink(
        leaf,
        x0 + (minX === x0 ? NaN : 0),
        y0 + (minY === y0 ? NaN : 0),
        x1 + (maxX === x1 ? NaN : 0),
        y1 + (maxY === y1 ? NaN : 0),
      );
    } else {
      a.detach(s);
      a.setBox(s, r);
      a.place(s, 1);
      this.churn++;
    }
    this.version++;
  }
}
