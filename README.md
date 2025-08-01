# Sonic Forest

High performance (binary) tree and sorted map implementation for JavaScript in TypeScript.

## Documentation

📚 **[Complete API Documentation](https://streamich.github.io/sonic-forest/)** - Generated with TypeDoc

## Features

Sonic Forest provides a comprehensive collection of high-performance tree data structures:

- **AVL tree implementation** - Self-balancing binary search tree with guaranteed O(log n) operations
- **AVL sorted map implementation** - Map interface built on AVL trees
- **AVL sorted set implementation** - Set interface built on AVL trees  
- **Red-black (RB) tree implementation** - Alternative self-balancing binary search tree
- **Red-black (RB) tree sorted map implementation** - Map interface built on RB trees
- **Left-leaning Red-black (LLRB) tree implementation** - Simplified RB tree variant
- **Radix tree implementation (string keys)** - Compressed trie for string keys
- **Binary radix tree implementation (Uint8Array keys)** - Compressed trie for binary data
- **Splay tree implementation** - Self-adjusting binary search tree
- **SortedMap with optional indexing** - Full-featured sorted map with O(log n) positional access
- **Various utility methods for binary trees** - Common tree operations and traversals

## Performance

This package implements the **fastest insertion** into self-balancing binary tree out of any
NPM package. Both, AVL and Red-black tree insertion implementations of `sonic-forest` are faster
than inserts in [`js-sdsl`](https://www.npmjs.com/package/js-sdsl) implementation.

However, deletions from a binary tree are faster in `js-sdsl`. But, deletions in `sonic-forest`
delete exactly the node, which contains the key. Unlike, in `js-sdsl` and all other
binary tree libraries, where those libraries find the in-order-successor or -predecessor, which
is a leaf node, and delete that instead. As such, one can keep pointers to `sonic-forest` AVL
and Red-black tree nodes, and those pointers will stay valid even after deletions.

## Quick Start

```bash
npm install sonic-forest
```

```typescript
import { AvlMap, RbMap, RadixTree, BinaryRadixTree } from 'sonic-forest';

// AVL Tree Map
const avlMap = new AvlMap<number, string>();
const nodeRef = avlMap.set(1, 'one');
nodeRef.v = 'ONE'; // Direct node value mutation
console.log(avlMap.get(1)); // 'ONE'

// Red-Black Tree Map  
const rbMap = new RbMap<number, string>();
rbMap.set(1, 'one');
rbMap.set(2, 'two');

// String Radix Tree
const radix = new RadixTree<string>();
radix.set('/api/users', 'users-handler');
radix.set('/api/posts', 'posts-handler');

// Binary Radix Tree
const binaryRadix = new BinaryRadixTree<string>();
binaryRadix.set(new Uint8Array([0x47, 0x45, 0x54]), 'GET');
```

## Module Documentation

### AVL Trees (`avl`)

AVL trees are height-balanced binary search trees that guarantee O(log n) performance for insertions, deletions, and lookups. The height difference between left and right subtrees never exceeds 1.

**Key Classes:**
- `AvlMap<K, V>` - AVL tree-based sorted map
- `AvlSet<T>` - AVL tree-based sorted set
- `AvlNode<K, V>` - Individual AVL tree nodes

**Example:**
```typescript
import { AvlMap } from 'sonic-forest/avl';

const map = new AvlMap<number, string>();
map.set(3, 'three');
map.set(1, 'one');
map.set(2, 'two');

// Iterate in sorted order
for (const node of map.entries()) {
  console.log(node.k, node.v); // 1 'one', 2 'two', 3 'three'
}
```

### Red-Black Trees (`red-black`)

Red-Black trees are self-balancing binary search trees that use node coloring to maintain balance. They offer excellent worst-case performance guarantees.

**Key Classes:**
- `RbMap<K, V>` - Red-Black tree-based sorted map
- `RbNode<K, V>` - Individual Red-Black tree nodes

**Example:**
```typescript
import { RbMap } from 'sonic-forest/red-black';

const map = new RbMap<string, number>();
map.set('apple', 1);
map.set('banana', 2);
```

### Left-Leaning Red-Black Trees (`llrb-tree`)

LLRB trees are a simplified variant of Red-Black trees that maintain the same performance while being easier to implement and understand.

**Key Classes:**
- `LlrbTree<K, V>` - Left-leaning Red-Black tree
- `LlrbNode<K, V>` - Individual LLRB tree nodes

### Radix Trees (`radix`)

Radix trees (compressed tries) provide efficient storage and retrieval for string and binary keys by compressing common prefixes.

**Key Classes:**
- `RadixTree<V>` - String-based radix tree
- `BinaryRadixTree<V>` - Binary data radix tree
- `Slice` - Efficient Uint8Array slice reference

**String Radix Tree Example:**
```typescript
import { RadixTree } from 'sonic-forest/radix';

const router = new RadixTree<string>();
router.set('/api/users/:id', 'user-handler');
router.set('/api/posts', 'posts-handler');
router.set('/api/posts/:id', 'post-handler');
```

### Binary Radix Tree

The binary radix tree implementation supports `Uint8Array` keys, making it suitable for binary data like:

- Binary protocol routing
- File system paths as binary data
- Cryptographic hashes
- Network packet classification
- Any binary blob keys

#### Key Features

- **Efficient slicing**: Uses `Slice` class to reference portions of `Uint8Array` without copying data
- **Prefix compression**: Automatically compresses common prefixes to save memory
- **Binary-safe**: Works with any byte sequence, including null bytes
- **Same API**: Provides similar interface to the string-based radix tree

#### Usage Example

```typescript
import { BinaryRadixTree } from 'sonic-forest/radix';

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

### SortedMap (`SortedMap`)

A complete sorted map implementation with optional indexing support for O(log n) positional access.

**Key Classes:**
- `SortedMap<K, V>` - Full-featured sorted map
- `SortedMapIterator<K, V>` - Iterator implementation

**Example:**
```typescript
import { SortedMap } from 'sonic-forest/SortedMap';

// Basic sorted map
const map = new SortedMap<number, string>();
map.set(3, 'three');
map.set(1, 'one');

// With indexing enabled for positional access
const indexedMap = new SortedMap<number, string>(undefined, true);
// Now supports O(log n) access by position
```

### Splay Trees (`splay`)

Splay trees are self-adjusting binary search trees that move frequently accessed elements closer to the root.

### Utility Functions (`util`)

Common binary tree operations and traversals:

- `first()` - Find leftmost node
- `last()` - Find rightmost node  
- `next()` - Find in-order successor
- `prev()` - Find in-order predecessor
- `find()` - Search for key
- `findOrNextLower()` - Range query support
- `size()` - Count nodes
- Tree insertion and removal utilities

### Print Utilities (`print`)

Tree visualization and debugging utilities:

- `printTree()` - ASCII tree visualization
- `printBinary()` - Binary tree printing

## Advanced Usage

### Node Reference Stability

Unlike other tree libraries, `sonic-forest` maintains stable node references even after deletions:

```typescript
const map = new AvlMap<number, string>();
const nodeRef = map.set(1, 'one');

// Node reference remains valid after other operations
map.set(2, 'two');
map.del(2);

// Direct mutation is still possible
nodeRef.v = 'ONE';
console.log(map.get(1)); // 'ONE'
```

### Custom Comparators

All tree implementations support custom comparison functions:

```typescript
// Reverse order
const reverseMap = new AvlMap<number, string>((a, b) => b - a);

// Case-insensitive strings
const caseMap = new AvlMap<string, any>((a, b) => 
  a.toLowerCase().localeCompare(b.toLowerCase())
);
```

### Iterator Support

All maps support iteration in sorted order:

```typescript
const map = new AvlMap<number, string>();
map.set(3, 'three');
map.set(1, 'one');
map.set(2, 'two');

// For...of iteration
for (const node of map) {
  console.log(node.k, node.v);
}

// Manual iteration
let node = map.first();
while (node) {
  console.log(node.k, node.v);
  node = map.next(node);
}
```

## API Reference

For complete API documentation with detailed method signatures, parameters, and examples, visit:

**[https://streamich.github.io/sonic-forest/](https://streamich.github.io/sonic-forest/)**

## License

Apache-2.0
