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
- `remove(id)`, `has(id)`, `size`, `clear()`, `forEach(fn)`.
- `load(ids, rects)` bulk upsert.
- `search(rect, out)` appends every id whose rectangle intersects `rect`,
  touching edges included.
- `nearest(x, y, k, maxDist2, out)` appends up to `k` ids nearest to a point,
  nearest first, by squared rectangle distance up to `maxDist2`.
- `version` increments on every change of the id set or of a rectangle, so a
  consumer can cache query results against one integer. `RTree.load` may
  also bump it for a batch that changes nothing.

Queries append to a caller-owned array and allocate nothing per call.

`RTree` adds:

- `new RTree(maxEntries = 9)`: the fanout, at least 4; nodes keep at least
  40% of it.
- `root`: the root `RTreeNode`, read-only, for walks and debugging.
- `churn`, `needsRebuild`, `rebuild()`: node grouping decays under heavy
  churn while staying correct. The tree never rebuilds itself, so no single
  write pays O(n log n); the owner calls `rebuild()` at an idle moment once
  `needsRebuild` turns true. A rebuild changes neither results nor `version`.

## Algorithms

After [rbush](https://github.com/mourner/rbush) and
[rbush-knn](https://github.com/mourner/rbush-knn) by Vladimir Agafonkin (MIT):

- Insertion: Guttman 1984 ChooseLeaf (least enlargement, then least area).
- Split: the R*-tree split of Beckmann et al. 1990 (least margin-sum axis,
  then least overlap), without forced reinsertion.
- Deletion: Guttman 1984 CondenseTree. Parent pointers and an id map make
  `remove(id)` O(log n) however much nodes overlap; rbush searches the tree
  for the item instead.
- Bulk load: OMT, Lee and Lee 2003, with near-equal sibling counts so every
  non-root node keeps the minimum fill, and slices ordered by centre rather
  than lower bound.
- Moves: a rectangle that stays inside its leaf only refits the boxes above
  it, with no re-placement.
- k nearest: best-first search over a binary heap (`MinQueue`), with the
  rectangle distance bounding each subtree.

## Tests

`__tests__/` holds unit tests, a fuzzer that mirrors every operation on a
`LinearIndex` and checks the tree invariants (`checkTree` in
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
| bulk load | 1.94x | 1.28x | 1.25x |
| insert, one by one | 0.79x | 0.72x | 0.73x |
| search, 1,000 queries | 1.30x | 1.38x | 1.21x |
| 8 nearest, 1,000 points | 1.09x | 1.35x | 1.10x |
| bulk load, then remove all | 1.22x | 1.21x | 1.20x |
| move 1,000 by 1 and back | 1.46x | 2.23x | 3.87x |

`move` is `update` against rbush's `remove` + `insert`: a rectangle that
stays inside its leaf only refits the boxes above it.
