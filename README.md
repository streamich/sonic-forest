# Sonic Forest

High performance (binary) tree and sorted map implementation for JavaScript in TypeScript.

## Features

- AVL tree implementation
- AVL sorted map implementation
- AVL sorted set implementation
- Red-black tree implementation
- Red-black tree sorted map implementation
- Left-leaning Red-black tree insertion implementation
- Radix tree implementation
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
