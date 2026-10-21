import {LinearIndex} from '../LinearIndex';
import {Rect} from '../Rect';
import {sorted} from './oracle';
import {xywh} from './random';

const find = (index: LinearIndex<number>, q: Rect): number[] => {
  const out: number[] = [];
  index.search(q, out);
  return sorted(out);
};

test('upserts, removes and searches', () => {
  const index = new LinearIndex<number>();
  index.insert(1, new Rect(0, 0, 10, 10));
  index.insert(2, new Rect(20, 0, 30, 10));
  index.insert(3, new Rect(0, 20, 10, 30));
  expect(index.size).toBe(3);
  expect(find(index, new Rect(5, 5, 25, 5))).toEqual([1, 2]);
  index.update(2, new Rect(100, 100, 110, 110));
  expect(find(index, new Rect(5, 5, 25, 5))).toEqual([1]);
  index.remove(1);
  expect(index.has(1)).toBe(false);
  expect(find(index, new Rect(-1e9, -1e9, 1e9, 1e9))).toEqual([2, 3]);
  index.insert(1, new Rect(0, 0, 1, 1));
  expect(index.size).toBe(3);
});

test('copies rectangles in', () => {
  const index = new LinearIndex<number>();
  const r = new Rect(0, 0, 10, 10);
  index.insert(1, r);
  r.setTo(new Rect(50, 50, 60, 60));
  expect(find(index, new Rect(1, 1, 2, 2))).toEqual([1]);
});

test('bumps version only on a change', () => {
  const index = new LinearIndex<number>();
  index.insert(1, new Rect(0, 0, 1, 1));
  const v = index.version;
  index.update(1, new Rect(0, 0, 1, 1));
  index.remove(9);
  index.load([], []);
  expect(index.version).toBe(v);
  index.clear();
  expect(index.version).toBe(v + 1);
  index.clear();
  expect(index.version).toBe(v + 1);
});

test('returns the k nearest, nearest first, within the radius', () => {
  const index = new LinearIndex<number>();
  for (let i = 0; i < 10; i++) index.insert(i, xywh(i * 10, 0, 1, 1));
  const out: number[] = [];
  index.nearest(32, 0.5, 3, Infinity, out);
  expect(out).toEqual([3, 4, 2]);
  out.length = 0;
  index.nearest(32, 0.5, 5, 121, out);
  expect(out).toEqual([3, 4, 2]);
  out.length = 0;
  index.nearest(0.5, 0.5, 0, Infinity, out);
  expect(out).toEqual([]);
});
