import {Rect} from './Rect';
import {type RTreeChild, RTreeNode} from './RTreeNode';
import type {IRect} from './types';
import {margin, overlapArea} from './util';

const byMinX = (a: IRect, b: IRect): number => a.minX - b.minX;
const byMinY = (a: IRect, b: IRect): number => a.minY - b.minY;

const left = new Rect();
const right = new Rect();

const unionRange = <K>(ch: RTreeChild<K>[], lo: number, hi: number, out: Rect): Rect => {
  out.empty();
  for (let i = lo; i < hi; i++) out.union(ch[i]);
  return out;
};

const marginSum = <K>(ch: RTreeChild<K>[], m: number): number => {
  const n = ch.length;
  unionRange(ch, 0, m, left);
  let sum = margin(left);
  for (let i = m; i < n - m; i++) sum += margin(left.union(ch[i]));
  unionRange(ch, n - m, n, right);
  sum += margin(right);
  for (let i = n - m - 1; i >= m; i--) sum += margin(right.union(ch[i]));
  return sum;
};

const splitIndex = <K>(ch: RTreeChild<K>[], m: number): number => {
  const n = ch.length;
  let best = m;
  let minOverlap = Infinity;
  let minArea = Infinity;
  for (let i = m; i <= n - m; i++) {
    unionRange(ch, 0, i, left);
    unionRange(ch, i, n, right);
    const overlap = overlapArea(left, right);
    const area = left.area + right.area;
    if (overlap < minOverlap || (overlap === minOverlap && area < minArea)) {
      minOverlap = overlap;
      minArea = area;
      best = i;
    }
  }
  return best;
};

/**
 * The R*-tree split of Beckmann et al. 1990, sorting by the lower bound only.
 *
 * @param m minimum fill; the node holds at least `2 * m` children.
 */
export const split = <K>(node: RTreeNode<K>, m: number): RTreeNode<K> => {
  const ch = node.children;
  ch.sort(byMinX);
  const xMargin = marginSum(ch, m);
  ch.sort(byMinY);
  if (xMargin < marginSum(ch, m)) ch.sort(byMinX);
  const moved = ch.splice(splitIndex(ch, m));
  const sibling = new RTreeNode<K>(node.height, moved);
  for (let i = 0, n = moved.length; i < n; i++) moved[i].parent = sibling;
  node.refit();
  sibling.refit();
  return sibling;
};
