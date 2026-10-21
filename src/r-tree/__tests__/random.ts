import {Rect} from '../Rect';

/** Numerical Recipes constants. */
export const lcg = (seed: number) => {
  let s = seed >>> 0;
  return (): number => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
};

export const xywh = (x: number, y: number, w: number, h: number): Rect => new Rect(x, y, x + w, y + h);

const CLUSTERS = [
  [-30000, -30000],
  [0, 0],
  [1200, -800],
  [25000, 4000],
];

export const randomRect = (rnd: () => number, world = 50000): Rect => {
  const kind = rnd();
  const x = (rnd() * 2 - 1) * world;
  const y = (rnd() * 2 - 1) * world;
  if (kind < 0.15) return xywh(x, y, rnd() < 0.3 ? 0 : rnd() * 2, rnd() < 0.3 ? 0 : rnd() * 2);
  if (kind < 0.5) return xywh(x, y, 10 + rnd() * 300, 10 + rnd() * 300);
  if (kind < 0.55) return xywh(x, y, 5000 + rnd() * 25000, 5000 + rnd() * 25000);
  if (kind < 0.8) {
    const c = CLUSTERS[Math.floor(rnd() * CLUSTERS.length)];
    return xywh(c[0] + rnd() * 1000, c[1] + rnd() * 1000, 5 + rnd() * 100, 5 + rnd() * 100);
  }
  return rnd() < 0.5 ? xywh(x, y, 4000, 2) : xywh(x, y, 2, 4000);
};

export const randomQuery = (rnd: () => number, world = 50000): Rect => {
  const kind = rnd();
  const x = (rnd() * 2 - 1) * world;
  const y = (rnd() * 2 - 1) * world;
  if (kind < 0.1) return new Rect(x, y, x, y);
  if (kind < 0.15) return new Rect(-world * 2, -world * 2, world * 2, world * 2);
  if (kind < 0.3) {
    const c = CLUSTERS[Math.floor(rnd() * CLUSTERS.length)];
    return xywh(c[0] + rnd() * 800, c[1] + rnd() * 800, rnd() * 600, rnd() * 600);
  }
  const s = 100 + rnd() * 8000;
  return xywh(x, y, s * 1.7, s);
};

/** A whiteboard: mostly card-sized shapes, some tiny ones, long dividers and a few huge frames. */
export const sceneRect = (rnd: () => number, world: number): Rect => {
  const k = rnd();
  const x = (rnd() * 2 - 1) * world;
  const y = (rnd() * 2 - 1) * world;
  if (k < 0.7) return xywh(x, y, 20 + rnd() * 380, 20 + rnd() * 380);
  if (k < 0.85) return xywh(x, y, 2 + rnd() * 38, 2 + rnd() * 38);
  if (k < 0.93) return rnd() < 0.5 ? xywh(x, y, 50 + rnd() * 4000, 2) : xywh(x, y, 2, 50 + rnd() * 4000);
  if (k < 0.98) return xywh(x / 20, y / 20, 5 + rnd() * 100, 5 + rnd() * 100);
  return xywh(x, y, 2000 + rnd() * 6000, 2000 + rnd() * 6000);
};
