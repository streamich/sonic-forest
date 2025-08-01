import {BinaryRadixTree} from '../BinaryRadixTree';
import {BinaryTrieNode} from '../BinaryTrieNode';

describe('BinaryRadixTree', () => {
  describe('.set()', () => {
    test('starts empty', () => {
      const tree = new BinaryRadixTree();
      expect(tree.toRecord()).toStrictEqual({});
    });

    test('can insert a single entry', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 'bar');
      expect(tree.toRecord()).toStrictEqual({'1,2,3': 'bar'});
    });

    test('can rewrite a single key', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 'bar');
      tree.set(new Uint8Array([1, 2, 3]), 'baz');
      expect(tree.toRecord()).toStrictEqual({'1,2,3': 'baz'});
    });

    test('can insert two keys', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 'bar');
      tree.set(new Uint8Array([4, 5, 6]), 'qux');
      expect(tree.toRecord()).toStrictEqual({'1,2,3': 'bar', '4,5,6': 'qux'});
    });

    test('can set prefixes of the first key', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 1);
      tree.set(new Uint8Array([1, 2]), 2);
      tree.set(new Uint8Array([1]), 3);
      expect(tree.toRecord()).toStrictEqual({'1,2,3': 1, '1,2': 2, '1': 3});
    });

    test('can insert an empty key', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([]), 1);
      expect(tree.toRecord()).toStrictEqual({'': 1});
    });

    test('can insert keys that contain the previous ones', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([]), 1);
      tree.set(new Uint8Array([1]), 2);
      tree.set(new Uint8Array([1, 2]), 3);
      tree.set(new Uint8Array([1, 2, 3]), 4);
      expect(tree.toRecord()).toStrictEqual({'': 1, '1': 2, '1,2': 3, '1,2,3': 4});
    });

    test('can insert adjacent keys', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1]), 1);
      tree.set(new Uint8Array([2]), 2);
      tree.set(new Uint8Array([3]), 3);
      tree.set(new Uint8Array([2, 1]), 4);
      tree.set(new Uint8Array([2, 3]), 5);
      tree.set(new Uint8Array([2, 2]), 6);
      expect(tree.toRecord()).toStrictEqual({
        '1': 1,
        '2': 2,
        '3': 3,
        '2,1': 4,
        '2,3': 5,
        '2,2': 6,
      });
    });
  });

  describe('.get()', () => {
    test('return "undefined" from empty tree', () => {
      const tree = new BinaryRadixTree();
      expect(tree.get(new Uint8Array([1, 2, 3]))).toBe(undefined);
    });

    test('return "undefined" if key is not found', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 1);
      expect(tree.get(new Uint8Array([4, 5, 6]))).toBe(undefined);
    });

    test('can retrieve a single set key', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 1);
      expect(tree.get(new Uint8Array([1, 2, 3]))).toBe(1);
    });

    test('can retrieve from multiple set keys', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2]), 1);
      tree.set(new Uint8Array([1, 2, 3]), 2);
      tree.set(new Uint8Array([1]), 3);
      tree.set(new Uint8Array([4, 5, 6]), 4);
      tree.set(new Uint8Array([4]), 5);
      tree.set(new Uint8Array([4, 5, 6, 7]), 6);
      expect(tree.get(new Uint8Array([1, 2]))).toBe(1);
      expect(tree.get(new Uint8Array([1, 2, 3]))).toBe(2);
      expect(tree.get(new Uint8Array([1]))).toBe(3);
      expect(tree.get(new Uint8Array([4, 5, 6]))).toBe(4);
      expect(tree.get(new Uint8Array([4]))).toBe(5);
      expect(tree.get(new Uint8Array([4, 5, 6, 7]))).toBe(6);
    });
  });

  describe('.delete()', () => {
    test('can delete an existing key', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 'bar');
      expect(tree.size).toBe(1);
      expect(tree.get(new Uint8Array([1, 2, 3]))).toBe('bar');
      tree.delete(new Uint8Array([1, 2, 3]));
      expect(tree.size).toBe(0);
      expect(tree.get(new Uint8Array([1, 2, 3]))).toBe(undefined);
    });

    test('can delete deeply nested trees', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([2, 2, 2]), 1);
      tree.set(new Uint8Array([2, 2, 2, 2]), 2);
      tree.set(new Uint8Array([2, 2]), 3);
      tree.set(new Uint8Array([2, 2, 1]), 4);
      tree.set(new Uint8Array([2, 2, 3]), 5);
      tree.set(new Uint8Array([2, 2, 2, 1]), 6);
      tree.set(new Uint8Array([2, 2, 2, 3]), 7);
      tree.set(new Uint8Array([1, 1, 1]), 8);
      tree.set(new Uint8Array([1, 2, 2]), 9);
      tree.set(new Uint8Array([1, 1, 2]), 10);
      tree.set(new Uint8Array([2, 1]), 11);
      tree.set(new Uint8Array([2, 1, 1]), 12);
      tree.set(new Uint8Array([2, 3, 3]), 13);
      expect(tree.size).toBe(13);
      expect(tree.get(new Uint8Array([2, 2, 2, 2]))).toBe(2);
      tree.delete(new Uint8Array([2, 2, 2, 2]));
      expect(tree.size).toBe(12);
      expect(tree.get(new Uint8Array([2, 2, 2, 2]))).toBe(undefined);
      expect(tree.get(new Uint8Array([2, 2]))).toBe(3);
      tree.delete(new Uint8Array([2, 2]));
      tree.delete(new Uint8Array([2, 2]));
      expect(tree.size).toBe(11);
      expect(tree.get(new Uint8Array([2, 2]))).toBe(undefined);
      expect(tree.get(new Uint8Array([2, 2, 1]))).toBe(4);
      tree.delete(new Uint8Array([2, 2, 1]));
      expect(tree.size).toBe(10);
      tree.delete(new Uint8Array([2, 2, 2]));
      expect(tree.size).toBe(9);
      tree.delete(new Uint8Array([2, 2, 2, 1]));
      expect(tree.size).toBe(8);
      tree.delete(new Uint8Array([2, 2, 2, 3]));
      tree.delete(new Uint8Array([2, 2, 2, 3]));
      expect(tree.size).toBe(7);
      tree.delete(new Uint8Array([2, 2, 3]));
      tree.delete(new Uint8Array([2, 2, 3]));
      expect(tree.size).toBe(6);
    });
  });

  describe('.size', () => {
    test('increments when new keys are inserted', () => {
      const tree = new BinaryRadixTree();
      expect(tree.size).toBe(0);
      tree.set(new Uint8Array([1, 2, 3]), 1);
      expect(tree.size).toBe(1);
      tree.set(new Uint8Array([4, 5, 6]), 1);
      expect(tree.size).toBe(2);
    });

    test('does not increment the size when value is overwritten', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 1);
      expect(tree.size).toBe(1);
      tree.set(new Uint8Array([1, 2, 3]), 1);
      expect(tree.size).toBe(1);
    });
  });

  describe('.forChildren()', () => {
    test('can iterate through root level nodes', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([1, 2, 3]), 1);
      tree.set(new Uint8Array([1, 2]), 2);
      tree.set(new Uint8Array([4, 5, 6]), 3);
      const res: BinaryTrieNode[] = [];
      tree.forChildren((child) => res.push(child));
      expect(res.length).toBe(2);
      // Binary keys should be sorted by byte values
      expect(res[0].k.at(0)).toBe(1); // [1,2] prefix
      expect(res[1].k.at(0)).toBe(4); // [4,5,6]
    });
  });

  describe('binary data scenarios', () => {
    test('can handle binary protocols', () => {
      const tree = new BinaryRadixTree();
      // Simulate HTTP-like binary protocol headers
      tree.set(new Uint8Array([0x47, 0x45, 0x54, 0x20]), 'GET '); // "GET "
      tree.set(new Uint8Array([0x50, 0x4f, 0x53, 0x54]), 'POST'); // "POST"
      tree.set(new Uint8Array([0x50, 0x55, 0x54, 0x20]), 'PUT '); // "PUT "

      expect(tree.get(new Uint8Array([0x47, 0x45, 0x54, 0x20]))).toBe('GET ');
      expect(tree.get(new Uint8Array([0x50, 0x4f, 0x53, 0x54]))).toBe('POST');
      expect(tree.get(new Uint8Array([0x50, 0x55, 0x54, 0x20]))).toBe('PUT ');
      expect(tree.size).toBe(3);
    });

    test('can handle arbitrary byte sequences', () => {
      const tree = new BinaryRadixTree();
      tree.set(new Uint8Array([0x00, 0xff, 0x80]), 'binary1');
      tree.set(new Uint8Array([0x00, 0xff, 0x81]), 'binary2');
      tree.set(new Uint8Array([0x00, 0xff]), 'prefix');

      expect(tree.get(new Uint8Array([0x00, 0xff, 0x80]))).toBe('binary1');
      expect(tree.get(new Uint8Array([0x00, 0xff, 0x81]))).toBe('binary2');
      expect(tree.get(new Uint8Array([0x00, 0xff]))).toBe('prefix');
    });
  });
});
