import {type Axis, multiSelect} from '../select';
import {lcg} from './random';

test('partitions at every cut by the key on the axis, keeping the keys parallel', () => {
  const rnd = lcg(11);
  for (const axis of [0, 1] as Axis[]) {
    for (const n of [2, 3, 10, 101, 1000]) {
      const keyOf = [new Float64Array(n), new Float64Array(n)];
      const a = new Int32Array(n);
      const kx = new Float64Array(n);
      const ky = new Float64Array(n);
      for (let i = 0; i < n; i++) {
        keyOf[0][i] = Math.floor(rnd() * 50) * 2 + rnd() * 10;
        keyOf[1][i] = Math.floor(rnd() * 50) * 2 + rnd() * 10;
      }
      for (let i = 0; i < n; i++) {
        const s = n - 1 - i;
        a[i] = s;
        kx[i] = keyOf[0][s];
        ky[i] = keyOf[1][s];
      }
      const key = (s: number): number => keyOf[axis][s];
      const cuts = [Math.floor(n / 4), Math.floor(n / 2), Math.floor((3 * n) / 4)].filter(
        (c, i, all) => c > 0 && c < n && all.indexOf(c) === i,
      );
      const want = Array.from(a, key).sort((x, y) => x - y);
      multiSelect(a, kx, ky, 0, n, cuts, 0, cuts.length, axis);
      expect(Array.from(a).sort((x, y) => x - y)).toEqual(Array.from({length: n}, (_, i) => i));
      for (let i = 0; i < n; i++) {
        expect(kx[i]).toBe(keyOf[0][a[i]]);
        expect(ky[i]).toBe(keyOf[1][a[i]]);
      }
      for (const c of cuts) {
        expect(key(a[c])).toBe(want[c]);
        for (let i = 0; i < c; i++) expect(key(a[i])).toBeLessThanOrEqual(want[c]);
        for (let i = c; i < n; i++) expect(key(a[i])).toBeGreaterThanOrEqual(want[c]);
      }
    }
  }
});

test('selects among equal keys in linear time, ordering ties by slot', () => {
  const n = 100_000;
  const a = new Int32Array(n);
  for (let i = 0; i < n; i++) a[i] = i;
  const kx = new Float64Array(n).fill(10);
  const ky = new Float64Array(n).fill(10);
  const t0 = Date.now();
  multiSelect(a, kx, ky, 0, n, [n >> 2, n >> 1], 0, 2, 0);

  expect(Date.now() - t0).toBeLessThan(5000);
  expect(a[n >> 2]).toBe(n >> 2);
  expect(a[n >> 1]).toBe(n >> 1);
});
