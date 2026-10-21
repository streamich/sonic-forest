import {bulkBuild} from './bulk';
import {MinQueue} from './MinQueue';
import {RTreeEntry} from './RTreeEntry';
import {type RTreeChild, RTreeNode} from './RTreeNode';
import {split} from './split';
import type {IRect, SpatialIndex} from './types';
import {enlargedArea, pointDist2} from './util';

const removeChild = <K>(ch: RTreeChild<K>[], c: RTreeChild<K>): void => {
  const i = ch.indexOf(c);
  ch[i] = ch[ch.length - 1];
  ch.pop();
};

/** Guttman 1984 ChooseLeaf. */
const chooseChild = <K>(node: RTreeNode<K>, r: IRect): RTreeNode<K> => {
  const ch = node.children as RTreeNode<K>[];
  let best = ch[0];
  let minEnlargement = Infinity;
  let minArea = Infinity;
  for (let i = 0, n = ch.length; i < n; i++) {
    const c = ch[i];
    const area = c.area;
    const enlargement = enlargedArea(c, r) - area;
    if (enlargement < minEnlargement || (enlargement === minEnlargement && area < minArea)) {
      minEnlargement = enlargement;
      minArea = area;
      best = c;
    }
  }
  return best;
};

const collect = <K>(node: RTreeNode<K>, out: K[]): void => {
  const ch = node.children;
  const n = ch.length;
  if (node.height === 1) for (let i = 0; i < n; i++) out.push((ch[i] as RTreeEntry<K>).id);
  else for (let i = 0; i < n; i++) collect(ch[i] as RTreeNode<K>, out);
};

// TODO: implement Printable from tree-dump, as the other sonic-forest trees do.
/**
 * Dynamic R-tree, after rbush (MIT). It never rebuilds itself:
 * once {@link needsRebuild} turns true, the owner calls {@link rebuild} while idle.
 */
export class RTree<K = unknown> implements SpatialIndex<K> {
  public version = 0;
  /** Inserts, removes and re-placements since the last bulk build. */
  public churn = 0;
  public readonly maxEntries: number;
  public readonly minEntries: number;
  private _root = new RTreeNode<K>(1, []);
  private readonly entries = new Map<K, RTreeEntry<K>>();
  private readonly stack: RTreeNode<K>[] = [];
  private readonly orphans: RTreeChild<K>[] = [];
  private readonly queue = new MinQueue<RTreeChild<K>>();

  /** @param maxEntries fanout, clamped to at least 4 */
  constructor(maxEntries: number = 9) {
    const max = Math.max(4, Math.floor(maxEntries));
    this.maxEntries = max;
    this.minEntries = Math.max(2, Math.ceil(max * 0.4));
  }

  /** Do not mutate. */
  public get root(): RTreeNode<K> {
    return this._root;
  }

  public get size(): number {
    return this.entries.size;
  }

  public get needsRebuild(): boolean {
    const size = this.entries.size;
    return size > this.maxEntries && this.churn >= size;
  }

  public has(id: K): boolean {
    return this.entries.has(id);
  }

  public insert(id: K, r: IRect): void {
    const e = this.entries.get(id);
    if (e) this.move(e, r);
    else this.add(id, r);
  }

  public update(id: K, r: IRect): void {
    this.insert(id, r);
  }

  public remove(id: K): void {
    const entries = this.entries;
    const e = entries.get(id);
    if (!e) return;
    entries.delete(id);
    this.detach(e);
    this.version++;
    this.churn++;
  }

  public load(ids: readonly K[], rects: readonly IRect[]): void {
    const n = ids.length;
    if (!n) return;
    const entries = this.entries;
    // A batch smaller than the tree costs less inserted one by one than rebuilt in.
    if (n < entries.size) {
      for (let i = 0; i < n; i++) this.insert(ids[i], rects[i]);
      return;
    }
    const all = Array.from(entries.values());
    for (let i = 0; i < n; i++) {
      const id = ids[i];
      const e = entries.get(id);
      if (e) e.setTo(rects[i]);
      else {
        const ne = new RTreeEntry<K>(id, rects[i]);
        entries.set(id, ne);
        all.push(ne);
      }
    }
    this._root = bulkBuild(all, this.maxEntries);
    this.churn = 0;
    // TODO: bump only when an id is new or a rectangle differs, as LinearIndex.load does, once a consumer keys caches on version.
    this.version++;
  }

  /** Results and `version` stay as they are. */
  public rebuild(): void {
    const entries = this.entries;
    if (entries.size) this._root = bulkBuild(Array.from(entries.values()), this.maxEntries);
    this.churn = 0;
  }

  public clear(): void {
    // TODO: also empty the scratch stack, queue and orphans, which pin old nodes and keys until the next query overwrites them.
    this.churn = 0;
    if (!this.entries.size) return;
    this.entries.clear();
    this._root = new RTreeNode<K>(1, []);
    this.version++;
  }

  public search(r: IRect, out: K[]): void {
    const {minX, minY, maxX, maxY} = r;
    const root = this._root;
    if (root.minX > maxX || root.maxX < minX || root.minY > maxY || root.maxY < minY) return;
    const stack = this.stack;
    let sp = 0;
    stack[sp++] = root;
    while (sp > 0) {
      const node = stack[--sp];
      const ch = node.children;
      const n = ch.length;
      if (node.height === 1) {
        for (let i = 0; i < n; i++) {
          const e = ch[i] as RTreeEntry<K>;
          if (e.minX <= maxX && e.maxX >= minX && e.minY <= maxY && e.maxY >= minY) out.push(e.id);
        }
        continue;
      }
      for (let i = 0; i < n; i++) {
        const c = ch[i] as RTreeNode<K>;
        if (c.minX > maxX || c.maxX < minX || c.minY > maxY || c.maxY < minY) continue;
        if (c.minX >= minX && c.maxX <= maxX && c.minY >= minY && c.maxY <= maxY) collect(c, out);
        else stack[sp++] = c;
      }
    }
  }

  public nearest(x: number, y: number, k: number, maxDist2: number, out: K[]): void {
    if (k <= 0 || !this.entries.size) return;
    const q = this.queue;
    q.clear();
    let found = 0;
    let node: RTreeNode<K> | undefined = this._root;
    while (node) {
      const ch = node.children;
      for (let i = 0, n = ch.length; i < n; i++) {
        const c = ch[i];
        const d = pointDist2(c, x, y);
        if (d <= maxDist2) q.push(c, d);
      }
      while (q.peek() instanceof RTreeEntry) {
        out.push((q.pop() as RTreeEntry<K>).id);
        if (++found === k) return;
      }
      node = q.pop() as RTreeNode<K> | undefined;
    }
  }

  public forEach(fn: (id: K, r: IRect) => void): void {
    this.entries.forEach((e, id) => fn(id, e));
  }

  // TODO: one-by-one inserts trail rbush, which keeps no id Map and stores the caller's object; profile both before tuning.
  private add(id: K, r: IRect): void {
    const e = new RTreeEntry<K>(id, r);
    this.entries.set(id, e);
    this.place(e, 1);
    this.version++;
    this.churn++;
  }

  private move(e: RTreeEntry<K>, r: IRect): void {
    if (e.equals(r)) return;
    let node: RTreeNode<K> | null = e.parent;
    if (node.contains(r)) {
      e.setTo(r);
      while (node && node.refit()) node = node.parent;
    } else {
      this.detach(e);
      e.setTo(r);
      this.place(e, 1);
      this.churn++;
    }
    this.version++;
  }

  private place(item: RTreeChild<K>, height: number): void {
    let node = this._root;
    while (node.height > height) node = chooseChild(node, item);
    node.children.push(item);
    item.parent = node;
    for (let n: RTreeNode<K> | null = node; n && !n.contains(item); n = n.parent) n.union(item);
    const max = this.maxEntries;
    const min = this.minEntries;
    while (node.children.length > max) {
      const sibling = split(node, min);
      const parent: RTreeNode<K> | null = node.parent;
      if (!parent) {
        const root = new RTreeNode<K>(node.height + 1, [node, sibling]);
        node.parent = sibling.parent = root;
        root.refit();
        this._root = root;
        return;
      }
      parent.children.push(sibling);
      sibling.parent = parent;
      node = parent;
    }
  }

  /** Guttman 1984 CondenseTree. */
  private detach(e: RTreeEntry<K>): void {
    let node = e.parent;
    removeChild(node.children, e);
    const min = this.minEntries;
    const orphans = this.orphans;
    for (;;) {
      const parent = node.parent;
      if (!parent) {
        node.refit();
        break;
      }
      const ch = node.children;
      if (ch.length < min) {
        removeChild(parent.children, node);
        for (let i = 0, n = ch.length; i < n; i++) orphans.push(ch[i]);
      } else if (!node.refit()) break;
      node = parent;
    }
    for (let i = 0, n = orphans.length; i < n; i++) {
      const o = orphans[i];
      this.place(o, o instanceof RTreeNode ? o.height + 1 : 1);
    }
    orphans.length = 0;
    let root = this._root;
    while (root.height > 1 && root.children.length === 1) {
      root = root.children[0] as RTreeNode<K>;
      root.parent = null;
    }
    this._root = root;
  }
}
