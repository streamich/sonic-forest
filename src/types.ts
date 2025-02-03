import type {Printable} from 'tree-dump';

export interface ITreeNode<K = unknown, V = unknown> {
  /** Parent. */
  p: ITreeNode<K, V> | undefined;
  /** Left. */
  l: ITreeNode<K, V> | undefined;
  /** Right. */
  r: ITreeNode<K, V> | undefined;
  /** Node key. */
  k: K;
  /** Node value. */
  v: V;
}

export interface HeadlessNode {
  p: HeadlessNode | undefined;
  l: HeadlessNode | undefined;
  r: HeadlessNode | undefined;
}

export type Comparator<T> = (a: T, b: T) => number;

export interface SonicNodePublicReference<N extends Pick<ITreeNode, 'k' | 'v'>> {
  /**
   * Immutable read-only key of the node.
   */
  readonly k: N['k'];

  /**
   * Mutable value of the node. The fastest way to update mutate tree nodes
   * is to get hold of ${@link AvlNodeReference} and update this value directly.
   */
  v: N['v'];
}


export interface SonicMap<K, V, Node extends ITreeNode<K, V>> extends Printable {
  root: Node | undefined;
  comparator: Comparator<K>;
  get(k: K): V | undefined;
  del(k: K): boolean;
  clear(): void;
  has(k: K): boolean;
  size(): number;
  isEmpty(): boolean;
  next: <N extends HeadlessNode>(curr: N) => N | undefined;
  insert(k: K, v: V): SonicNodePublicReference<Node>;
  set(k: K, v: V): SonicNodePublicReference<Node>
  first(): SonicNodePublicReference<Node> | undefined;
  find(k: K): SonicNodePublicReference<Node> | undefined;
  getOrNextLower(k: K): SonicNodePublicReference<Node> | undefined;
  forEach(fn: (node: SonicNodePublicReference<Node>) => void): void;
  iterator0(): () => undefined | SonicNodePublicReference<Node>;
  iterator(): Iterator<SonicNodePublicReference<Node>>;
  entries(): IterableIterator<SonicNodePublicReference<Node>>;
}
