import {Rect} from './Rect';
import type {IRect, SpatialIndex} from './types';
import {pointDist2} from './util';

/** Brute-force {@link SpatialIndex}: O(n) queries, O(1) writes. */
export class LinearIndex<K = unknown> implements SpatialIndex<K> {
  public version = 0;
  private readonly slots = new Map<K, number>();
  private readonly ids: K[] = [];
  private readonly rects: Rect[] = [];
  private readonly nearIds: K[] = [];
  private readonly nearDist2: number[] = [];

  public get size(): number {
    return this.ids.length;
  }

  public has(id: K): boolean {
    return this.slots.has(id);
  }

  public insert(id: K, r: IRect): void {
    const slot = this.slots.get(id);
    if (slot !== undefined) {
      const prev = this.rects[slot];
      if (prev.equals(r)) return;
      prev.setTo(r);
    } else {
      this.slots.set(id, this.ids.length);
      this.ids.push(id);
      this.rects.push(new Rect(r.minX, r.minY, r.maxX, r.maxY));
    }
    this.version++;
  }

  public update(id: K, r: IRect): void {
    this.insert(id, r);
  }

  public remove(id: K): void {
    const slots = this.slots;
    const slot = slots.get(id);
    if (slot === undefined) return;
    slots.delete(id);
    const ids = this.ids;
    const rects = this.rects;
    const last = ids.length - 1;
    if (slot !== last) {
      const moved = ids[last];
      ids[slot] = moved;
      rects[slot] = rects[last];
      slots.set(moved, slot);
    }
    ids.pop();
    rects.pop();
    this.version++;
  }

  public load(ids: readonly K[], rects: readonly IRect[]): void {
    for (let i = 0, n = ids.length; i < n; i++) this.insert(ids[i], rects[i]);
  }

  public clear(): void {
    if (!this.ids.length) return;
    this.slots.clear();
    this.ids.length = 0;
    this.rects.length = 0;
    this.version++;
  }

  public search(r: IRect, out: K[]): void {
    const {minX, minY, maxX, maxY} = r;
    const ids = this.ids;
    const rects = this.rects;
    for (let i = 0, n = ids.length; i < n; i++) {
      const c = rects[i];
      if (c.minX <= maxX && c.maxX >= minX && c.minY <= maxY && c.maxY >= minY) out.push(ids[i]);
    }
  }

  public nearest(x: number, y: number, k: number, maxDist2: number, out: K[]): void {
    const m = Math.floor(k);
    if (!(m > 0)) return;
    const ids = this.ids;
    const rects = this.rects;
    const nearIds = this.nearIds;
    const nearDist2 = this.nearDist2;
    let len = 0;
    for (let i = 0, n = ids.length; i < n; i++) {
      const d = pointDist2(rects[i], x, y);
      if (d > maxDist2 || (len === m && d >= nearDist2[len - 1])) continue;
      let j = len < m ? len++ : len - 1;
      for (; j > 0 && nearDist2[j - 1] > d; j--) {
        nearDist2[j] = nearDist2[j - 1];
        nearIds[j] = nearIds[j - 1];
      }
      nearDist2[j] = d;
      nearIds[j] = ids[i];
    }
    for (let j = 0; j < len; j++) out.push(nearIds[j]);
  }

  public forEach(fn: (id: K, r: IRect) => void): void {
    const ids = this.ids;
    const rects = this.rects;
    for (let i = 0, n = ids.length; i < n; i++) fn(ids[i], rects[i]);
  }
}
