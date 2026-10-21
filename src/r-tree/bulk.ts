import type {RTreeEntry} from './RTreeEntry';
import {type RTreeChild, RTreeNode} from './RTreeNode';
import {multiSelect} from './select';

const cuts: number[] = [];

const part = (lo: number, n: number, j: number, k: number): number => lo + Math.floor((j * n) / k);

const omt = <K>(es: RTreeEntry<K>[], lo: number, hi: number, height: number, M: number): RTreeNode<K> => {
  const n = hi - lo;
  if (height === 1) {
    const children: RTreeChild<K>[] = es.slice(lo, hi);
    const leaf = new RTreeNode<K>(1, children);
    for (let i = 0; i < n; i++) children[i].parent = leaf;
    leaf.refit();
    return leaf;
  }
  let cap = M;
  for (let h = 2; h < height; h++) cap *= M;
  const k = Math.ceil(n / cap);
  const s = Math.ceil(Math.sqrt(k));
  for (let t = 1; t < s; t++) cuts[t - 1] = part(lo, n, Math.floor((t * k) / s), k);
  multiSelect(es, lo, hi, cuts, 0, s - 1, 0);
  const node = new RTreeNode<K>(height, []);
  const children = node.children;
  for (let t = 0; t < s; t++) {
    const j0 = Math.floor((t * k) / s);
    const j1 = Math.floor(((t + 1) * k) / s);
    for (let j = j0 + 1; j < j1; j++) cuts[j - j0 - 1] = part(lo, n, j, k);
    multiSelect(es, part(lo, n, j0, k), part(lo, n, j1, k), cuts, 0, j1 - j0 - 1, 1);
    for (let j = j0; j < j1; j++) {
      const child = omt(es, part(lo, n, j, k), part(lo, n, j + 1, k), height - 1, M);
      child.parent = node;
      children.push(child);
    }
  }
  node.refit();
  return node;
};

/**
 * OMT bulk loading (Lee and Lee 2003), after rbush (MIT).
 * Reorders `es`.
 *
 * @param M fanout, at least 4
 */
export const bulkBuild = <K>(es: RTreeEntry<K>[], M: number): RTreeNode<K> => {
  const n = es.length;
  let height = 1;
  for (let cap = M; cap < n; cap *= M) height++;
  return omt(es, 0, n, height, M);
};
