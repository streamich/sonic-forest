import {insert, insertLeft, insertRight, remove, print} from './util';
import {printTree} from '../print/printTree';
import {findOrNextLower, first, last, next} from '../util';
import type {Comparator, HeadlessNode, SonicMap} from '../types';
import type {AvlNodeReference, IAvlTreeNode} from './types';

export class AvlNode<K, V> implements IAvlTreeNode<K, V> {
  public p: AvlNode<K, V> | undefined = undefined;
  public l: AvlNode<K, V> | undefined = undefined;
  public r: AvlNode<K, V> | undefined = undefined;
  public bf: number = 0;
  constructor(
    public readonly k: K,
    public v: V,
  ) {}
}

const defaultComparator = (a: unknown, b: unknown) => (a === b ? 0 : (a as any) < (b as any) ? -1 : 1);

export class AvlMap<K, V> implements SonicMap<K, V, AvlNode<K, V>> {
  public root: AvlNode<K, V> | undefined = undefined;
  public readonly comparator: Comparator<K>;

  constructor(comparator?: Comparator<K>) {
    this.comparator = comparator || defaultComparator;
  }

  public set(k: K, v: V): AvlNodeReference<AvlNode<K, V>> {
    const root = this.root;
    if (!root) {
      const item = new AvlNode<K, V>(k, v);
      this.root = insert(this.root, item, this.comparator);
      this._size++;
      return item;
    }
    const comparator = this.comparator;
    let next: AvlNode<K, V> | undefined = root,
      curr: AvlNode<K, V> | undefined = next;
    let cmp: number = 0;
    do {
      curr = next;
      cmp = comparator(k, curr.k);
      if (cmp === 0) return (curr.v = v), curr;
    } while ((next = cmp < 0 ? (curr.l as AvlNode<K, V>) : (curr.r as AvlNode<K, V>)));
    const node = new AvlNode<K, V>(k, v);
    this.root =
      cmp < 0 ? (insertLeft(root, node, curr) as AvlNode<K, V>) : (insertRight(root, node, curr) as AvlNode<K, V>);
    this._size++;
    return node;
  }

  public find(k: K): AvlNodeReference<AvlNode<K, V>> | undefined {
    const comparator = this.comparator;
    let curr: AvlNode<K, V> | undefined = this.root;
    while (curr) {
      const cmp = comparator(k, curr.k);
      if (cmp === 0) return curr;
      curr = cmp < 0 ? (curr.l as AvlNode<K, V>) : (curr.r as AvlNode<K, V>);
    }
    return undefined;
  }

  public get(k: K): V | undefined {
    return this.find(k)?.v;
  }

  public del(k: K): boolean {
    const node = this.find(k);
    if (!node) return false;
    this.root = remove(this.root, node as IAvlTreeNode<K, V>);
    this._size--;
    return true;
  }

  public clear(): void {
    this._size = 0;
    this.root = undefined;
  }

  public has(k: K): boolean {
    return !!this.find(k);
  }

  public _size: number = 0;

  public size(): number {
    return this._size;
  }

  public isEmpty(): boolean {
    return !this.root;
  }

  public getOrNextLower(k: K): AvlNode<K, V> | undefined {
    return (findOrNextLower(this.root, k, this.comparator) as AvlNode<K, V>) || undefined;
  }

  public forEach(fn: (node: AvlNode<K, V>) => void): void {
    let curr = this.first();
    if (!curr) return;
    do fn(curr!);
    while ((curr = next(curr as HeadlessNode) as AvlNode<K, V> | undefined));
  }

  public first(): AvlNode<K, V> | undefined {
    const root = this.root;
    return root ? first(root) : undefined;
  }

  public last(): AvlNode<K, V> | undefined {
    const root = this.root;
    return root ? last(root) : undefined;
  }

  public readonly next = next;

  public iterator0(): () => undefined | AvlNode<K, V> {
    let curr = this.first();
    return () => {
      if (!curr) return;
      const value = curr;
      curr = next(curr as HeadlessNode) as AvlNode<K, V> | undefined;
      return value;
    };
  }

  public iterator(): Iterator<AvlNode<K, V>> {
    const iterator = this.iterator0();
    return {
      next: () => {
        const value = iterator();
        const res = <IteratorResult<AvlNode<K, V>>>{value, done: !value};
        return res;
      },
    };
  }

  public entries(): IterableIterator<AvlNode<K, V>> {
    return <any>{[Symbol.iterator]: () => this.iterator()};
  }

  public toString(tab: string): string {
    return this.constructor.name + printTree(tab, [(tab) => print(this.root, tab)]);
  }
}
