import type {BBox} from 'rbush';
import type {Payload} from '../../__bench__/runBenchmark';
import {lcg, sceneRect, xywh} from '../__tests__/random';
import {LinearIndex} from '../LinearIndex';
import type {Rect} from '../Rect';
import {pointDist2} from '../util';

export interface Item extends BBox {
  id: number;
}

/** One rectangle set, given to every library in its own shape, with the queries to run on it. */
export interface Dataset {
  /** Rectangle `i` has id `i`. */
  rects: Rect[];
  ids: number[];
  /** `rects` as rbush items. */
  items: Item[];
  queries: Rect[];
  /** Query points, `x0, y0, x1, y1, ...` */
  points: number[];
  /** A random permutation of the ids. */
  order: number[];
  /** Total search hits over `queries`, by brute force. */
  hits: number;
  /** Squared distances of the `K` nearest to each point, by brute force. */
  near: number[];
}

export const K = 8;
const QUERIES = 1000;

const dataset = (
  n: number,
  rect: (rnd: () => number) => Rect,
  lo: number,
  hi: number,
  qw: number,
  qh: number,
): Dataset => {
  const rnd = lcg(n);
  const at = (): number => lo + rnd() * (hi - lo);
  const rects: Rect[] = [];
  const ids: number[] = [];
  const items: Item[] = [];
  for (let i = 0; i < n; i++) {
    const r = rect(rnd);
    rects.push(r);
    ids.push(i);
    items.push({minX: r.minX, minY: r.minY, maxX: r.maxX, maxY: r.maxY, id: i});
  }
  const queries: Rect[] = [];
  const points: number[] = [];
  for (let i = 0; i < QUERIES; i++) {
    queries.push(xywh(at(), at(), qw, qh));
    points.push(at(), at());
  }
  const order = ids.slice();
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rnd() * (i + 1));
    const t = order[i];
    order[i] = order[j];
    order[j] = t;
  }
  const lin = new LinearIndex<number>();
  lin.load(ids, rects);
  const out: number[] = [];
  let hits = 0;
  for (const q of queries) {
    out.length = 0;
    lin.search(q, out);
    hits += out.length;
  }
  const near: number[] = [];
  for (let i = 0; i < points.length; i += 2) {
    out.length = 0;
    lin.nearest(points[i], points[i + 1], K, Infinity, out);
    for (const id of out) near.push(pointDist2(rects[id], points[i], points[i + 1]));
  }
  return {rects, ids, items, queries, points, order, hits, near};
};

/** Constant density: about 25 hits per 45 x 45 query at every size. */
const uniform = (n: number): Payload => {
  const world = Math.sqrt(n) * 10;
  const data = dataset(n, (rnd) => xywh(rnd() * world, rnd() * world, rnd() * 10, rnd() * 10), 0, world, 45, 45);
  return {name: 'uniform, ' + n.toLocaleString('en-US') + ' rectangles', data};
};

/** A whiteboard: about 10 hits per 1920 x 1080 viewport. */
const scene = (n: number): Payload => {
  const world = Math.sqrt(n) * 300;
  const data = dataset(n, (rnd) => sceneRect(rnd, world), -world, world, 1920, 1080);
  return {name: 'scene, ' + n.toLocaleString('en-US') + ' rectangles', data};
};

export const payloads: Payload[] = [uniform(1_000), uniform(100_000), scene(100_000)];
