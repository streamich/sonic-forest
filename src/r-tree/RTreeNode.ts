import {Rect} from './Rect';
import type {RTreeEntry} from './RTreeEntry';

export type RTreeChild<K = unknown> = RTreeNode<K> | RTreeEntry<K>;

/** Height 1 holds entries; a parent is one higher than its children. */
export class RTreeNode<K = unknown> extends Rect {
  public parent: RTreeNode<K> | null = null;

  constructor(
    public height: number,
    public children: RTreeChild<K>[],
  ) {
    super(Infinity, Infinity, -Infinity, -Infinity);
  }
}
