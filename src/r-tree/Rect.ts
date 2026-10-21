import type {IRect} from './types';

export class Rect implements IRect {
  constructor(
    public minX: number = 0,
    public minY: number = 0,
    public maxX: number = 0,
    public maxY: number = 0,
  ) {}

  public get area(): number {
    return (this.maxX - this.minX) * (this.maxY - this.minY);
  }

  public setTo(r: IRect): this {
    this.minX = r.minX;
    this.minY = r.minY;
    this.maxX = r.maxX;
    this.maxY = r.maxY;
    return this;
  }

  /** Identity for {@link union}. */
  public empty(): this {
    this.minX = Infinity;
    this.minY = Infinity;
    this.maxX = -Infinity;
    this.maxY = -Infinity;
    return this;
  }

  public union(r: IRect): this {
    if (r.minX < this.minX) this.minX = r.minX;
    if (r.minY < this.minY) this.minY = r.minY;
    if (r.maxX > this.maxX) this.maxX = r.maxX;
    if (r.maxY > this.maxY) this.maxY = r.maxY;
    return this;
  }

  public contains(r: IRect): boolean {
    return r.minX >= this.minX && r.maxX <= this.maxX && r.minY >= this.minY && r.maxY <= this.maxY;
  }

  public intersects(r: IRect): boolean {
    return r.minX <= this.maxX && r.maxX >= this.minX && r.minY <= this.maxY && r.maxY >= this.minY;
  }

  public equals(r: IRect): boolean {
    return this.minX === r.minX && this.minY === r.minY && this.maxX === r.maxX && this.maxY === r.maxY;
  }
}
