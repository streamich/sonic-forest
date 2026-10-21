import {LinearIndex} from '../LinearIndex';
import {Rect} from '../Rect';
import {RTree} from '../RTree';
import type {IRect} from '../types';
import {checkTree, knnDiff, rectMap, searchBoth, sorted} from './oracle';
import {lcg, randomQuery, randomRect, xywh} from './random';

const TIMEOUT = 30_000;

test('clamps the fanout and derives the minimum fill', () => {
  expect(new RTree().maxEntries).toBe(9);
  expect(new RTree().minEntries).toBe(4);
  expect(new RTree(2).maxEntries).toBe(4);
  expect(new RTree(2).minEntries).toBe(2);
  expect(new RTree(16).minEntries).toBe(7);
});

test('handles an empty tree', () => {
  const t = new RTree<number>();
  const out: number[] = [];
  t.search(new Rect(-1e9, -1e9, 1e9, 1e9), out);
  t.nearest(0, 0, 5, Infinity, out);
  expect(out).toEqual([]);
  t.remove(1);
  t.clear();
  t.rebuild();
  t.load([], []);
  expect(t.version).toBe(0);
  expect(t.size).toBe(0);
  expect(t.has(1)).toBe(false);
  expect(t.root.height).toBe(1);
  expect(checkTree(t)).toBe('');
});

test('takes any key type', () => {
  const a = {};
  const b = {};
  const t = new RTree<object>();
  t.insert(a, new Rect(0, 0, 1, 1));
  t.insert(b, {minX: 5, minY: 5, maxX: 6, maxY: 6});
  const out: object[] = [];
  t.search(new Rect(0, 0, 2, 2), out);
  expect(out.length).toBe(1);
  expect(out[0]).toBe(a);
  expect(checkTree(t)).toBe('');
});

test('bumps version only when the content changes', () => {
  const t = new RTree<number>();
  let v = t.version;
  const step = (fn: () => void, bumps: boolean) => {
    fn();
    expect(t.version !== v).toBe(bumps);
    v = t.version;
  };
  step(() => t.insert(1, new Rect(0, 0, 10, 10)), true);
  step(() => t.update(1, new Rect(0, 0, 10, 10)), false);
  step(() => t.insert(1, new Rect(0, 0, 10, 10)), false);
  step(() => t.update(1, new Rect(1, 1, 10, 10)), true);
  step(() => t.update(2, new Rect(5, 5, 6, 6)), true);
  step(() => t.remove(3), false);
  step(() => t.remove(2), true);
  step(() => t.rebuild(), false);
  step(() => t.load([4, 5], [new Rect(0, 0, 1, 1), new Rect(2, 2, 3, 3)]), true);
  step(() => t.clear(), true);
  step(() => t.clear(), false);
});

test('copies rectangles in, and appends to the out array', () => {
  const t = new RTree<number>();
  const r = new Rect(0, 0, 10, 10);
  t.insert(1, r);
  r.setTo(new Rect(100, 100, 110, 110));
  const out: number[] = [0];
  t.search(new Rect(5, 5, 6, 6), out);
  expect(out).toEqual([0, 1]);
});

test('counts edge contact as intersection', () => {
  const t = new RTree<number>();
  t.insert(1, new Rect(0, 0, 10, 10));
  t.insert(2, new Rect(0, 0, 0, 0));
  const out: number[] = [];
  t.search(new Rect(10, 10, 20, 20), out);
  t.search(new Rect(-5, -5, 0, 0), out);
  expect(sorted(out)).toEqual([1, 1, 2]);
});

test(
  'bulk loads every size into a valid, minimally filled tree',
  () => {
    const sizes = [0, 1, 2, 3, 4, 5, 8, 9, 10, 15, 16, 17, 25, 26, 27, 64, 80, 81, 82, 100, 255, 729, 730, 1000, 6562];
    for (const max of [4, 5, 6, 7, 9, 16]) {
      for (const n of sizes) {
        const rnd = lcg(n * 31 + max);
        const ids: number[] = [];
        const rects: Rect[] = [];
        for (let i = 0; i < n; i++) {
          ids.push(i);
          rects.push(randomRect(rnd));
        }
        const t = new RTree<number>(max);
        const lin = new LinearIndex<number>();
        t.load(ids, rects);
        lin.load(ids, rects);
        const err = checkTree(t, lin);
        if (err) throw new Error('M=' + max + ' n=' + n + ': ' + err);
        let cap = max;
        let height = 1;
        for (; cap < n; cap *= max) height++;
        expect(t.root.height).toBe(height);
        for (let i = 0; i < 20; i++) {
          const [a, b] = searchBoth(t, lin, randomQuery(rnd));
          expect(a).toEqual(b);
        }
      }
    }
  },
  TIMEOUT,
);

test('loads into a non-empty tree, both one by one and by rebuilding', () => {
  const rnd = lcg(7);
  const t = new RTree<number>(6);
  const lin = new LinearIndex<number>();
  const batch = (from: number, n: number): [number[], Rect[]] => {
    const ids: number[] = [];
    const rects: Rect[] = [];
    for (let i = 0; i < n; i++) {
      ids.push(from + i);
      rects.push(randomRect(rnd));
    }
    return [ids, rects];
  };
  for (const [from, n] of [
    [0, 300],
    [250, 40],
    [200, 600],
    [0, 5],
    [1000, 2000],
  ]) {
    const [ids, rects] = batch(from, n);
    ids.push(ids[0]);
    rects.push(randomRect(rnd));
    t.load(ids, rects);
    lin.load(ids, rects);
    expect(checkTree(t, lin)).toBe('');
    for (let i = 0; i < 30; i++) {
      const [a, b] = searchBoth(t, lin, randomQuery(rnd));
      expect(a).toEqual(b);
    }
  }
  expect(t.churn).toBe(0);
});

test(
  'stays valid while emptied entry by entry',
  () => {
    for (const max of [4, 9]) {
      const rnd = lcg(max);
      const t = new RTree<number>(max);
      const lin = new LinearIndex<number>();
      const ids: number[] = [];
      for (let i = 0; i < 1500; i++) {
        const r = randomRect(rnd);
        ids.push(i);
        if (i % 2) t.insert(i, r);
        lin.insert(i, r);
      }
      const rects = rectMap(lin);
      const all: IRect[] = ids.map((id) => rects.get(id)!);
      t.load(
        ids.filter((_, i) => !(i % 2)),
        all.filter((_, i) => !(i % 2)),
      );
      expect(checkTree(t, lin)).toBe('');
      while (ids.length) {
        const id = ids.splice(Math.floor(rnd() * ids.length), 1)[0];
        t.remove(id);
        lin.remove(id);
        const err = checkTree(t, lin);
        if (err) throw new Error('M=' + max + ', after removing ' + id + ': ' + err);
      }
      expect(t.root.height).toBe(1);
      expect(t.root.children.length).toBe(0);
    }
  },
  TIMEOUT,
);

test('finds the k nearest by rectangle distance', () => {
  const rnd = lcg(99);
  const t = new RTree<number>();
  const lin = new LinearIndex<number>();
  for (let i = 0; i < 3000; i++) {
    const r = randomRect(rnd);
    t.insert(i, r);
    lin.insert(i, r);
  }
  for (let i = 0; i < 300; i++) {
    const x = (rnd() * 2 - 1) * 60000;
    const y = (rnd() * 2 - 1) * 60000;
    const k = [1, 2, 5, 20, 100][i % 5];
    const max2 = i % 3 ? Infinity : (rnd() * 3000) ** 2;
    expect(knnDiff(t, lin, x, y, k, max2)).toBe('');
  }
  const out: number[] = [];
  t.nearest(0, 0, 0, Infinity, out);
  t.nearest(0, 0, 10, -1, out);
  expect(out).toEqual([]);
});

test('separates stacked 4000x2 dividers', () => {
  const t = new RTree<number>();
  for (let i = 0; i < 2000; i++) t.insert(i, xywh(0, i * 4, 4000, 2));
  expect(checkTree(t)).toBe('');
  const out: number[] = [];
  t.search(xywh(1000, 401, 100, 6), out);
  expect(sorted(out)).toEqual([100, 101]);
});

test('recommends a rebuild after heavy churn, and the rebuild keeps the content', () => {
  const rnd = lcg(3);
  const t = new RTree<number>();
  const lin = new LinearIndex<number>();
  for (let i = 0; i < 500; i++) {
    const r = randomRect(rnd);
    t.insert(i, r);
    lin.insert(i, r);
  }
  expect(t.needsRebuild).toBe(true);
  t.rebuild();
  expect(t.churn).toBe(0);
  expect(t.needsRebuild).toBe(false);
  const rects = rectMap(lin);
  for (let i = 0; i < 499; i++) {
    t.remove(i);
    t.insert(i, rects.get(i)!);
  }
  expect(t.needsRebuild).toBe(true);
  const v = t.version;
  t.rebuild();
  expect(t.version).toBe(v);
  expect(checkTree(t, lin)).toBe('');
});

test('updates in place when the rectangle stays inside its leaf', () => {
  const t = new RTree<number>(4);
  const lin = new LinearIndex<number>();
  for (let i = 0; i < 64; i++) {
    const r = xywh((i % 8) * 100, Math.floor(i / 8) * 100, 50, 50);
    t.insert(i, r);
    lin.insert(i, r);
  }
  t.rebuild();
  const shrunk = xywh(10, 10, 5, 5);
  t.update(0, shrunk);
  lin.update(0, shrunk);
  expect(t.churn).toBe(0);
  expect(checkTree(t, lin)).toBe('');
});
