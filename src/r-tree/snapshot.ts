import type {Arena} from './Arena';
import {Rect} from './Rect';
import {RTreeEntry} from './RTreeEntry';
import {RTreeNode} from './RTreeNode';

const boxAt = <T extends Rect>(box: Float64Array, s: number, out: T): T => {
  const b = s << 2;
  out.minX = box[b];
  out.minY = box[b + 1];
  out.maxX = box[b + 2];
  out.maxY = box[b + 3];
  return out;
};

/**
 * Copies the tree in `a` into objects. Every `parent` comes from the arena's
 * own links, and a slot linked twice yields one shared object, so a walk of
 * the copy checks the arena.
 */
export const snapshot = <K>(a: Arena<K>): RTreeNode<K> => {
  const nodes: RTreeNode<K>[] = [];
  const entries: RTreeEntry<K>[] = [];
  const node = (n: number): RTreeNode<K> => (nodes[n] ??= boxAt(a.nBox, n, new RTreeNode<K>(a.nHeight[n], [])));
  const entry = (e: number): RTreeEntry<K> => {
    let s = entries[e];
    if (!s) {
      s = entries[e] = new RTreeEntry<K>(a.eIds[e] as K, boxAt(a.eBox, e, new Rect()));
      s.parent = node(a.eLeaf[e]);
    }
    return s;
  };
  const walk = (n: number): RTreeNode<K> => {
    const s = node(n);
    const p = a.nParent[n];
    s.parent = p < 0 ? null : node(p);
    const leaf = a.nHeight[n] === 1;
    for (let i = n * a.stride, end = i + a.nCount[n]; i < end; i++)
      s.children.push(leaf ? entry(a.nKids[i]) : walk(a.nKids[i]));
    return s;
  };
  return walk(a.root);
};
