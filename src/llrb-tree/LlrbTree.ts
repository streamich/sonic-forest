import {next} from '../util';
import {printTree} from '../print/printTree';
import {print} from '../red-black';
import type {Comparator, SonicMap} from '../types';

export class LlrbNode<K, V> {
  /** Parent. */
  public p: LlrbNode<K, V> | undefined = undefined;
  /** Left. */
  public l: LlrbNode<K, V> | undefined = undefined;
  /** Right. */
  public r: LlrbNode<K, V> | undefined = undefined;

  constructor(
    /** Node key. */
    public readonly k: K,
    /** Node value. */
    public v: V,
    /** Whether the node is "black". */
    public b: boolean,
  ) {}
}

const defaultComparator = (a: unknown, b: unknown) =>
  (a === b ? 0 : (a as any) < (b as any) ? -1 : 1);

export class LlrbTree<K, V> implements SonicMap<K, V, LlrbNode<K, V>> {
  public min: LlrbNode<K, V> | undefined = undefined;
  public root: LlrbNode<K, V> | undefined = undefined;
  public max: LlrbNode<K, V> | undefined = undefined;
  protected _size: number = 0;

  constructor(public readonly comparator: Comparator<K> = defaultComparator) {}

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
    const root = this.root;
    if (!root) {
      const item = new LlrbNode<K, V>(k, v, true);
      this.min = this.max = this.root = item;
      this._size = 1;
      return item;
    }
    let p = root;
    const comparator = this.comparator;
    const min = this.min!;
    let cmp: number;
    cmp = comparator(k, min.k);
    // TODO: perf: maybe check min instanceof LlrbNode
    if (cmp < 0) {
      this.min = p = new LlrbNode<K, V>(k, v, false);
      p.p = min;
      min.l = p;
      this._size++;
      if (!min.b) this._fixRRB(p, min);
      return p;
    }
    const max = this.max!;
    cmp = comparator(k, max.k);
    // TODO: perf: maybe check max instanceof LlrbNode
    if (cmp > 0) {
      this.max = p = new LlrbNode<K, V>(k, v, false);
      p.p = max;
      max.r = p;
      this._size++;
      this._fix(p);
      return p;
    }
    while (true) {
      cmp = comparator(k, p.k);
      if (cmp < 0) {
        const l = p.l;
        if (!l) {
          const n = new LlrbNode<K, V>(k, v, false);
          n.p = p;
          p.l = n;
          this._size++;
          if (!p.b) this._fixRRB(n, p);
          return n;
        }
        p = l;
      } else if (cmp > 0) {
        const r = p.r;
        if (!r) {
          const n = new LlrbNode<K, V>(k, v, false);
          n.p = p;
          p.r = n;
          this._size++;
          this._fix(n);
          return n;
        }
        p = r;
      } else {
        p.v = v;
        return p;
      }
    }
  }

  private _fixRRB(n: LlrbNode<K, V>, p: LlrbNode<K, V>): void {
    const g = p.p!;
    const s = p.r;
    const gp = g.p;
    p.p = gp;
    p.r = g;
    g.p = p;
    g.l = s;
    if (s) s.p = g;
    n.b = true;
    if (!gp) this.root = p;
    this._fix(p);
  }

  private _fixBRR(n: LlrbNode<K, V>, p: LlrbNode<K, V>): void {
    const g = p.p!;
    const nl = n.l;
    g.l = n;
    n.p = g;
    n.l = p;
    p.p = n;
    p.r = nl;
    if (nl) nl.p = p;
    this._fixRRB(p, n);
  }

  private _fixBBR(n: LlrbNode<K, V>, p: LlrbNode<K, V>): void {
    const g = p.p;
    const nl = n.l;
    n.p = g;
    p.p = n;
    n.l = p;
    p.r = nl;
    if (g) {
      if (g.l === p) g.l = n; else g.r = n;
    } else this.root = n;
    if (nl) nl.p = p;
    p.b = false;
    n.b = true;
  }

  private _fix(n: LlrbNode<K, V>): void {
    const p = n.p;
    if (!p) {
      n.b = true;
      return;
    }
    const isLeftChild = p.l === n;
    if (isLeftChild) {
      if (p.b) return;
      this._fixRRB(n, p);
      return;
    }
    const s = p.l;
    const siblingIsBlack = !s || s.b;
    if (siblingIsBlack) {
      if (p.b) {
        this._fixBBR(n, p);
        return;
      } else {
        this._fixBRR(n, p);
        return;
      }
    } else { // Case R-B-R
      p.b = false;
      s!.b = true;
      n.b = true;
      this._fix(p);
      return;
    }
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
    return this._size;
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
    return this.constructor.name + printTree(tab, [(tab) => print(this.root, tab)]);
  }
}
