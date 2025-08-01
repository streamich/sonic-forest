import {insert, insertLeft, insertRight, remove, print} from './util';
import {createMap} from '../data-types/map';
import type {Comparator, HeadlessNode, ITreeNode, SonicMap} from '../types';
import type {IRbTreeNode} from './types';

/**
 * Red-Black tree node implementation with color tracking.
 * 
 * A Red-Black node stores key-value pairs and maintains color information
 * (red or black) to ensure the tree satisfies Red-Black tree properties
 * for guaranteed O(log n) operations.
 * 
 * @template K - The type of the key
 * @template V - The type of the value
 */
export class RbNode<K, V> implements IRbTreeNode<K, V> {
  /** Parent node reference */
  public p: RbNode<K, V> | undefined = undefined;
  /** Left child node reference */
  public l: RbNode<K, V> | undefined = undefined;
  /** Right child node reference */
  public r: RbNode<K, V> | undefined = undefined;
  /** Color flag: false = red, true = black */
  public b: boolean = false;
  
  /**
   * Creates a new Red-Black tree node.
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
 * High-performance Red-Black tree-based sorted map implementation.
 * 
 * This Red-Black map provides O(log n) insertion, deletion, and lookup operations
 * with guaranteed balance through red-black tree properties. It offers excellent
 * worst-case performance and is suitable for applications requiring predictable
 * operation times.
 * 
 * Red-Black trees maintain the following properties:
 * 1. Every node is either red or black
 * 2. The root is always black
 * 3. No two red nodes are adjacent
 * 4. Every path from root to leaf contains the same number of black nodes
 * 
 * @example
 * ```typescript
 * const map = new RbMap<number, string>();
 * const nodeRef = map.set(1, 'one');
 * console.log(nodeRef.v); // 'one'
 * console.log(map.get(1)); // 'one'
 * map.del(1); // Remove the node
 * ```
 * 
 * @template K - The type of keys stored in the map
 * @template V - The type of values stored in the map
 */
export const RbMap = createMap(
  RbNode,
  insert as <K, N extends ITreeNode<K, unknown>>(root: N | undefined, node: N, comparator: Comparator<K>) => N,
  insertLeft as <K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N,
  insertRight as <K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N,
  remove as <K, N extends ITreeNode<K, unknown>>(root: N | undefined, n: N) => N | undefined,
  print as <K, V>(node: undefined | HeadlessNode | ITreeNode<K, V>, tab?: string) => string,
);

export type RbMap<K, V> = SonicMap<K, V, RbNode<K, V>>;
