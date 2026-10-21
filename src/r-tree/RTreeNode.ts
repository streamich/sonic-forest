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

  /** @returns whether the box changed */
  public refit(): boolean {
    const ch = this.children;
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (let i = 0, n = ch.length; i < n; i++) {
      const c = ch[i];
      if (c.minX < minX) minX = c.minX;
      if (c.minY < minY) minY = c.minY;
      if (c.maxX > maxX) maxX = c.maxX;
      if (c.maxY > maxY) maxY = c.maxY;
    }
    if (minX === this.minX && minY === this.minY && maxX === this.maxX && maxY === this.maxY) return false;
    this.minX = minX;
    this.minY = minY;
    this.maxX = maxX;
    this.maxY = maxY;
    return true;
  }
}
