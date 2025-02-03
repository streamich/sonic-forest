import {findOrNextLower, first, next} from '../util';
import {printTree} from '../print/printTree';
import type {Comparator, HeadlessNode, ITreeNode, SonicMap, SonicNodePublicReference} from '../types';

const defaultComparator = (a: unknown, b: unknown) => (a === b ? 0 : (a as any) < (b as any) ? -1 : 1);

export const createMap = (
  Node: new <K, V>(k: K, v: V) => ITreeNode<K, V>,
  insert: <K, N extends ITreeNode<K, unknown>>(root: N | undefined, node: N, comparator: Comparator<K>) => N,
  insertLeft: <K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N,
  insertRight: <K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N,
  remove: <K, N extends ITreeNode<K, unknown>>(root: N | undefined, n: N) => N | undefined,
  print: <K, V>(node: undefined | HeadlessNode | ITreeNode<K, V>, tab?: string) => string,
) => {
  class SonicMapImpl<K, V> implements SonicMap<K, V, ITreeNode<K, V>> {
    public root: ITreeNode<K, V> | undefined = undefined;
    public readonly comparator: Comparator<K>;
  
    constructor(comparator?: Comparator<K>) {
      this.comparator = comparator || defaultComparator;
    }
  
    public insert(k: K, v: V): SonicNodePublicReference<ITreeNode<K, V>> {
      const item = new Node<K, V>(k, v);
      this.root = insert(this.root, item, this.comparator);
      this._size++;
      return item;
    }
  
    public set(k: K, v: V): SonicNodePublicReference<ITreeNode<K, V>> {
      const root = this.root;
      if (!root) return this.insert(k, v);
      const comparator = this.comparator;
      let next: ITreeNode<K, V> | undefined = root,
        curr: ITreeNode<K, V> | undefined = next;
      let cmp: number = 0;
      do {
        curr = next;
        cmp = comparator(k, curr.k);
        if (cmp === 0) return (curr.v = v), curr;
      } while ((next = cmp < 0 ? (curr.l as ITreeNode<K, V>) : (curr.r as ITreeNode<K, V>)));
      const node = new Node<K, V>(k, v);
      this.root =
        cmp < 0 ? (insertLeft(root, node, curr) as ITreeNode<K, V>) : (insertRight(root, node, curr) as ITreeNode<K, V>);
      this._size++;
      return node;
    }
  
    public find(k: K): SonicNodePublicReference<ITreeNode<K, V>> | undefined {
      const comparator = this.comparator;
      let curr: ITreeNode<K, V> | undefined = this.root;
      while (curr) {
        const cmp = comparator(k, curr.k);
        if (cmp === 0) return curr;
        curr = cmp < 0 ? (curr.l as ITreeNode<K, V>) : (curr.r as ITreeNode<K, V>);
      }
      return undefined;
    }
  
    public get(k: K): V | undefined {
      return this.find(k)?.v;
    }
  
    public del(k: K): boolean {
      const node = this.find(k);
      if (!node) return false;
      this.root = remove(this.root, node as ITreeNode<K, V>);
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
  
    public getOrNextLower(k: K): ITreeNode<K, V> | undefined {
      return (findOrNextLower(this.root, k, this.comparator) as ITreeNode<K, V>) || undefined;
    }
  
    public forEach(fn: (node: ITreeNode<K, V>) => void): void {
      let curr = this.first();
      if (!curr) return;
      do fn(curr!);
      while ((curr = next(curr as HeadlessNode) as ITreeNode<K, V> | undefined));
    }
  
    public first(): ITreeNode<K, V> | undefined {
      const root = this.root;
      return root ? first(root) : undefined;
    }
  
    public readonly next = next;
  
    public iterator0(): () => undefined | ITreeNode<K, V> {
      let curr = this.first();
      return () => {
        if (!curr) return;
        const value = curr;
        curr = next(curr as HeadlessNode) as ITreeNode<K, V> | undefined;
        return value;
      };
    }
  
    public iterator(): Iterator<ITreeNode<K, V>> {
      const iterator = this.iterator0();
      return {
        next: () => {
          const value = iterator();
          const res = <IteratorResult<ITreeNode<K, V>>>{value, done: !value};
          return res;
        },
      };
    }
  
    public entries(): IterableIterator<ITreeNode<K, V>> {
      return <any>{[Symbol.iterator]: () => this.iterator()};
    }
  
    public toString(tab: string): string {
      return this.constructor.name + printTree(tab, [(tab) => print(this.root, tab)]);
    }
  }

  return SonicMapImpl;
};
