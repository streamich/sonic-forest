/** `minX <= maxX` and `minY <= maxY`: an inverted rectangle may be missed or misranked. */
export interface IRect {
  readonly minX: number;
  readonly minY: number;
  readonly maxX: number;
  readonly maxY: number;
}

/**
 * Index of axis-aligned rectangles by id. Rectangles are copied in, so the
 * caller may reuse its object; `insert` and `update` both upsert.
 */
export interface SpatialIndex<K = unknown> {
  /** Bumped whenever the id set or a rectangle changes, so consumers can key on an integer. */
  readonly version: number;
  readonly size: number;
  has(id: K): boolean;
  insert(id: K, r: IRect): void;
  /** No-op, and no version bump, when the rectangle is unchanged. */
  update(id: K, r: IRect): void;
  /** No-op for a missing id. */
  remove(id: K): void;
  /** Bulk upsert. @param rects parallel to `ids` */
  load(ids: readonly K[], rects: readonly IRect[]): void;
  clear(): void;
  /** Appends the ids whose rectangle intersects `r`, touching edges included, in no particular order. */
  search(r: IRect, out: K[]): void;
  /**
   * Appends up to `k` ids nearest to `(x, y)` by rectangle distance, nearest
   * first, skipping any whose squared distance exceeds `maxDist2`. Rectangle
   * distance is a lower bound of the distance to what it bounds: refine the
   * candidates with exact geometry.
   */
  nearest(x: number, y: number, k: number, maxDist2: number, out: K[]): void;
  /** @param fn must not mutate the rectangle, nor the index; the rectangle is valid only during the call. */
  forEach(fn: (id: K, r: IRect) => void): void;
}
