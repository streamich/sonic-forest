// npx ts-node src/r-tree/__bench__/bench.rtree.libs.ts [load] [insert] [search] [knn] [remove] [move]

import RBush from 'rbush';
// @ts-expect-error rbush-knn ships no types
import rbushKnn from 'rbush-knn';
import {type IBenchmark, runBenchmark} from '../../__bench__/runBenchmark';
import {Rect} from '../Rect';
import {RTree} from '../RTree';
import type {IRect} from '../types';
import {pointDist2} from '../util';
import {type Dataset, type Item, K, payloads} from './payloads';

const knn: <T>(tree: RBush<T>, x: number, y: number, k: number) => T[] = rbushKnn;

/** Throws unless `nearest` matches the brute-force distances; ties may come out in either order. */
const checkNearest = (data: Dataset, nearest: (x: number, y: number) => IRect[]): void => {
  const {points, near} = data;
  for (let i = 0, j = 0; i < points.length; i += 2) {
    const found = nearest(points[i], points[i + 1]);
    for (const r of found)
      if (pointDist2(r, points[i], points[i + 1]) !== near[j++]) throw new Error('wrong nearest at point ' + i / 2);
  }
};

/** Both trees keep their default fanout, 9. */
const benchmarks: Record<string, IBenchmark> = {
  load: {
    name: 'R-tree bulk load',
    warmup: 10,
    payloads,
    runners: [
      {
        name: 'sonic-forest RTree',
        setup: () => (data: unknown) => {
          const {ids, rects} = data as Dataset;
          new RTree<number>().load(ids, rects);
        },
      },
      {
        name: 'rbush RBush',
        setup: () => (data: unknown) => {
          new RBush<Item>().load((data as Dataset).items);
        },
      },
    ],
  },
  insert: {
    name: 'R-tree inserts, one by one',
    warmup: 10,
    payloads,
    runners: [
      {
        name: 'sonic-forest RTree',
        setup: () => (data: unknown) => {
          const {ids, rects} = data as Dataset;
          const t = new RTree<number>();
          for (let i = 0, n = ids.length; i < n; i++) t.insert(ids[i], rects[i]);
        },
      },
      {
        name: 'rbush RBush',
        setup: () => (data: unknown) => {
          const items = (data as Dataset).items;
          const t = new RBush<Item>();
          for (let i = 0, n = items.length; i < n; i++) t.insert(items[i]);
        },
      },
    ],
  },
  search: {
    name: 'R-tree search, 1,000 queries',
    warmup: 10,
    payloads,
    test: (data, hits) => hits === (data as Dataset).hits,
    runners: [
      {
        name: 'sonic-forest RTree',
        setup: (data: unknown) => {
          const {ids, rects} = data as Dataset;
          const t = new RTree<number>();
          t.load(ids, rects);
          const out: number[] = [];
          return (data: unknown) => {
            const queries = (data as Dataset).queries;
            let hits = 0;
            for (let i = 0, n = queries.length; i < n; i++) {
              out.length = 0;
              t.search(queries[i], out);
              hits += out.length;
            }
            return hits;
          };
        },
      },
      {
        name: 'rbush RBush',
        setup: (data: unknown) => {
          const t = new RBush<Item>().load((data as Dataset).items);
          return (data: unknown) => {
            const queries = (data as Dataset).queries;
            let hits = 0;
            for (let i = 0, n = queries.length; i < n; i++) hits += t.search(queries[i]).length;
            return hits;
          };
        },
      },
    ],
  },
  knn: {
    name: 'R-tree ' + K + ' nearest, 1,000 points',
    warmup: 10,
    payloads,
    test: (data, found) => found === (data as Dataset).near.length,
    runners: [
      {
        name: 'sonic-forest RTree',
        setup: (data: unknown) => {
          const {ids, rects} = data as Dataset;
          const t = new RTree<number>();
          t.load(ids, rects);
          const out: number[] = [];
          checkNearest(data as Dataset, (x, y) => {
            const ids: number[] = [];
            t.nearest(x, y, K, Infinity, ids);
            return ids.map((id) => rects[id]);
          });
          return (data: unknown) => {
            const points = (data as Dataset).points;
            let found = 0;
            for (let i = 0, n = points.length; i < n; i += 2) {
              out.length = 0;
              t.nearest(points[i], points[i + 1], K, Infinity, out);
              found += out.length;
            }
            return found;
          };
        },
      },
      {
        name: 'rbush RBush + rbush-knn',
        setup: (data: unknown) => {
          const t = new RBush<Item>().load((data as Dataset).items);
          checkNearest(data as Dataset, (x, y) => knn(t, x, y, K));
          return (data: unknown) => {
            const points = (data as Dataset).points;
            let found = 0;
            for (let i = 0, n = points.length; i < n; i += 2) found += knn(t, points[i], points[i + 1], K).length;
            return found;
          };
        },
      },
    ],
  },
  remove: {
    name: 'R-tree bulk load, then remove all, one by one',
    warmup: 10,
    payloads,
    test: (data, size) => size === 0,
    runners: [
      {
        name: 'sonic-forest RTree',
        setup: () => (data: unknown) => {
          const {ids, rects, order} = data as Dataset;
          const t = new RTree<number>();
          t.load(ids, rects);
          for (let i = 0, n = order.length; i < n; i++) t.remove(order[i]);
          return t.size;
        },
      },
      {
        name: 'rbush RBush',
        setup: () => (data: unknown) => {
          const {items, order} = data as Dataset;
          const t = new RBush<Item>().load(items);
          for (let i = 0, n = order.length; i < n; i++) t.remove(items[order[i]]);
          return t.all().length;
        },
      },
    ],
  },
  move: {
    name: 'R-tree move 1,000 rectangles by 1 and back',
    warmup: 10,
    payloads,
    runners: [
      {
        name: 'sonic-forest RTree',
        setup: (data: unknown) => {
          const {ids, rects, order} = data as Dataset;
          const t = new RTree<number>();
          t.load(ids, rects);
          const cur = rects.map((r) => new Rect(r.minX, r.minY, r.maxX, r.maxY));
          const m = Math.min(1000, order.length);
          return () => {
            for (let d = 1; d >= -1; d -= 2) {
              for (let i = 0; i < m; i++) {
                const id = order[i];
                const r = cur[id];
                r.minX += d;
                r.minY += d;
                r.maxX += d;
                r.maxY += d;
                t.update(id, r);
              }
            }
          };
        },
      },
      {
        name: 'rbush RBush, remove + insert',
        setup: (data: unknown) => {
          const {order} = data as Dataset;
          // own copies: rbush keeps the items themselves, and this mutates them
          const items = (data as Dataset).items.map((it) => ({...it}));
          const t = new RBush<Item>().load(items);
          const m = Math.min(1000, order.length);
          return () => {
            for (let d = 1; d >= -1; d -= 2) {
              for (let i = 0; i < m; i++) {
                const it = items[order[i]];
                t.remove(it);
                it.minX += d;
                it.minY += d;
                it.maxX += d;
                it.maxY += d;
                t.insert(it);
              }
            }
          };
        },
      },
    ],
  },
};

const only = process.argv.slice(2);
for (const key of Object.keys(benchmarks)) if (!only.length || only.includes(key)) runBenchmark(benchmarks[key]);
