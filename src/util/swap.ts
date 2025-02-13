import type {HeadlessNode} from '../types';

/**
 * Swaps two node positions in a binary tree.
 *
 * @param x Node to swap
 * @param y Another node to swap
 * @returns New root node
 */
export const swap = <N extends HeadlessNode>(root: N, x: N, y: N): N => {
  const xp = x.p;
  const xl = x.l;
  const xr = x.r;
  const yp = y.p;
  const yl = y.l;
  const yr = y.r;
  if (yl === x) {
    x.l = y;
    y.p = x;
  } else {
    x.l = yl;
    if (yl) yl.p = x;
  }
  if (yr === x) {
    x.r = y;
    y.p = x;
  } else {
    x.r = yr;
    if (yr) yr.p = x;
  }
  if (xl === y) {
    y.l = x;
    x.p = y;
  } else {
    y.l = xl;
    if (xl) xl.p = y;
  }
  if (xr === y) {
    y.r = x;
    x.p = y;
  } else {
    y.r = xr;
    if (xr) xr.p = y;
  }
  if (!xp) {
    root = y;
    y.p = undefined;
  } else if (xp !== y) {
    y.p = xp;
    if (xp) {
      if (xp.l === x) {
        xp.l = y;
      } else {
        xp.r = y;
      }
    }
  }
  if (!yp) {
    root = x;
    x.p = undefined;
  } else if (yp !== x) {
    x.p = yp;
    if (yp) {
      if (yp.l === y) {
        yp.l = x;
      } else {
        yp.r = x;
      }
    }
  }
  return root;
};
