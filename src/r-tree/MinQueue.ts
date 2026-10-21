export class MinQueue<T> {
  public length = 0;
  private readonly items: T[] = [];
  private readonly keys: number[] = [];

  public clear(): void {
    this.length = 0;
  }

  public push(item: T, key: number): void {
    const items = this.items;
    const keys = this.keys;
    let i = this.length++;
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

  public peek(): T | undefined {
    return this.length ? this.items[0] : undefined;
  }

  public pop(): T | undefined {
    if (!this.length) return undefined;
    const items = this.items;
    const keys = this.keys;
    const top = items[0];
    const n = --this.length;
    if (n > 0) {
      const item = items[n];
      const key = keys[n];
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
    return top;
  }
}
