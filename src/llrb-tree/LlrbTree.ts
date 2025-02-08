import {next} from '../util';
import type {Comparator, SonicMap} from '../types';

export class LlrbNode<K, V> {
  /** Parent. */
  public p: LlrbNode<K, V> | undefined = undefined;
  /** Left. */
  public l: LlrbNode<K, V> | undefined = undefined;
  /** Right. */
  public r: LlrbNode<K, V> | undefined = undefined;
  /** Number of nodes in the subtree rooted at this node. */
  public N: number = 1;

  constructor(
    /** Node key. */
    public readonly k: K,
    /** Node value. */
    public v: V,
    /** Whether the node is "black". */
    public b: 0 | 1,
  ) {}
}

const defaultComparator = (a: unknown, b: unknown) =>
  (a === b ? 0 : (a as any) < (b as any) ? -1 : 1);

const rotateLeft = <K, V>(h: LlrbNode<K, V>): LlrbNode<K, V> => {
  const x = h.r!;
  h.r = x.l;
  x.l = h;
  x.b = h.b;
  h.b = 0;
  x.N = h.N;
  h.N = 1 + (h.l?.N || 0) + (h.r?.N || 0);
  return x;
};

const rotateRight = <K, V>(h: LlrbNode<K, V>): LlrbNode<K, V> => {
  const x = h.l!;
  h.l = x.r;
  x.r = h;
  x.b = h.b;
  h.b = 0;
  x.N = h.N;
  h.N = 1 + (h.l?.N || 0) + (h.r?.N || 0);
  return x;
};

export class LlrbTree<K, V> implements SonicMap<K, V, LlrbNode<K, V>> {
  // public min: LlrbNode<K, V> | undefined = undefined;
  public root: LlrbNode<K, V> | undefined = undefined;
  // public max: LlrbNode<K, V> | undefined = undefined;

  constructor(public readonly comparator: Comparator<K> = defaultComparator) {}

  public put(k: K, v: V): void {
    const root = this.root = this.put0(this.root, k, v);
    root.b = 1;
  }

  public put0(h: LlrbNode<K, V> | undefined, k: K, v: V): LlrbNode<K, V> {
    if (!h) return new LlrbNode(k, v, 0);
    const cmp = this.comparator(k, h.k);
    if (cmp < 0) h.l = this.put0(h.l, k, v);
    else if (cmp > 0) h.r = this.put0(h.r, k, v);
    else h.v = v;
    {
      const hr = h.r;
      if (hr && !hr.b) {
        const hl = h.l;
        if (!hl || hl.b) h = rotateLeft(h);
      }
    }
    {
      const hl = h.l;
      if (hl && !hl.b) {
        const hll = hl.l;
        if (hll && !hll.b) h = rotateRight(h);
      }
    }
    {
      const hl = h.l;
      if (hl && !hl.b) {
        const hr = h.r;
        if (hr && !hr.b) {
          h.b = 1;
          hl.b = 1;
          hr.b = 1;
        }
      }
    }
    h.N = 1 + (h.l?.N || 0) + (h.r?.N || 0);
    return h;
  }

  public insert(k: K, v: V): LlrbNode<K, V> {
    // const root = this.root;
    // if (!root) {
    //   const item = new LlrbNode<K, V>(k, v, 1);
    //   this.min = this.max = this.root = item;
    //   return item;
    // }
    // const comparator = this.comparator;
    // const cmp = comparator(k, root.k);
    // if (cmp < 0) {
    //   const min = this.min!;
    //   const cmp2 = comparator(k, min.k);
    //   if (cmp2 < 0) {
    //     const item = new LlrbNode<K, V>(k, v, 1);
    //     item.l = this.min;
    //     this.min = item;
    //     return item;
    //   }

    // }
    throw new Error('Method not implemented.');
  }

  public set(k: K, v: V): LlrbNode<K, V> {
    // const root = this.root;
    // if (!root) {
    //   const item = new LlrbNode<K, V>(k, v, 1);
    //   this.min = this.max = this.root = item;
    //   this._size = 1;
    //   return item;
    // }
    // const comparator = this.comparator;
    // const cmp = comparator(k, root.k);
    // if (cmp < 0) {
    //   const min = this.min!;
    //   const cmp2 = comparator(k, min.k);
    //   if (cmp2 < 0) {
    //     const item = new LlrbNode<K, V>(k, v, 1);
    //     item.l = this.min;
    //     this.min = item;
    //     this._size++;
    //     return item;
    //   }
    // }
    throw new Error('Method not implemented.');
  }

  public find(k: K): LlrbNode<K, V> | undefined {
    const comparator = this.comparator;
    let curr: LlrbNode<K, V> | undefined = this.root;
    while (curr) {
      const cmp = comparator(k, curr.k);
      if (!cmp) return curr;
      curr = cmp < 0 ? (curr.l as LlrbNode<K, V>) : (curr.r as LlrbNode<K, V>);
    }
    return;
  }

  public get(k: K): V | undefined {
    return this.find(k)?.v;
  }

  public del(k: K): boolean {
    // const node = this.find(k);
    // if (!node) return false;
    // this.root = remove(this.root, node as ITreeNode<K, V>);
    // this._size--;
    // return true;
    throw new Error('Method not implemented.');
  }

  public clear(): void {
    // this.min = this.root = this.max = undefined;
    this.root = undefined;
  }

  public has(k: K): boolean {
    return !!this.find(k);
  }

  public size(): number {
    return this.root?.N || 0;
  }

  public isEmpty(): boolean {
    return !this.root;
  }

  public getOrNextLower(k: K): LlrbNode<K, V> | undefined {
    // return (findOrNextLower(this.root, k, this.comparator) as LlrbNode<K, V>) || undefined;
    throw new Error('Method not implemented.');
  }

  public forEach(fn: (node: LlrbNode<K, V>) => void): void {
    // let curr = this.first();
    // if (!curr) return;
    // do fn(curr!);
    // while ((curr = next(curr as HeadlessNode) as LlrbNode<K, V> | undefined));
    throw new Error('Method not implemented.');
  }

  public first(): LlrbNode<K, V> | undefined {
    // return this.min;
    throw new Error('Method not implemented.');
  }

  public readonly next = next;

  public iterator0(): () => undefined | LlrbNode<K, V> {
    // let curr = this.first();
    // return () => {
    //   if (!curr) return;
    //   const value = curr;
    //   curr = next(curr as HeadlessNode) as LlrbNode<K, V> | undefined;
    //   return value;
    // };
    throw new Error('Method not implemented.');
  }

  public iterator(): Iterator<LlrbNode<K, V>> {
    // const iterator = this.iterator0();
    // return {
    //   next: () => {
    //     const value = iterator();
    //     const res = <IteratorResult<LlrbNode<K, V>>>{value, done: !value};
    //     return res;
    //   },
    // };
    throw new Error('Method not implemented.');
  }

  public entries(): IterableIterator<LlrbNode<K, V>> {
    return <any>{[Symbol.iterator]: () => this.iterator()};
  }

  public toString(tab: string): string {
    // return this.constructor.name + printTree(tab, [(tab) => print(this.root, tab)]);
    throw new Error('Method not implemented.');
  }
}
