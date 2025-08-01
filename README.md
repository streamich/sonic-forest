# Sonic Forest

High performance (binary) tree and sorted map implementation for JavaScript in TypeScript.

## Features

- AVL tree implementation
- AVL sorted map implementation
- AVL sorted set implementation
- Red-black tree implementation
- Red-black tree sorted map implementation
- Left-leaning Red-black tree insertion implementation
- Radix tree implementation (string keys)
- Binary radix tree implementation (Uint8Array keys)
- Splay tree implementation
- Various utility methods for binary trees

This package implements the fastest insertion into self-balancing binary tree out of any
NPM package. Both, AVL and Red-black tree insertion implementations of `sonic-forest` a faster
than inserts in [`js-sdsl`](https://www.npmjs.com/package/js-sdsl) implementation.

However, deletions from a binary tree are faster in `js-sdsl`. But, deletions in `sonic-forest`
delete exactly the node, which contains the key. Unlike, in `js-sdsl` and all other
binary tree libraries, where those libraries find the in-order-sucessor or -predecessor, which
is a leaf node, and delete that instead. As such, one can keep pointers to `sonic-forest` AVL
and Red-black tree nodes, and those pointers will stay valid even after deletions.

## Binary Radix Tree

The binary radix tree implementation supports `Uint8Array` keys, making it suitable for binary data like:

- Binary protocol routing
- File system paths as binary data
- Cryptographic hashes
- Network packet classification
- Any binary blob keys

### Key Features

- **Efficient slicing**: Uses `Slice` class to reference portions of `Uint8Array` without copying data
- **Prefix compression**: Automatically compresses common prefixes to save memory
- **Binary-safe**: Works with any byte sequence, including null bytes
- **Same API**: Provides similar interface to the string-based radix tree

### Usage Example

```typescript
import { BinaryRadixTree } from 'sonic-forest';

const tree = new BinaryRadixTree<string>();

// Insert binary keys
tree.set(new Uint8Array([0x47, 0x45, 0x54, 0x20]), 'GET ');     // "GET "
tree.set(new Uint8Array([0x50, 0x4F, 0x53, 0x54]), 'POST');      // "POST"
tree.set(new Uint8Array([0x50, 0x55, 0x54, 0x20]), 'PUT ');      // "PUT "

// Retrieve values
console.log(tree.get(new Uint8Array([0x47, 0x45, 0x54, 0x20]))); // "GET "

// Delete keys
tree.delete(new Uint8Array([0x50, 0x4F, 0x53, 0x54])); // Remove POST

console.log(tree.size); // 2
```
