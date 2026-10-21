import {LinearIndex} from '../LinearIndex';
import {Rect} from '../Rect';
import {RTree} from '../RTree';
import {checkTree, knnDiff, searchBoth} from './oracle';
import {lcg, randomQuery, randomRect} from './random';

const TIMEOUT = 30_000;

const run = (seed: number, max: number, steps: number, checkEvery: number): void => {
  const rnd = lcg(seed);
  const t = new RTree<number>(max);
  const lin = new LinearIndex<number>();
  const live: number[] = [];
  const rects = new Map<number, Rect>();
  let next = 0;
  const pick = (): number => Math.floor(rnd() * live.length);
  for (let step = 0; step < steps; step++) {
    const phase = Math.floor((step / steps) * 3);
    const pIns = phase === 0 ? 0.45 : phase === 1 ? 0.25 : 0.08;
    const pDel = pIns + (phase === 2 ? 0.45 : 0.2);
    const r = rnd();
    const tv = t.version;
    const lv = lin.version;
    let compareVersions = true;
    if (r < pIns) {
      const id = next++;
      const rect = randomRect(rnd);
      t.insert(id, rect);
      lin.insert(id, rect);
      rects.set(id, rect);
      live.push(id);
    } else if (r < pDel) {
      if (live.length && rnd() < 0.95) {
        const i = pick();
        const id = live[i];
        live[i] = live[live.length - 1];
        live.pop();
        t.remove(id);
        lin.remove(id);
        rects.delete(id);
      } else {
        t.remove(next + 1000);
        lin.remove(next + 1000);
      }
    } else if (r < pDel + 0.2) {
      if (!live.length) continue;
      const id = live[pick()];
      const old = rects.get(id)!;
      const k = rnd();
      let rect: Rect;
      if (k < 0.2) rect = new Rect(old.minX, old.minY, old.maxX, old.maxY);
      else if (k < 0.6) {
        const dx = rnd() * 20 - 10;
        const dy = rnd() * 20 - 10;
        rect = new Rect(old.minX + dx, old.minY + dy, old.maxX + dx, old.maxY + dy);
      } else if (k < 0.75) rect = new Rect(old.minX, old.minY, old.minX + (old.maxX - old.minX) * rnd(), old.maxY);
      else rect = randomRect(rnd);
      t.update(id, rect);
      lin.update(id, rect);
      rects.set(id, rect);
    } else if (r < 0.96) {
      const [a, b] = searchBoth(t, lin, randomQuery(rnd));
      expect(a).toEqual(b);
    } else if (r < 0.975) {
      const x = (rnd() * 2 - 1) * 50000;
      const y = (rnd() * 2 - 1) * 50000;
      const err = knnDiff(t, lin, x, y, 1 + Math.floor(rnd() * 12), Infinity);
      if (err) throw new Error('step ' + step + ': ' + err);
    } else if (r < 0.985) {
      compareVersions = false;
      const n = Math.floor(rnd() * (rnd() < 0.5 ? 20 : Math.min(live.length + 50, 1500)));
      const ids: number[] = [];
      const rs: Rect[] = [];
      for (let i = 0; i < n; i++) {
        let id: number;
        if (live.length && rnd() < 0.3) id = live[pick()];
        else live.push((id = next++));
        const rect = randomRect(rnd);
        ids.push(id);
        rs.push(rect);
        rects.set(id, rect);
      }
      t.load(ids, rs);
      lin.load(ids, rs);
    } else if (r < 0.995) {
      t.rebuild();
    } else if (rnd() < 0.3) {
      t.clear();
      lin.clear();
      rects.clear();
      live.length = 0;
    }
    if (compareVersions) expect(t.version !== tv).toBe(lin.version !== lv);
    expect(t.size).toBe(lin.size);
    if (step % checkEvery === 0 || step === steps - 1) {
      const err = checkTree(t, lin);
      if (err) throw new Error('step ' + step + ': ' + err);
    }
  }
};

describe('RTree against LinearIndex', () => {
  for (const max of [4, 9, 16]) {
    for (const seed of [1, 2, 3]) {
      test(
        'M=' + max + ' seed=' + seed + ', invariants after every step',
        () => run(seed * 101 + max, max, 3000, 1),
        TIMEOUT,
      );
    }
  }

  test('M=9, a long run', () => run(424242, 9, 40000, 50), TIMEOUT);
  test('M=5, a long run', () => run(777, 5, 20000, 25), TIMEOUT);
});
