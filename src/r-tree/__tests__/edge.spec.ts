// Edge cases of the SpatialIndex contract, through RTree's public API only, against LinearIndex.
import {LinearIndex} from '../LinearIndex';
import {RTree} from '../RTree';
import type {IRect} from '../types';

const FANOUTS = [4, 5, 9, 16, 33];
const MAX = Number.MAX_VALUE;
const ALL = {minX: -Infinity, minY: -Infinity, maxX: Infinity, maxY: Infinity};

const box = (minX: number, minY: number, maxX: number, maxY: number) => ({minX, minY, maxX, maxY});
const xywh = (x: number, y: number, w: number, h: number) => box(x, y, x + w, y + h);

/** mulberry32 */
const rng = (seed: number): (() => number) => {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const scene = (rnd: () => number): IRect =>
  xywh((rnd() * 2 - 1) * 5000, (rnd() * 2 - 1) * 5000, rnd() * 300, rnd() * 300);

/** The rectangle distance that nearest ranks by. */
const dist2 = (r: IRect, x: number, y: number): number => {
  const dx = x < r.minX ? r.minX - x : x > r.maxX ? x - r.maxX : 0;
  const dy = y < r.minY ? r.minY - y : y > r.maxY ? y - r.maxY : 0;
  return dx * dx + dy * dy;
};

interface Index<K> {
  search(r: IRect, out: K[]): void;
  nearest(x: number, y: number, k: number, maxDist2: number, out: K[]): void;
  forEach(fn: (id: K, r: IRect) => void): void;
}

const searchIds = <K>(index: Index<K>, q: IRect): K[] => {
  const out: K[] = [];
  index.search(q, out);
  return out;
};

/** '' when both lists hold the same ids, as many times each. */
const idDiff = <K>(got: K[], want: K[]): string => {
  const count = new Map<K, number>();
  for (const id of want) count.set(id, (count.get(id) ?? 0) + 1);
  for (const id of got) count.set(id, (count.get(id) ?? 0) - 1);
  return [...count]
    .filter(([, c]) => c)
    .map(([id, c]) => String(id) + (c > 0 ? ' missing' : ' extra'))
    .join(', ');
};

/** Rectangles by id, copied out of the callback, -0 read as 0: an upsert may keep either zero. */
const content = <K>(index: Index<K>): Map<K, IRect> => {
  const m = new Map<K, IRect>();
  index.forEach((id, r) => {
    if (m.has(id)) throw new Error('forEach visited ' + String(id) + ' twice');
    m.set(id, box(r.minX + 0, r.minY + 0, r.maxX + 0, r.maxY + 0));
  });
  return m;
};

/** Same ids and rectangles as the oracle, and the same answers to `queries` and to nearest from `points`. */
const expectSame = <K>(t: RTree<K>, lin: LinearIndex<K>, queries: IRect[], points: number[][] = []): void => {
  expect(t.size).toBe(lin.size);
  const want = content(lin);
  expect(content(t)).toEqual(want);
  for (const q of queries) {
    const diff = idDiff(searchIds(t, q), searchIds(lin, q));
    if (diff) throw new Error('search ' + JSON.stringify(q) + ': ' + diff);
  }
  for (const [x, y] of points) {
    for (const k of [1, 3, 25]) {
      const a: K[] = [];
      const b: K[] = [];
      t.nearest(x, y, k, Infinity, a);
      lin.nearest(x, y, k, Infinity, b);
      expect(a.map((id) => dist2(want.get(id)!, x, y))).toEqual(b.map((id) => dist2(want.get(id)!, x, y)));
    }
  }
};

/** Queries touching `r` on every side and corner, from outside, and its corners as points. */
const touching = (r: IRect): IRect[] => [
  r,
  box(r.maxX, r.minY, r.maxX + 5, r.maxY),
  box(r.minX - 5, r.minY, r.minX, r.maxY),
  box(r.minX, r.maxY, r.maxX, r.maxY + 5),
  box(r.minX, r.minY - 5, r.maxX, r.minY),
  box(r.maxX, r.maxY, r.maxX + 5, r.maxY + 5),
  box(r.minX - 5, r.minY - 5, r.minX, r.minY),
  box(r.minX, r.minY, r.minX, r.minY),
  box(r.maxX, r.maxY, r.maxX, r.maxY),
  box(r.minX, r.maxY, r.minX, r.maxY),
  box(r.maxX, r.minY, r.maxX, r.minY),
];

/** Fills both indexes, one by one or in one load. */
const build = <K>(max: number, ids: K[], rects: IRect[], bulk: boolean): [RTree<K>, LinearIndex<K>] => {
  const t = new RTree<K>(max);
  const lin = new LinearIndex<K>();
  if (bulk) t.load(ids, rects);
  else for (let i = 0; i < ids.length; i++) t.insert(ids[i], rects[i]);
  lin.load(ids, rects);
  return [t, lin];
};

test('clamps the fanout and derives the minimum fill', () => {
  const cases: [number | undefined, number, number][] = [
    [undefined, 9, 4],
    [0, 4, 2],
    [2, 4, 2],
    [4.9, 4, 2],
    [5, 5, 2],
    [9, 9, 4],
    [16, 16, 7],
    [33, 33, 14],
    [NaN, 4, 2],
    [-Infinity, 4, 2],
    [Infinity, 65535, 26214],
  ];
  for (const [arg, max, min] of cases) {
    const t = new RTree(arg);
    expect([t.maxEntries, t.minEntries]).toEqual([max, min]);
  }
  const t = new RTree<number>(NaN);
  for (let i = 0; i < 30; i++) t.insert(i, xywh(i, i, 1, 1));
  expect(searchIds(t, ALL)).toHaveLength(30);
});

test('an empty tree finds nothing, and its no-ops change nothing', () => {
  for (const max of FANOUTS) {
    const t = new RTree<number>(max);
    t.remove(1);
    t.clear();
    t.rebuild();
    t.load([], []);
    const out: number[] = [];
    t.search(ALL, out);
    t.nearest(0, 0, 10, Infinity, out);
    t.forEach((id) => out.push(id));
    expect(out).toEqual([]);
    expect([t.size, t.version, t.churn, t.needsRebuild, t.has(1), t.root.height]).toEqual([0, 0, 0, false, false, 1]);
  }
});

test('version moves when an id or a rectangle changes, and only then', () => {
  const t = new RTree<string>();
  let v = t.version;
  const bumps = (fn: () => void): boolean => {
    fn();
    expect(t.version).toBeGreaterThanOrEqual(v);
    const moved = t.version !== v;
    v = t.version;
    return moved;
  };
  expect(bumps(() => t.insert('a', box(0, 0, 10, 10)))).toBe(true);
  expect(bumps(() => t.update('a', box(0, 0, 10, 10)))).toBe(false);
  expect(bumps(() => t.insert('a', box(0, 0, 10, 10)))).toBe(false);
  expect(bumps(() => t.update('a', box(-0, -0, 10, 10)))).toBe(false);
  expect(bumps(() => t.update('a', box(0, 0, 10, 11)))).toBe(true);
  expect(bumps(() => t.update('b', box(5, 5, 6, 6)))).toBe(true);
  expect(bumps(() => t.remove('c'))).toBe(false);
  expect(bumps(() => t.remove('b'))).toBe(true);
  expect(bumps(() => t.remove('b'))).toBe(false);
  expect(bumps(() => t.insert('b', box(5, 5, 6, 6)))).toBe(true);
  expect(bumps(() => t.rebuild())).toBe(false);
  expect(bumps(() => t.load(['c'], [box(1, 1, 2, 2)]))).toBe(true);
  expect(
    bumps(() => t.load(['d', 'e', 'f', 'g'], [box(1, 1, 2, 2), box(3, 3, 4, 4), box(5, 5, 6, 6), box(7, 7, 8, 8)])),
  ).toBe(true);
  expect(bumps(() => t.load([], []))).toBe(false);
  expect(bumps(() => t.clear())).toBe(true);
  expect(bumps(() => t.clear())).toBe(false);
});

test('copies rectangles in, leaves its inputs alone, and appends to out', () => {
  const t = new RTree<number>(4);
  const r = {minX: 0, minY: 0, maxX: 0, maxY: 10};
  for (let i = 0; i < 20; i++) {
    r.minX = i * 20;
    r.maxX = i * 20 + 10;
    t.insert(i, r);
  }
  const rs = [box(1000, 0, 1010, 10), box(1020, 0, 1030, 10)];
  t.load([20, 21], rs);
  r.minX = r.maxX = -5000;
  for (const x of rs) x.minX = x.maxX = -5000;
  expect(searchIds(t, box(380, 0, 380, 0))).toEqual([19]);
  expect(idDiff(searchIds(t, box(1000, 0, 1030, 10)), [20, 21])).toBe('');
  expect(searchIds(t, box(-5000, -1, -5000, 20))).toEqual([]);
  const fresh = new RTree<number>(4);
  const batch = [box(0, 0, 1, 1), box(5, 5, 6, 6)];
  fresh.load([1, 2], batch);
  batch[0].minX = batch[0].maxX = 100;
  expect(searchIds(fresh, box(0, 0, 1, 1))).toEqual([1]);
  t.insert(98, Object.freeze(box(2000, 2000, 2001, 2001)));
  t.update(98, Object.freeze(box(2000, 2000, 2002, 2002)));
  t.load([99], [Object.freeze(box(3000, 3000, 3001, 3001))]);
  const out = [-1, -2];
  t.search(Object.freeze(box(0, 0, 10, 10)), out);
  expect(out).toEqual([-1, -2, 0]);
  t.nearest(5, 5, 1, Infinity, out);
  expect(out).toEqual([-1, -2, 0, 0]);
});

test('edge contact counts as intersection, for points and lines too', () => {
  const ids: number[] = [];
  const rects: IRect[] = [];
  const queries: IRect[] = [ALL];
  for (let k = 0; k < 40; k++) {
    const x = k * 100;
    const cell = [
      box(x, 0, x + 10, 10),
      box(x + 10, 0, x + 20, 10),
      box(x + 20, 10, x + 30, 20),
      box(x + 5, 5, x + 5, 5),
      box(x, 30, x + 30, 30),
      box(x + 40, 0, x + 40, 30),
    ];
    for (const r of cell) {
      ids.push(ids.length);
      rects.push(r);
      if (k % 13 === 0) queries.push(...touching(r));
    }
  }
  for (const max of FANOUTS) {
    for (const bulk of [false, true]) {
      const [t, lin] = build(max, ids, rects, bulk);
      expectSame(t, lin, queries, [
        [5, 5],
        [1325, 30],
      ]);
    }
  }
});

test('infinite, huge, tiny and negative-zero coordinates', () => {
  const special: IRect[] = [
    ALL,
    box(-Infinity, 5, Infinity, 6),
    box(5, -Infinity, 6, Infinity),
    box(Infinity, Infinity, Infinity, Infinity),
    box(-Infinity, -Infinity, -Infinity, -Infinity),
    box(10, 10, Infinity, Infinity),
    box(-Infinity, -Infinity, -10, -10),
    box(-1e308, -1e308, 1e308, 1e308),
    box(-MAX, 0, MAX, 1),
    box(0, 0, 1e200, 1e200),
    box(MAX, MAX, MAX, MAX),
    box(5e-324, 5e-324, 1e-323, 1e-323),
    box(-5e-324, -5e-324, 5e-324, 5e-324),
    box(-0, -0, 0, 0),
    box(-0, -0, -0, -0),
    box(-0, 3, -0, 4),
  ];
  const queries: IRect[] = [
    ALL,
    box(-MAX, -MAX, MAX, MAX),
    box(0, -Infinity, Infinity, Infinity),
    box(-Infinity, -Infinity, -0, -0),
    box(Infinity, Infinity, Infinity, Infinity),
    box(-Infinity, Infinity, -Infinity, Infinity),
    box(-0, -0, -0, -0),
    box(1e300, 1e300, 1e301, 1e301),
    box(7, 7, 8, 8),
  ];
  for (const r of special) queries.push(...touching(r));
  for (const max of FANOUTS) {
    const rnd = rng(max);
    const ids: number[] = [];
    const rects: IRect[] = [];
    for (let i = 0; i < 400; i++) {
      ids.push(i);
      rects.push(i % 5 ? scene(rnd) : special[(i / 5) % special.length]);
    }
    for (const bulk of [false, true]) {
      const [t, lin] = build(max, ids, rects, bulk);
      expectSame(t, lin, queries, [
        [0, 0],
        [-20, 7],
        [1e6, -1e6],
      ]);
      for (let i = 0; i < 400; i += 3) {
        t.remove(i);
        lin.remove(i);
        const r = i % 2 ? special[i % special.length] : scene(rnd);
        t.update(i + 1, r);
        lin.update(i + 1, r);
      }
      expectSame(t, lin, queries, [
        [0, 0],
        [-20, 7],
      ]);
    }
  }
});

test('exact duplicates, shared minX columns and grid ties', () => {
  const ids: number[] = [];
  const rects: IRect[] = [];
  const add = (r: IRect) => {
    ids.push(ids.length);
    rects.push(r);
  };
  for (let i = 0; i < 120; i++) add(box(0, 0, 10, 10));
  for (let i = 0; i < 120; i++) add(box(100, i * 3, 100 + (i % 7) * 10, i * 3 + 2));
  for (let i = 0; i < 200; i++) add(xywh(((i * 37) % 40) * 8, ((i * 11) % 30) * 8, (i % 3) * 8, (i % 2) * 8));
  const queries = [
    ALL,
    ...touching(box(0, 0, 10, 10)),
    box(100, 0, 100, 400),
    box(96, 96, 104, 104),
    box(8, 8, 8, 8),
    box(320, 0, 320, 240),
  ];
  for (const max of FANOUTS) {
    for (const bulk of [false, true]) {
      const [t, lin] = build(max, ids, rects, bulk);
      expectSame(t, lin, queries, [
        [5, 5],
        [100, 50],
        [64, 64],
      ]);
      const near: number[] = [];
      t.nearest(5, 5, 10, 0, near);
      expect(near.length).toBe(10);
      const rnd = rng(max);
      for (let i = 0; i < 160; i++) {
        const id = Math.floor(rnd() * 240);
        t.remove(id);
        lin.remove(id);
      }
      expectSame(t, lin, queries, [
        [5, 5],
        [100, 50],
      ]);
    }
  }
});

test('load: repeated ids in a batch, existing ids, either branch', () => {
  for (const max of [4, 9]) {
    const rnd = rng(max);
    const t = new RTree<string>(max);
    const lin = new LinearIndex<string>();
    const queries: IRect[] = [ALL];
    const both = (ids: string[], rects: IRect[]) => {
      t.load(ids, rects);
      lin.load(ids, rects);
      for (let i = 0; i < 20; i++) queries.push(rects[Math.floor(rnd() * rects.length)]);
      expectSame(t, lin, queries);
    };
    const batch = (from: number, n: number, again: number): [string[], IRect[]] => {
      const ids: string[] = [];
      const rects: IRect[] = [];
      for (let i = 0; i < n; i++) {
        ids.push('shape:' + (from + i));
        rects.push(scene(rnd));
      }
      for (let i = 0; i < again; i++) {
        ids.push(ids[Math.floor(rnd() * n)]);
        rects.push(scene(rnd));
      }
      return [ids, rects];
    };
    both(
      ['a', 'b', 'a', 'c', 'c'],
      [box(0, 0, 1, 1), box(2, 2, 3, 3), box(4, 4, 5, 5), box(6, 6, 7, 7), box(6, 6, 7, 7)],
    );
    expect([t.size, t.churn]).toEqual([3, 0]);
    expect(searchIds(t, box(0, 0, 1, 1))).toEqual([]);
    both(...batch(0, 200, 20));
    both(...batch(150, 100, 30));
    both(...batch(0, 400, 50));
    const ids: string[] = [];
    const rects: IRect[] = [];
    lin.forEach((id, r) => {
      ids.push(id);
      rects.push(box(r.minX, r.minY, r.maxX, r.maxY));
    });
    both(ids, rects);
    both(ids.slice(0, 10), rects.slice(0, 10));
  }
});

test('takes ids of any type, removed and inserted again', () => {
  const ids: unknown[] = [
    1,
    '1',
    0,
    -0,
    NaN,
    '',
    null,
    undefined,
    true,
    false,
    {},
    {},
    Symbol('s'),
    10n,
    'constructor',
    '__proto__',
    [1],
    Infinity,
  ];
  for (const max of [4, 9]) {
    const t = new RTree<unknown>(max);
    const lin = new LinearIndex<unknown>();
    const both = (id: unknown, r: IRect) => {
      t.insert(id, r);
      lin.insert(id, r);
    };
    ids.forEach((id, i) => both(id, xywh(i * 10, 0, 5, 5)));
    expect(t.size).toBe(ids.length - 1);
    const queries = [ALL, box(0, 0, 50, 5), box(85, 0, 95, 5), box(170, 0, 180, 5)];
    expectSame(t, lin, queries);
    ids.forEach((id, i) => {
      if (i % 2) return;
      t.remove(id);
      lin.remove(id);
    });
    expectSame(t, lin, queries);
    for (const id of ids) expect(t.has(id)).toBe(lin.has(id));
    ids.forEach((id, i) => both(id, xywh(i * 7, 20, 5, 5)));
    expectSame(t, lin, [...queries, box(0, 20, 200, 25)]);
  }
});

test('forEach: each entry once; its callback may query this tree and fill another', () => {
  const rnd = rng(5);
  const ids: number[] = [];
  const rects: IRect[] = [];
  for (let i = 0; i < 500; i++) {
    ids.push(i);
    rects.push(scene(rnd));
  }
  const [t, lin] = build(9, ids, rects, false);
  const queries = [ALL, ...rects.slice(0, 50)];
  let calls = 0;
  t.forEach((id, r) => {
    const own = box(r.minX, r.minY, r.maxX, r.maxY);
    if (calls++ % 25) return;
    expect(idDiff(searchIds(t, own), searchIds(lin, own))).toBe('');
    const near: number[] = [];
    t.nearest(own.minX, own.minY, 1, 0, near);
    expect(near.length).toBe(1);
    expect(t.has(id)).toBe(true);
  });
  expect(calls).toBe(500);
  let nested = 0;
  t.forEach((id, r) => {
    if (id % 100) return;
    const outer = box(r.minX, r.minY, r.maxX, r.maxY);
    t.forEach(() => nested++);
    expect(box(r.minX, r.minY, r.maxX, r.maxY)).toEqual(outer);
  });
  expect(nested).toBe(2500);
  const copy = new RTree<number>(4);
  t.forEach((id, r) => copy.insert(id, r));
  expectSame(copy, lin, queries);
  const bulk = new RTree<number>(16);
  const bi: number[] = [];
  const br: IRect[] = [];
  t.forEach((id, r) => {
    bi.push(id);
    br.push(box(r.minX, r.minY, r.maxX, r.maxY));
  });
  bulk.load(bi, br);
  expectSame(bulk, lin, queries);
});

test('nearest: nearest first, maxDist2 inclusive, k at its bounds', () => {
  const t = new RTree<number>(4);
  for (let i = 0; i < 10; i++) t.insert(i, xywh(i * 10, 0, 1, 1));
  const near = (x: number, y: number, k: number, d2: number): number[] => {
    const out: number[] = [];
    t.nearest(x, y, k, d2, out);
    return out;
  };
  expect(near(32, 0.5, 3, Infinity)).toEqual([3, 4, 2]);
  expect(near(32, 0.5, 5, 121)).toEqual([3, 4, 2]);
  expect(near(32, 0.5, 5, 120.99)).toEqual([3, 4]);
  expect(near(30.5, 0.5, 5, 0)).toEqual([3]);
  expect(near(32, 0.5, 0, Infinity)).toEqual([]);
  expect(near(32, 0.5, -1, Infinity)).toEqual([]);
  expect(near(32, 0.5, 3, -1)).toEqual([]);
  expect(near(32, 0.5, 2.5, Infinity)).toEqual([3, 4]);
  expect(near(32, 0.5, 0.5, Infinity)).toEqual([]);
  expect(near(32, 0.5, 2, NaN)).toEqual([3, 4]);
  expect(near(32, 0.5, 50, Infinity)).toHaveLength(10);
  expect(near(32, 0.5, Infinity, 400)).toEqual([3, 4, 2, 5]);
  for (let i = 10; i < 16; i++) t.insert(i, xywh(500, 500, 1, 1));
  expect(near(500.5, 500.5, 4, 0).every((id) => id >= 10)).toBe(true);
  expect(near(500.5, 500.5, 4, 0)).toHaveLength(4);
  for (const max of [4, 33]) {
    const rnd = rng(max);
    const ids: number[] = [];
    const rects: IRect[] = [];
    for (let i = 0; i < 2000; i++) {
      ids.push(i);
      rects.push(i % 10 ? scene(rnd) : xywh(Math.round(rnd() * 20) * 100, Math.round(rnd() * 20) * 100, 0, 0));
    }
    const [a, lin] = build(max, ids, rects, max === 4);
    const all = content(lin);
    for (let i = 0; i < 200; i++) {
      const x = i % 4 ? (rnd() * 2 - 1) * 6000 : Math.round(rnd() * 20) * 100;
      const y = i % 4 ? (rnd() * 2 - 1) * 6000 : Math.round(rnd() * 20) * 100;
      const k = [1, 2, 5.5, 20, 100][i % 5];
      const d2 = i % 3 ? Infinity : (rnd() * 3000) ** 2;
      const p: number[] = [];
      const q: number[] = [];
      a.nearest(x, y, k, d2, p);
      lin.nearest(x, y, k, d2, q);
      expect(p.map((id) => dist2(all.get(id)!, x, y))).toEqual(q.map((id) => dist2(all.get(id)!, x, y)));
    }
  }
});

test('rebuild keeps answers and version; needsRebuild follows churn', () => {
  const rnd = rng(11);
  const t = new RTree<number>(9);
  const lin = new LinearIndex<number>();
  const expectRule = () => expect(t.needsRebuild).toBe(t.size > t.maxEntries && t.churn >= t.size);
  for (let i = 0; i < 300; i++) {
    const r = scene(rnd);
    t.insert(i, r);
    lin.insert(i, r);
    expectRule();
  }
  expect(t.churn).toBe(300);
  expect(t.needsRebuild).toBe(true);
  const queries = [ALL, box(-1000, -1000, 1000, 1000), box(0, 0, 0, 0)];
  const v = t.version;
  t.rebuild();
  expect([t.version, t.churn, t.needsRebuild]).toEqual([v, 0, false]);
  expectSame(t, lin, queries, [[0, 0]]);
  lin.forEach((id, r) => t.update(id, box(r.minX, r.minY, r.maxX, r.maxY)));
  expect([t.version, t.churn]).toEqual([v, 0]);
  for (let i = 0; i < 10; i++) {
    t.remove(i);
    lin.remove(i);
    expectRule();
  }
  expect(t.churn).toBe(10);
  t.rebuild();
  expectSame(t, lin, queries, [[0, 0]]);
});

test('empties entry by entry, then grows again', () => {
  for (const max of [4, 9, 33]) {
    const rnd = rng(max);
    const t = new RTree<number>(max);
    const lin = new LinearIndex<number>();
    const live: number[] = [];
    for (let i = 0; i < 400; i++) {
      const r = scene(rnd);
      t.insert(i, r);
      lin.insert(i, r);
      live.push(i);
    }
    while (live.length) {
      const id = live.splice(Math.floor(rnd() * live.length), 1)[0];
      t.remove(id);
      lin.remove(id);
      expect(t.size).toBe(live.length);
      if (live.length % 40 === 0) expectSame(t, lin, [ALL, box(-2000, -2000, 2000, 2000)], [[0, 0]]);
    }
    expect([t.root.height, t.version > 0]).toEqual([1, true]);
    expect(searchIds(t, ALL)).toEqual([]);
    for (let i = 0; i < 50; i++) {
      const r = scene(rnd);
      t.insert(i, r);
      lin.insert(i, r);
    }
    expectSame(t, lin, [ALL, box(-2000, -2000, 2000, 2000)], [[0, 0]]);
  }
});

test('NaN coordinates neither throw nor hide other entries from search', () => {
  const keys = ['minX', 'minY', 'maxX', 'maxY'] as const;
  for (const max of [4, 9]) {
    const rnd = rng(max);
    const t = new RTree<number>(max);
    const ok = new Map<number, IRect>();
    const put = (id: number) => {
      const r = scene(rnd);
      if (rnd() < 0.2) {
        const bad = {...r};
        bad[keys[Math.floor(rnd() * 4)]] = NaN;
        if (rnd() < 0.3) bad.minX = bad.minY = bad.maxX = bad.maxY = NaN;
        t.insert(id, bad);
        ok.delete(id);
      } else {
        t.insert(id, r);
        ok.set(id, r);
      }
    };
    for (let i = 0; i < 300; i++) put(i);
    for (let i = 0; i < 300; i += 4) put(i);
    for (let i = 1; i < 300; i += 9) {
      t.remove(i);
      ok.delete(i);
    }
    const ids = [1000, 1001, 1002];
    t.load(ids, [box(NaN, 0, 1, 1), box(0, 0, 1, 1), box(NaN, NaN, NaN, NaN)]);
    ok.set(1001, box(0, 0, 1, 1));
    t.rebuild();
    for (const [id, r] of ok) expect(searchIds(t, r)).toContain(id);
    const all = new Set(searchIds(t, ALL));
    for (const id of ok.keys()) expect(all.has(id)).toBe(true);
    expect(t.size).toBe(300 - 34 + 3);
    t.nearest(0, 0, 10, Infinity, []);
    t.nearest(NaN, 0, 10, Infinity, []);
    t.search(box(NaN, 0, 1, 1), []);
  }
});

test('bulk loads stay fast on equal, mirrored, circular and infinite centres', () => {
  const n = 50_000;
  const ids = Array.from({length: n}, (_, i) => i);
  const shapes = [
    () => box(0, 0, 1, 1),
    (i: number) => box(-(i % 97), -(i % 89), i % 97, i % 89),
    // organ pipe: centres rise, then fall
    (i: number) => xywh(i < n / 2 ? i : n - i, 0, 1, 1),
    (i: number) => xywh(Math.cos((i / n) * 2 * Math.PI) * 1e4, Math.sin((i / n) * 2 * Math.PI) * 1e4, 1, 1),
    // full-width bands, whose centre is NaN
    (i: number) => box(-Infinity, i, Infinity, i + 1),
  ];
  for (const rect of shapes) {
    const t = new RTree<number>(9);
    const rects = ids.map(rect);
    const t0 = Date.now();
    t.load(ids, rects);
    t.rebuild();
    expect(Date.now() - t0).toBeLessThan(1500);
    expect(searchIds(t, ALL)).toHaveLength(n);
  }
});
