import {Slice} from '../Slice';

describe('Slice', () => {
  test('can create slice from Uint8Array', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const slice = Slice.fromUint8Array(data);
    expect(slice.length).toBe(5);
    expect(slice.start).toBe(0);
    expect(slice.data).toBe(data);
  });

  test('can access bytes by index', () => {
    const data = new Uint8Array([10, 20, 30, 40, 50]);
    const slice = Slice.fromUint8Array(data);
    expect(slice.at(0)).toBe(10);
    expect(slice.at(2)).toBe(30);
    expect(slice.at(4)).toBe(50);
  });

  test('throws error for out of bounds access', () => {
    const data = new Uint8Array([1, 2, 3]);
    const slice = Slice.fromUint8Array(data);
    expect(() => slice.at(-1)).toThrow();
    expect(() => slice.at(3)).toThrow();
  });

  test('can create substring', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const slice = Slice.fromUint8Array(data);
    const sub = slice.substring(1, 3);
    expect(sub.length).toBe(3);
    expect(sub.at(0)).toBe(2);
    expect(sub.at(1)).toBe(3);
    expect(sub.at(2)).toBe(4);
  });

  test('can create substring without length', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const slice = Slice.fromUint8Array(data);
    const sub = slice.substring(2);
    expect(sub.length).toBe(3);
    expect(sub.at(0)).toBe(3);
    expect(sub.at(1)).toBe(4);
    expect(sub.at(2)).toBe(5);
  });

  test('equals works correctly', () => {
    const data1 = new Uint8Array([1, 2, 3]);
    const data2 = new Uint8Array([1, 2, 3]);
    const data3 = new Uint8Array([1, 2, 4]);

    const slice1 = Slice.fromUint8Array(data1);
    const slice2 = Slice.fromUint8Array(data2);
    const slice3 = Slice.fromUint8Array(data3);

    expect(slice1.equals(slice2)).toBe(true);
    expect(slice1.equals(slice3)).toBe(false);
  });

  test('compare works correctly', () => {
    const slice1 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    const slice2 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    const slice3 = Slice.fromUint8Array(new Uint8Array([1, 2, 4]));
    const slice4 = Slice.fromUint8Array(new Uint8Array([1, 2]));

    expect(slice1.compare(slice2)).toBe(0);
    expect(slice1.compare(slice3)).toBeLessThan(0);
    expect(slice3.compare(slice1)).toBeGreaterThan(0);
    expect(slice1.compare(slice4)).toBeGreaterThan(0);
    expect(slice4.compare(slice1)).toBeLessThan(0);
  });

  test('toUint8Array creates copy', () => {
    const data = new Uint8Array([1, 2, 3]);
    const slice = Slice.fromUint8Array(data);
    const copy = slice.toUint8Array();

    expect(copy).toEqual(data);
    expect(copy).not.toBe(data); // Different object
  });

  test('substring slice toUint8Array works correctly', () => {
    const data = new Uint8Array([1, 2, 3, 4, 5]);
    const slice = Slice.fromUint8Array(data);
    const sub = slice.substring(1, 3);
    const subArray = sub.toUint8Array();

    expect(subArray).toEqual(new Uint8Array([2, 3, 4]));
  });
});

describe('getCommonPrefixLength', () => {
  test('finds common prefix of identical slices', () => {
    const slice1 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    const slice2 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    expect(slice1.getCommonPrefixLength(slice2)).toBe(3);
  });

  test('finds common prefix of different slices', () => {
    const slice1 = Slice.fromUint8Array(new Uint8Array([1, 2, 3, 4]));
    const slice2 = Slice.fromUint8Array(new Uint8Array([1, 2, 5, 6]));
    expect(slice1.getCommonPrefixLength(slice2)).toBe(2);
  });

  test('finds common prefix with different lengths', () => {
    const slice1 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    const slice2 = Slice.fromUint8Array(new Uint8Array([1, 2]));
    expect(slice1.getCommonPrefixLength(slice2)).toBe(2);
  });

  test('handles no common prefix', () => {
    const slice1 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    const slice2 = Slice.fromUint8Array(new Uint8Array([4, 5, 6]));
    expect(slice1.getCommonPrefixLength(slice2)).toBe(0);
  });

  test('handles empty slices', () => {
    const slice1 = Slice.fromUint8Array(new Uint8Array([]));
    const slice2 = Slice.fromUint8Array(new Uint8Array([1, 2, 3]));
    expect(slice1.getCommonPrefixLength(slice2)).toBe(0);
  });
});
