import {findOrNextLower, first, next, prev} from '../util';
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
    /**
     * Minimum node. The node with the smallest key in the tree.
     */
    public min: ITreeNode<K, V> | undefined = undefined;
    /**
     * Root node. Typically approximates the middle of the tree.
     */
    public root: ITreeNode<K, V> | undefined = undefined;
    /**
     * Maximum node. The node with the largest key in the tree.
     */
    public max: ITreeNode<K, V> | undefined = undefined;
    /**
     * Comparator function. Used to relatively compare keys.
     */
    public readonly comparator: Comparator<K>;

    constructor(comparator?: Comparator<K>) {
      this.comparator = comparator || defaultComparator;
    }

    public set(k: K, v: V): SonicNodePublicReference<ITreeNode<K, V>> {
      const root = this.root;
      if (root === undefined) {
        this._size = 1;
        return this.root = this.min = this.max = new Node<K, V>(k, v);
      }
      const comparator = this.comparator;
      const max = this.max!;
      if (comparator(k, max.k) > 0) {
        const node = this.max = new Node<K, V>(k, v);
        this.root = insertRight(root, node, max) as ITreeNode<K, V>;
        this._size++;
        return node;
      }
      const min = this.min!;
      if (comparator(k, min.k) < 0) {
        const node = this.min = new Node<K, V>(k, v);
        this.root = insertLeft(root, node, min) as ITreeNode<K, V>;
        this._size++;
        return node;
      }
      let curr: ITreeNode<K, V> | undefined = root;
      do {
        const cmp = comparator(k, curr.k);
        if (cmp < 0) {
          const l = curr.l;
          if (l === undefined) {
            const node = new Node<K, V>(k, v);
            this.root = insertLeft(root, node, curr) as ITreeNode<K, V>;
            this._size++;
            return node;
          }
          curr = l as ITreeNode<K, V>;
        } else if (cmp > 0) {
          const r = curr.r;
          if (r === undefined) {
            const node = new Node<K, V>(k, v);
            this.root = insertRight(root, node, curr) as ITreeNode<K, V>;
            this._size++;
            return node;
          }
          curr = r as ITreeNode<K, V>;
        } else return (curr.v = v), curr;
      } while (true);
    }

    public find(k: K): SonicNodePublicReference<ITreeNode<K, V>> | undefined {
      const comparator = this.comparator;
      let curr: ITreeNode<K, V> | undefined = this.root;
      while (curr) {
        const cmp = comparator(k, curr.k);
        if (!cmp) return curr;
        curr = cmp < 0 ? (curr.l as ITreeNode<K, V>) : (curr.r as ITreeNode<K, V>);
      }
      return;
    }

    public get(k: K): V | undefined {
      return this.find(k)?.v;
    }

    public del(k: K): boolean {
      const node = this.find(k) as ITreeNode<K, V>;
      if (!node) return false;
      if (node === this.max) this.max = prev(node);
      else if (node === this.min) this.min = next(node);
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
      return this.min;
    }

    public last(): ITreeNode<K, V> | undefined {
      return this.max;
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
