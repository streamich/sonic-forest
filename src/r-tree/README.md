# R-tree

A dynamic R-tree over axis-aligned rectangles, keyed by id, plus a brute-force
`LinearIndex` with the same `SpatialIndex` interface.

```ts
import {RTree} from 'sonic-forest/lib/r-tree';

const tree = new RTree<string>();
tree.insert('a', {minX: 0, minY: 0, maxX: 10, maxY: 10});
tree.insert('b', {minX: 20, minY: 0, maxX: 30, maxY: 10});

const out: string[] = [];
tree.search({minX: 5, minY: 5, maxX: 25, maxY: 6}, out); // ['a', 'b'], any order
out.length = 0;
tree.nearest(12, 5, 1, Infinity, out); // ['a']: nearest by rectangle distance
tree.remove('a');
```

## API

`SpatialIndex<K>` is the contract both indices implement:

- `insert(id, rect)` / `update(id, rect)` upsert; the rectangle is copied in.
  An unchanged rectangle is a no-op.
- `remove(id)`, `has(id)`, `size`, `clear()`.
- `forEach(fn)` hands `fn` each id and its rectangle, valid only during the
  call: `RTree` overwrites one scratch rectangle per `forEach`.
- `load(ids, rects)` bulk upsert.
- `search(rect, out)` appends every id whose rectangle intersects `rect`,
  touching edges included.
- `nearest(x, y, k, maxDist2, out)` appends up to `k` ids nearest to a point,
  nearest first, by squared rectangle distance up to `maxDist2`.
- `version` increments on every change of the id set or of a rectangle, so a
  consumer can cache query results against one integer. `RTree.load` may
  also bump it for a batch that changes nothing.

Queries append to a caller-owned array and reuse their scratch from call to
call.

`RTree` adds:

- `new RTree(maxEntries = 9)`: the fanout, 4 to 65535; nodes keep at least
  40% of it.
- `root`: a copy of the tree as `RTreeNode` and `RTreeEntry` objects, built
  in O(n) on every read, for walks and debugging.
- `churn`, `needsRebuild`, `rebuild()`: node grouping decays under heavy
  churn while staying correct. The tree never rebuilds itself, so no single
  write pays O(n log n); the owner calls `rebuild()` at an idle moment once
  `needsRebuild` turns true. A rebuild changes neither results nor `version`.

## Storage

`RTree` keeps no object per entry or node: it stores the tree as a struct of
typed arrays. Entry and node boxes sit in `Float64Array`s, four numbers per
slot; a node's children fill a fixed stride of an `Int32Array`, so a node
reserves `4 * (maxEntries + 1)` bytes for them; parents, counts and heights,
and each entry's leaf, sit in typed arrays beside them; ids sit in one array,
and a `Map` from id to slot finds an entry. Free lists recycle the slots of
removed entries and nodes; full arrays double, or grow by half after a bulk
load, which mostly takes edits. An insert allocates nothing but its map
entry. A bulk load or a rebuild starts over in arrays, and a `Map`, sized to
fit with a little headroom, with each leaf's entries in consecutive slots, so
that a query reads them in order. Removes keep the arrays until a rebuild, or
until the tree shrinks to a single leaf, which then rebuilds itself in
O(maxEntries).

## Algorithms

After [rbush](https://github.com/mourner/rbush) and
[rbush-knn](https://github.com/mourner/rbush-knn) by Vladimir Agafonkin (MIT):

- Insertion: Guttman 1984 ChooseLeaf (least enlargement, then least area),
  chosen without branches.
- Split: the R*-tree split of Beckmann et al. 1990 (least margin-sum axis,
  then least overlap), without forced reinsertion; the sorts are rank
  counts, with ties by the other axis, then by position.
- Deletion: Guttman 1984 CondenseTree. Parent pointers and an id map make
  `remove(id)` O(log n) however much nodes overlap; rbush searches the tree
  for the item instead.
- Bulk load: OMT, Lee and Lee 2003, with near-equal sibling counts so every
  non-root node keeps the minimum fill, and slices ordered by centre rather
  than lower bound. Equal centres go by the other axis, so that aligned
  shapes, such as a column of dividers, still fill compact leaves. The
  quickselect samples its pivot at random after a round that keeps most of
  its range, so that mirrored or circular orders stay linear.
- Moves: a rectangle that stays inside its leaf only refits the sides of the
  boxes above it that it gave up, with no re-placement.
- k nearest: best-first search over a heap of nodes (`MinQueue`), with the
  rectangle distance bounding each subtree, and a second heap of the k
  nearest entries so far, whose farthest prunes the rest.

## Tests

`__tests__/` holds unit tests, edge cases of the `SpatialIndex` contract
through the public API (`edge.spec.ts`), a fuzzer that mirrors every
operation on a `LinearIndex` and checks the tree invariants (`checkTree` in
`__tests__/oracle.ts`) after each step, and seeded generators of
high-aspect, clustered and degenerate rectangles. `__bench__/rtree.bench.ts`
times viewport queries against `LinearIndex`.

## Performance

`__bench__/bench.rtree.libs.ts` compares against rbush 4.0.1 and rbush-knn
4.0.0, both trees at fanout 9. Search and nearest results are checked
against brute force first. Run it with
`npx ts-node src/r-tree/__bench__/bench.rtree.libs.ts [load] [insert] [search] [knn] [remove] [move]`.

Speed relative to rbush (higher is better), Node 26.8, Apple M1 Max:

| operation | uniform 1k | uniform 100k | scene 100k |
|---|---|---|---|
| bulk load | 2.55x | 3.12x | 3.04x |
| insert, one by one | 2.23x | 2.41x | 2.43x |
| search, 1,000 queries | 1.48x | 2.38x | 2.87x |
| 8 nearest, 1,000 points | 2.34x | 3.57x | 3.68x |
| bulk load, then remove all | 2.24x | 2.98x | 3.47x |
| move 1,000 by 1 and back | 3.64x | 6.52x | 12.91x |

`move` is `update` against rbush's `remove` + `insert`: a rectangle that
stays inside its leaf only refits the boxes above it.

Retained memory for 100,000 scene rectangles, id map included: 115 bytes per
entry in a tree built by inserts, 97 in a bulk-loaded one.
