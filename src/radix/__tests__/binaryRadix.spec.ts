import {BinaryTrieNode} from '../BinaryTrieNode';
import {Slice} from '../Slice';
import {insert} from '../binaryRadix';
import {first, last} from '../../util';

test('can insert a node with no common prefix', () => {
  const root = new BinaryTrieNode(new Slice(new Uint8Array(), 0, 0), undefined);
  let cnt_ = 0;
  const cnt = () => cnt_++;

  insert(root, new Uint8Array([1, 2, 3]), cnt());
  insert(root, new Uint8Array([1, 2, 3, 4]), cnt());
  insert(root, new Uint8Array([1, 2, 3, 4, 5]), cnt());
  insert(root, new Uint8Array([1, 2, 3, 4, 255]), cnt());
  insert(root, new Uint8Array([100]), cnt());
  insert(root, new Uint8Array([100, 100]), cnt());
  insert(root, new Uint8Array([100, 1]), cnt());
  insert(root, new Uint8Array([100, 2]), cnt());
  insert(root, new Uint8Array([100, 3]), cnt());
  insert(root, new Uint8Array([100, 4]), cnt());
  insert(root, new Uint8Array([100, 5]), cnt());
  insert(root, new Uint8Array([100, 6]), cnt());
  insert(root, new Uint8Array([100, 100]), cnt()); // duplicate
  insert(root, new Uint8Array([100, 7]), cnt());
  insert(root, new Uint8Array([100, 7]), cnt()); // duplicate
  insert(root, new Uint8Array([1, 1]), cnt());
  insert(root, new Uint8Array([1, 1]), cnt()); // duplicate
  insert(root, new Uint8Array([1, 1, 1]), cnt());
  insert(root, new Uint8Array([1, 1, 1]), cnt()); // duplicate

  expect(root.toRecord()).toMatchObject({
    '1,2,3': 0,
    '1,2,3,4': 1,
    '1,2,3,4,5': 2,
    '1,2,3,4,255': 3,
    '1,1': 16,
    '1,1,1': 18,
    '100': 4,
    '100,1': 6,
    '100,2': 7,
    '100,3': 8,
    '100,4': 9,
    '100,5': 10,
    '100,6': 11,
    '100,100': 12,
    '100,7': 14,
  });
});

test('constructs common prefix', () => {
  const root = new BinaryTrieNode(new Slice(new Uint8Array(), 0, 0), undefined);
  // Binary equivalent of similar prefixed data
  insert(root, new Uint8Array([71, 69, 84, 32, 47, 117, 115, 101, 114, 115]), 1); // "GET /users"
  insert(root, new Uint8Array([71, 69, 84, 32, 47, 112, 111, 115, 116, 115]), 2); // "GET /posts"

  expect(first(root.children)).toBe(last(root.children));
  const child = first(root.children);
  expect(child?.k.toUint8Array()).toEqual(new Uint8Array([71, 69, 84, 32, 47])); // "GET /"
  expect(child?.v).toBe(undefined);
  expect(child?.p).toBe(undefined);
  expect(child?.l).toBe(undefined);
  expect(child?.r).toBe(undefined);
  expect(child?.children).not.toBe(undefined);

  // Check children order (should be sorted by byte values)
  const firstChild = first(child?.children!);
  const lastChild = last(child?.children!);
  expect(firstChild!.k.toUint8Array()).toEqual(new Uint8Array([112, 111, 115, 116, 115])); // "posts"
  expect(lastChild!.k.toUint8Array()).toEqual(new Uint8Array([117, 115, 101, 114, 115])); // "users"
});

test('constructs common prefix from binary protocol routes', () => {
  const root = new BinaryTrieNode(new Slice(new Uint8Array(), 0, 0), undefined);
  // Binary equivalent of HTTP methods with common prefix
  insert(root, new Uint8Array([71, 69, 84, 32, 47, 117, 115, 101, 114, 115]), 1); // "GET /users"
  insert(root, new Uint8Array([80, 79, 83, 84, 32, 47, 117, 115, 101, 114, 115]), 2); // "POST /users"
  insert(root, new Uint8Array([80, 85, 84, 32, 47, 117, 115, 101, 114, 115]), 3); // "PUT /users"

  expect(root.toRecord()).toMatchObject({
    '71,69,84,32,47,117,115,101,114,115': 1,
    '80,79,83,84,32,47,117,115,101,114,115': 2,
    '80,85,84,32,47,117,115,101,114,115': 3,
  });
});

test('handles empty keys', () => {
  const root = new BinaryTrieNode(new Slice(new Uint8Array(), 0, 0), undefined);
  insert(root, new Uint8Array([]), 1);
  insert(root, new Uint8Array([1]), 2);

  expect(root.toRecord()).toMatchObject({
    '': 1,
    '1': 2,
  });
});

test('handles single byte differences', () => {
  const root = new BinaryTrieNode(new Slice(new Uint8Array(), 0, 0), undefined);
  insert(root, new Uint8Array([1, 2, 3, 100]), 1);
  insert(root, new Uint8Array([1, 2, 3, 101]), 2);
  insert(root, new Uint8Array([1, 2, 3, 102]), 3);

  expect(root.toRecord()).toMatchObject({
    '1,2,3,100': 1,
    '1,2,3,101': 2,
    '1,2,3,102': 3,
  });
});
