/** Binary min-heap of int32 items by key. */
export class MinQueue {
  public length = 0;
  private items = new Int32Array(16);
  private keys = new Float64Array(16);

  public clear(): void {
    this.length = 0;
  }

  /** The least key; the queue must not be empty. */
  public top(): number {
    return this.keys[0];
  }

  public push(item: number, key: number): void {
    let i = this.length++;
    if (i === this.items.length) this.grow();
    const items = this.items;
    const keys = this.keys;
    while (i > 0) {
      const p = (i - 1) >> 1;
      const pk = keys[p];
      if (key >= pk) break;
      items[i] = items[p];
      keys[i] = pk;
      i = p;
    }
    items[i] = item;
    keys[i] = key;
  }

  /** Removes the item of the least key; the queue must not be empty. */
  public pop(): number {
    const top = this.items[0];
    const n = --this.length;
    if (n > 0) this.down(this.items[n], this.keys[n], n);
    return top;
  }

  /** A pop then a push, in one pass; the queue must not be empty. */
  public replace(item: number, key: number): void {
    this.down(item, key, this.length);
  }

  // Apart from push, so that push stays small enough to inline.
  private grow(): void {
    const n = this.items.length * 2;
    const items = new Int32Array(n);
    items.set(this.items);
    this.items = items;
    const keys = new Float64Array(n);
    keys.set(this.keys);
    this.keys = keys;
  }

  private down(item: number, key: number, n: number): void {
    const items = this.items;
    const keys = this.keys;
    const half = n >> 1;
    let i = 0;
    while (i < half) {
      let c = 2 * i + 1;
      const r = c + 1;
      if (r < n && keys[r] < keys[c]) c = r;
      if (keys[c] >= key) break;
      items[i] = items[c];
      keys[i] = keys[c];
      i = c;
    }
    items[i] = item;
    keys[i] = key;
  }
}
