import {insert, insertLeft, insertRight, remove, print} from './util';
import {createMap} from '../data-types/map';
import type {Comparator, HeadlessNode, ITreeNode, SonicMap} from '../types';
import type {IRbTreeNode} from './types';

export class RbNode<K, V> implements IRbTreeNode<K, V> {
  public p: RbNode<K, V> | undefined = undefined;
  public l: RbNode<K, V> | undefined = undefined;
  public r: RbNode<K, V> | undefined = undefined;
  public b: boolean = false;
  constructor(
    public readonly k: K,
    public v: V,
  ) {}
}

export const RbMap = createMap(
  RbNode,
  insert as (<K, N extends ITreeNode<K, unknown>>(root: N | undefined, node: N, comparator: Comparator<K>) => N),
  insertLeft as (<K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N),
  insertRight as (<K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N),
  remove as (<K, N extends ITreeNode<K, unknown>>(root: N | undefined, n: N) => N | undefined),
  print as (<K, V>(node: undefined | HeadlessNode | ITreeNode<K, V>, tab?: string) => string),
);

export type RbMap<K, V> = SonicMap<K, V, RbNode<K, V>>;
