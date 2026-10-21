/* tslint:disable no-console */
// Viewport-query timing of LinearIndex against RTree: npx ts-node --transpile-only <this file>

import {lcg, sceneRect, xywh} from '../__tests__/random';
import {LinearIndex} from '../LinearIndex';
import {RTree} from '../RTree';
import type {Rect} from '../Rect';
import type {RTreeNode} from '../RTreeNode';
import type {SpatialIndex} from '../types';

const QUERIES = 2000;

const time = (fn: () => void): number => {
  const t0 = performance.now();
  fn();
  return performance.now() - t0;
};

const viewports = (rnd: () => number, world: number): Rect[] => {
  const qs: Rect[] = [];
  for (let i = 0; i < QUERIES; i++) {
    const x = (rnd() * 2 - 1) * world;
    const y = (rnd() * 2 - 1) * world;
    qs.push(xywh(x, y, 1920, 1080));
  }
  return qs;
};

const searchAll = (index: SpatialIndex<number>, qs: Rect[], out: number[]): number => {
  let hits = 0;
  for (let i = 0; i < qs.length; i++) {
    out.length = 0;
    index.search(qs[i], out);
    hits += out.length;
  }
  return hits;
};

const nearestAll = (index: SpatialIndex<number>, qs: Rect[], out: number[]): void => {
  for (let i = 0; i < qs.length; i++) {
    out.length = 0;
    index.nearest(qs[i].minX, qs[i].minY, 8, Infinity, out);
  }
};

const visits = (root: RTreeNode<number>, q: Rect): number => {
  if (!root.intersects(q)) return 0;
  let n = 1;
  if (root.height > 1) for (const c of root.children) n += visits(c as RTreeNode<number>, q);
  return n;
};

const meanVisits = (t: RTree<number>, qs: Rect[]): string => {
  let n = 0;
  for (const q of qs) n += visits(t.root, q);
  return (n / qs.length).toFixed(1);
};

const best = (fn: () => void): number => {
  let min = Infinity;
  for (let i = 0; i < 7; i++) min = Math.min(min, time(fn));
  return min;
};

const fmt = (ms: number, n: number): string => ((ms * 1000) / n).toFixed(2) + ' us';

for (const n of [5000, 50000]) {
  // constant density, so a viewport sees as many rectangles at both sizes
  const world = Math.sqrt(n) * 300;
  const rnd = lcg(n);
  const ids: number[] = [];
  const rects: Rect[] = [];
  for (let i = 0; i < n; i++) {
    ids.push(i);
    rects.push(sceneRect(rnd, world));
  }
  const qs = viewports(rnd, world);
  const out: number[] = [];
  const linear = new LinearIndex<number>();
  const loaded = new RTree<number>();
  const inserted = new RTree<number>();
  const tLinear = time(() => linear.load(ids, rects));
  const tLoad = time(() => loaded.load(ids, rects));
  const tInsert = time(() => {
    for (let i = 0; i < n; i++) inserted.insert(ids[i], rects[i]);
  });
  const hits = searchAll(linear, qs, out);
  const sLinear = best(() => searchAll(linear, qs, out));
  const sLoaded = best(() => searchAll(loaded, qs, out));
  const sInserted = best(() => searchAll(inserted, qs, out));
  const kLinear = best(() => nearestAll(linear, qs, out));
  const kLoaded = best(() => nearestAll(loaded, qs, out));
  console.log(
    n +
      ' rectangles, ' +
      (hits / QUERIES).toFixed(1) +
      ' hits per 1920x1080 viewport\n' +
      '  build:  linear ' +
      tLinear.toFixed(1) +
      ' ms, rtree load ' +
      tLoad.toFixed(1) +
      ' ms, rtree insert ' +
      tInsert.toFixed(1) +
      ' ms\n' +
      '  search: linear ' +
      fmt(sLinear, QUERIES) +
      ', rtree loaded ' +
      fmt(sLoaded, QUERIES) +
      ', rtree inserted ' +
      fmt(sInserted, QUERIES) +
      '\n' +
      '  nodes met per query: rtree loaded ' +
      meanVisits(loaded, qs) +
      ', rtree inserted ' +
      meanVisits(inserted, qs) +
      '\n' +
      '  knn8:   linear ' +
      fmt(kLinear, QUERIES) +
      ', rtree loaded ' +
      fmt(kLoaded, QUERIES),
  );
}
