import type {IRect} from './types';

export const pointDist2 = (r: IRect, x: number, y: number): number => {
  const dx = x < r.minX ? r.minX - x : x > r.maxX ? x - r.maxX : 0;
  const dy = y < r.minY ? r.minY - y : y > r.maxY ? y - r.maxY : 0;
  return dx * dx + dy * dy;
};

export const enlargedArea = (a: IRect, b: IRect): number =>
  (Math.max(a.maxX, b.maxX) - Math.min(a.minX, b.minX)) * (Math.max(a.maxY, b.maxY) - Math.min(a.minY, b.minY));

export const overlapArea = (a: IRect, b: IRect): number => {
  const w = Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX);
  const h = Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY);
  return w > 0 && h > 0 ? w * h : 0;
};

export const margin = (r: IRect): number => r.maxX - r.minX + (r.maxY - r.minY);
