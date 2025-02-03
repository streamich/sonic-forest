import {insert, insertLeft, insertRight, remove, print} from './util';
import {createMap} from '../data-types/map';
import type {Comparator, HeadlessNode, ITreeNode} from '../types';
import type {IAvlTreeNode} from './types';

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

export const AvlMap = createMap(
  AvlNode,
  insert as (<K, N extends ITreeNode<K, unknown>>(root: N | undefined, node: N, comparator: Comparator<K>) => N),
  insertLeft as (<K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N),
  insertRight as (<K, N extends ITreeNode<K, unknown>>(root: N, node: N, parent: N) => N),
  remove as (<K, N extends ITreeNode<K, unknown>>(root: N | undefined, n: N) => N | undefined),
  print as (<K, V>(node: undefined | HeadlessNode | ITreeNode<K, V>, tab?: string) => string),
);
