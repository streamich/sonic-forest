import type {LinearIndex} from '../LinearIndex';
import {Rect} from '../Rect';
import type {RTree} from '../RTree';
import {RTreeEntry} from '../RTreeEntry';
import {RTreeNode} from '../RTreeNode';
import type {IRect} from '../types';
import {pointDist2} from '../util';

export const checkTree = <K>(t: RTree<K>, oracle?: LinearIndex<K>): string => {
  const root = t.root;
  const max = t.maxEntries;
  const min = t.minEntries;
  if (root.parent !== null) return 'root has a parent';
  if (root.height > 1 && root.children.length < 2) return 'inner root with ' + root.children.length + ' children';
  const leaves = new Set<RTreeEntry<K>>();
  const u = new Rect();
  const walk = (node: RTreeNode<K>, isRoot: boolean): string => {
    const ch = node.children;
    if (ch.length > max) return 'overfull node: ' + ch.length;
    if (!isRoot && ch.length < min) return 'underfull node: ' + ch.length + ' at height ' + node.height;
    u.empty();
    for (const c of ch) {
      if (c.parent !== node) return 'bad parent pointer at height ' + node.height;
      u.union(c);
    }
    if (!u.equals(node)) return 'node box is not the union of its children at height ' + node.height;
    for (const c of ch) {
      if (node.height === 1) {
        if (!(c instanceof RTreeEntry)) return 'leaf node holds a node';
        if (leaves.has(c)) return 'entry linked twice: ' + c.id;
        leaves.add(c);
      } else {
        if (!(c instanceof RTreeNode)) return 'inner node holds an entry';
        if (c.height !== node.height - 1) return 'child height ' + c.height + ' under ' + node.height;
        const err = walk(c, false);
        if (err) return err;
      }
    }
    return '';
  };
  const err = walk(root, true);
  if (err) return err;
  if (leaves.size !== t.size) return 'tree holds ' + leaves.size + ' entries, size is ' + t.size;
  const byId = new Map<K, RTreeEntry<K>>();
  for (const e of leaves) {
    if (byId.has(e.id)) return 'id linked twice: ' + e.id;
    byId.set(e.id, e);
  }
  let mapErr = '';
  let mapped = 0;
  // Private access: an id mapped to another entry's slot of an equal rectangle shows only here.
  const own = t as unknown as {slots: Map<K, number>; a: {eIds: K[]}};
  t.forEach((id, r) => {
    mapped++;
    const e = byId.get(id);
    const held = own.a.eIds[own.slots.get(id)!];
    if (!e) mapErr ||= 'map entry not in the tree: ' + id;
    else if (!e.equals(r)) mapErr ||= 'map rectangle differs from the tree: ' + id;
    else if (held !== id && (held === held || id === id)) mapErr ||= 'map slot holds another id: ' + id;
  });
  if (mapErr) return mapErr;
  if (mapped !== leaves.size) return 'map size differs from the tree';
  if (oracle) {
    if (oracle.size !== t.size) return 'oracle size ' + oracle.size + ', tree size ' + t.size;
    const rects = rectMap(oracle);
    for (const e of leaves) {
      const r = rects.get(e.id);
      if (!r) return 'id missing from the oracle: ' + e.id;
      if (!e.equals(r)) return 'rectangle differs from the oracle: ' + e.id;
    }
  }
  return '';
};

export const sorted = (ids: number[]): number[] => ids.slice().sort((a, b) => a - b);

export const searchBoth = (t: RTree<number>, lin: LinearIndex<number>, q: IRect): [number[], number[]] => {
  const a: number[] = [];
  const b: number[] = [];
  t.search(q, a);
  lin.search(q, b);
  return [sorted(a), sorted(b)];
};

export const rectMap = <K>(lin: LinearIndex<K>): Map<K, IRect> => {
  const map = new Map<K, IRect>();
  lin.forEach((id, r) => map.set(id, r));
  return map;
};

/** Compares distances, not ids: ties may come out in either order. */
export const knnDiff = <K>(t: RTree<K>, lin: LinearIndex<K>, x: number, y: number, k: number, max2: number): string => {
  const a: K[] = [];
  const b: K[] = [];
  t.nearest(x, y, k, max2, a);
  lin.nearest(x, y, k, max2, b);
  if (new Set(a).size !== a.length) return 'duplicate ids';
  const rects = rectMap(lin);
  const da = a.map((id) => pointDist2(rects.get(id)!, x, y));
  const db = b.map((id) => pointDist2(rects.get(id)!, x, y));
  return JSON.stringify(da) === JSON.stringify(db) ? '' : 'knn ' + JSON.stringify(da) + ' vs ' + JSON.stringify(db);
};
