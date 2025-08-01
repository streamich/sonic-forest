import {insert, insertLeft, remove, insertRight, print} from './util';
import {printTree} from '../print/printTree';
import {findOrNextLower, first, next} from '../util';
import type {Printable} from '../print/types';
import type {Comparator, HeadlessNode} from '../types';
import type {AvlNodeReference, IAvlTreeNode} from './types';

/**
 * AVL tree node for set implementation (stores only values, no separate keys).
 * 
 * @template V - The type of values stored in the set
 */
export class AvlSetNode<V> implements IAvlTreeNode<V, void> {
  /** Parent node reference */
  public p: AvlSetNode<V> | undefined = undefined;
  /** Left child node reference */
  public l: AvlSetNode<V> | undefined = undefined;
  /** Right child node reference */
  public r: AvlSetNode<V> | undefined = undefined;
  /** Balance factor: height(right) - height(left) */
  public bf: number = 0;
  /** Value is undefined for set nodes (key serves as both key and value) */
  public v: undefined = undefined;
  
  /**
   * Creates a new AVL set node.
   * 
   * @param k - The value to store (serves as both key and value)
   */
  constructor(public readonly k: V) {}
}

const defaultComparator = (a: unknown, b: unknown) => (a === b ? 0 : (a as any) < (b as any) ? -1 : 1);

/**
 * High-performance AVL tree-based sorted set implementation.
 * 
 * This set maintains elements in sorted order and ensures no duplicates.
 * All operations (add, remove, has) are O(log n) due to the self-balancing
 * nature of AVL trees.
 * 
 * @example
 * ```typescript
 * const set = new AvlSet<number>();
 * set.add(3);
 * set.add(1);
 * set.add(2);
 * 
 * console.log(set.has(2)); // true
 * console.log(set.size); // 3
 * 
 * // Iterate in sorted order
 * for (const node of set) {
 *   console.log(node.k); // 1, 2, 3
 * }
 * ```
 * 
 * @template V - The type of values stored in the set
 */
export class AvlSet<V> implements Printable {
  /** Root node of the AVL tree */
  public root: AvlSetNode<V> | undefined = undefined;
  /** Comparator function for ordering values */
  public readonly comparator: Comparator<V>;

  /**
   * Creates a new AVL set instance.
   * 
   * @param comparator - Function to compare values. Defaults to natural ordering.
   */
  constructor(comparator?: Comparator<V>) {
    this.comparator = comparator || defaultComparator;
  }

  private insert(value: V): AvlNodeReference<AvlSetNode<V>> {
    const item = new AvlSetNode<V>(value);
    this.root = insert(this.root, item, this.comparator);
    return item;
  }

  /**
   * Adds a value to the set if it doesn't already exist.
   * 
   * @param value - The value to add to the set
   * @returns Reference to the node containing the value (existing or newly created)
   */
  public add(value: V): AvlNodeReference<AvlSetNode<V>> {
    const root = this.root;
    if (!root) return this.insert(value);
    const comparator = this.comparator;
    let next: AvlSetNode<V> | undefined = root,
      curr: AvlSetNode<V> | undefined = next;
    let cmp: number = 0;
    do {
      curr = next;
      cmp = comparator(value, curr.k);
      if (cmp === 0) return curr;
    } while ((next = cmp < 0 ? (curr.l as AvlSetNode<V>) : (curr.r as AvlSetNode<V>)));
    const node = new AvlSetNode<V>(value);
    this.root =
      cmp < 0 ? (insertLeft(root, node, curr) as AvlSetNode<V>) : (insertRight(root, node, curr) as AvlSetNode<V>);
    return node;
  }

  private find(k: V): AvlNodeReference<AvlSetNode<V>> | undefined {
    const comparator = this.comparator;
    let curr: AvlSetNode<V> | undefined = this.root;
    while (curr) {
      const cmp = comparator(k, curr.k);
      if (cmp === 0) return curr;
      curr = cmp < 0 ? (curr.l as AvlSetNode<V>) : (curr.r as AvlSetNode<V>);
    }
    return undefined;
  }

  public del(k: V): void {
    const node = this.find(k);
    if (!node) return;
    this.root = remove(this.root, node as AvlSetNode<V>);
  }

  public clear(): void {
    this.root = undefined;
  }

  public has(k: V): boolean {
    return !!this.find(k);
  }

  public size(): number {
    const root = this.root;
    if (!root) return 0;
    let curr = first(root);
    let size = 1;
    while ((curr = next(curr as HeadlessNode) as AvlSetNode<V> | undefined)) size++;
    return size;
  }

  public isEmpty(): boolean {
    return !this.root;
  }

  public getOrNextLower(k: V): AvlSetNode<V> | undefined {
    return (findOrNextLower(this.root, k, this.comparator) as AvlSetNode<V>) || undefined;
  }

  public forEach(fn: (node: AvlSetNode<V>) => void): void {
    let curr = this.first();
    if (!curr) return;
    do fn(curr!);
    while ((curr = next(curr as HeadlessNode) as AvlSetNode<V> | undefined));
  }

  public first(): AvlSetNode<V> | undefined {
    const root = this.root;
    return root ? first(root) : undefined;
  }

  public readonly next = next;

  public iterator0(): () => undefined | AvlSetNode<V> {
    let curr = this.first();
    return () => {
      if (!curr) return undefined;
      const value = curr;
      curr = next(curr as HeadlessNode) as AvlSetNode<V> | undefined;
      return value;
    };
  }

  public iterator(): Iterator<AvlSetNode<V>> {
    const iterator = this.iterator0();
    return {
      next: () => {
        const value = iterator();
        const res = <IteratorResult<AvlSetNode<V>>>{value, done: !value};
        return res;
      },
    };
  }

  public entries(): IterableIterator<AvlSetNode<V>> {
    return <any>{[Symbol.iterator]: () => this.iterator()};
  }

  public toString(tab: string): string {
    return this.constructor.name + printTree(tab, [(tab) => print(this.root, tab)]);
  }
}
