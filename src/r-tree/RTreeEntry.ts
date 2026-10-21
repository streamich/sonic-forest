import {Rect} from './Rect';
import type {RTreeNode} from './RTreeNode';
import type {IRect} from './types';

export class RTreeEntry<K = unknown> extends Rect {
  public parent!: RTreeNode<K>;

  constructor(
    public readonly id: K,
    r: IRect,
  ) {
    super(r.minX, r.minY, r.maxX, r.maxY);
  }
}
