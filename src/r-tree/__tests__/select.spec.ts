import type {Rect} from '../Rect';
import {type Axis, multiSelect} from '../select';
import type {IRect} from '../types';
import {lcg, xywh} from './random';

const key = (r: IRect, axis: Axis): number => (axis === 0 ? r.minX + r.maxX : r.minY + r.maxY);

test('partitions at every cut by the centre on the axis', () => {
  const rnd = lcg(11);
  for (const axis of [0, 1] as Axis[]) {
    for (const n of [2, 3, 10, 101, 1000]) {
      const a: Rect[] = [];
      for (let i = 0; i < n; i++) a.push(xywh(Math.floor(rnd() * 50), Math.floor(rnd() * 50), rnd() * 10, rnd() * 10));
      const cuts = [Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4)].filter(
        (c, i, all) => c > 0 && c < n && all.indexOf(c) === i,
      );
      const want = a.map((r) => key(r, axis)).sort((x, y) => x - y);
      multiSelect(a, 0, n, cuts, 0, cuts.length, axis);
      for (const c of cuts) {
        expect(key(a[c], axis)).toBe(want[c]);
        for (let i = 0; i < c; i++) expect(key(a[i], axis)).toBeLessThanOrEqual(want[c]);
        for (let i = c; i < n; i++) expect(key(a[i], axis)).toBeGreaterThanOrEqual(want[c]);
      }
    }
  }
});
