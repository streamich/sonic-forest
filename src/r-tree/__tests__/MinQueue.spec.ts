import {MinQueue} from '../MinQueue';
import {lcg} from './random';

test('pops in key order, replaces the top, and is reusable after clear', () => {
  const q = new MinQueue();
  const rnd = lcg(5);
  for (let round = 0; round < 3; round++) {
    const keys: number[] = [];
    for (let i = 0; i < 200 + round * 50; i++) {
      const k = Math.floor(rnd() * 100);
      keys.push(k);
      q.push(k * 10, k);
    }
    keys.sort((a, b) => a - b);
    for (let i = 0; i < 20; i++) {
      const k = Math.floor(rnd() * 100);
      keys[0] = k;
      keys.sort((a, b) => a - b);
      q.replace(k * 10, k);
    }
    const got: number[] = [];
    while (q.length > 3) {
      expect(q.top()).toBe(keys[got.length]);
      got.push(q.pop() / 10);
    }
    expect(got).toEqual(keys.slice(0, got.length));
    q.clear();
    expect(q.length).toBe(0);
  }
});
