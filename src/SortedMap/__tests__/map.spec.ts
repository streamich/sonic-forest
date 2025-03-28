import {SortedMap} from '../SortedMap';

test('numbers from 0 to 100', () => {
  const map = new SortedMap<number, number>();
  for (let i = 0; i <= 100; i++) {
    map.setElement(i, i);
    expect(map.size()).toBe(i + 1);
  }
  for (let i = 0; i <= 100; i++) {
    map.eraseElementByKey(i);
    expect(map.size()).toBe(100 - i);
  }
});

test('numbers going both directions from 50', () => {
  const map = new SortedMap<number, number>();
  for (let i = 1; i <= 100; i++) {
    map.setElement(50 + i, 50 + i);
    map.setElement(50 - i, 50 - i);
    expect(map.size()).toBe((i - 1) * 2 + 2);
  }
  for (let i = 1; i <= 100; i++) {
    map.eraseElementByKey(50 - i);
    map.eraseElementByKey(50 + i);
  }
  expect(map.size()).toBe(0);
});

test('random numbers from 0 to 100', () => {
  const map = new SortedMap<number, number>();
  for (let i = 0; i <= 1000; i++) {
    const num = (Math.random() * 100) | 0;
    const found = map.getElementByKey(num) !== undefined;
    if (!found) map.setElement(num, num);
  }
  const size1 = map.size();
  expect(size1 > 4).toBe(true);
  for (let i = 0; i <= 400; i++) {
    const num = (Math.random() * 100) | 0;
    map.eraseElementByKey(num);
  }
  const size2 = map.size();
  expect(size2 < size1).toBe(true);
});
