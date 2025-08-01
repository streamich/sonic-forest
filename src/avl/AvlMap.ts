import {insert, insertLeft, insertRight, remove, print} from './util';
import {createMap} from '../data-types/map';
import type {Comparator, HeadlessNode, ITreeNode, SonicMap} from '../types';
import type {IAvlTreeNode} from './types';

/**
 * AVL tree node implementation with balance factor tracking.
 *
 * An AVL node stores key-value pairs and maintains balance information
 * to ensure the tree remains height-balanced for optimal performance.
 *
 * @template K - The type of the key
 * @template V - The type of the value
 */
export class AvlNode<K, V> implements IAvlTreeNode<K, V> {
  /** Parent node reference */
  public p: AvlNode<K, V> | undefined = undefined;
  /** Left child node reference */
  public l: AvlNode<K, V> | undefined = undefined;
  /** Right child node reference */
  public r: AvlNode<K, V> | undefined = undefined;
  /** Balance factor: height(right) - height(left), must be -1, 0, or 1 for AVL property */
  public bf: number = 0;

  /**
   * Creates a new AVL tree node.
   *
   * @param k - The immutable key for this node
   * @param v - The mutable value for this node
   */
  constructor(
    public readonly k: K,
    public v: V,
  ) {}
}

/**
 * High-performance AVL tree-based sorted map implementation.
 *
 * This AVL map provides O(log n) insertion, deletion, and lookup operations
 * while maintaining tree balance through automatic rotations. It's optimized
 * for scenarios requiring fast insertions and stable node references.
 *
 * @example
 * ```typescript
 * const map = new AvlMap<number, string>();
 * const nodeRef = map.set(1, 'one');
 * console.log(nodeRef.v); // 'one'
 * nodeRef.v = 'ONE'; // Direct mutation of node value
 * console.log(map.get(1)); // 'ONE'
 * ```
 *
 * @template K - The type of keys stored in the map
 * @template V - The type of values stored in the map
 */
export const AvlMap = createMap(
  AvlNode,
  insert as <K, N extends ITreeNode<K, unknown>>(root: N | undefined, node: N, comparator: Comparator<K>) => N,
  insertLeft as <K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N,
  insertRight as <K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N,
  remove as <K, N extends ITreeNode<K, unknown>>(root: N | undefined, n: N) => N | undefined,
  print as <K, V>(node: undefined | HeadlessNode | ITreeNode<K, V>, tab?: string) => string,
);

export type AvlMap<K, V> = SonicMap<K, V, AvlNode<K, V>>;
