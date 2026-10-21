import {MinQueue} from '../MinQueue';
import {lcg} from './random';

test('pops in key order, and is reusable after clear', () => {
  const q = new MinQueue<number>();
  expect(q.peek()).toBe(undefined);
  expect(q.pop()).toBe(undefined);
  const rnd = lcg(5);
  for (let round = 0; round < 3; round++) {
    const keys: number[] = [];
    for (let i = 0; i < 200 + round * 50; i++) {
      const k = Math.floor(rnd() * 100);
      keys.push(k);
      q.push(k * 10, k);
    }
    keys.sort((a, b) => a - b);
    const got: number[] = [];
    while (q.length > 3) got.push(q.pop()! / 10);
    expect(got).toEqual(keys.slice(0, got.length));
    q.clear();
    expect(q.length).toBe(0);
    expect(q.peek()).toBe(undefined);
  }
});
