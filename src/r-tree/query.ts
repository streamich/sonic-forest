import type {Arena} from './Arena';
import type {MinQueue} from './MinQueue';
import type {IRect} from './types';

/** As `util.pointDist2`, which ignores a NaN side, where `Math.max(x0 - x, 0, x - x1)` would spread it. */
const boxDist2 = (box: Float64Array, b: number, x: number, y: number): number => {
  const x0 = box[b];
  const y0 = box[b + 1];
  const x1 = box[b + 2];
  const y1 = box[b + 3];
  const dx = x < x0 ? x0 - x : x > x1 ? x - x1 : 0;
  const dy = y < y0 ? y0 - y : y > y1 ? y - y1 : 0;
  return dx * dx + dy * dy;
};

const collect = <K>(a: Arena<K>, node: number, out: K[]): void => {
  const kids = a.nKids;
  let i = node * a.stride;
  const end = i + a.nCount[node];
  if (a.nHeight[node] === 1) {
    const ids = a.eIds;
    for (; i < end; i++) out.push(ids[kids[i]] as K);
  } else for (; i < end; i++) collect(a, kids[i], out);
};

// The box tests take `&` and `|` over all four sides, not `&&` and `||`: one branch per child, not one per side.

/** @param stack scratch */
export const searchIn = <K>(a: Arena<K>, r: IRect, out: K[], stack: number[]): void => {
  const {minX, minY, maxX, maxY} = r;
  const nBox = a.nBox;
  const root = a.root;
  const rb = root << 2;
  if (nBox[rb] > maxX || nBox[rb + 2] < minX || nBox[rb + 1] > maxY || nBox[rb + 3] < minY) return;
  const eBox = a.eBox;
  const ids = a.eIds;
  const kids = a.nKids;
  const count = a.nCount;
  const height = a.nHeight;
  const stride = a.stride;
  let sp = 0;
  stack[sp++] = root;
  while (sp > 0) {
    const node = stack[--sp];
    let i = node * stride;
    const end = i + count[node];
    if (height[node] === 1) {
      for (; i < end; i++) {
        const e = kids[i];
        const b = e << 2;
        if (+(eBox[b] <= maxX) & +(eBox[b + 2] >= minX) & +(eBox[b + 1] <= maxY) & +(eBox[b + 3] >= minY))
          out.push(ids[e] as K);
      }
      continue;
    }
    for (; i < end; i++) {
      const c = kids[i];
      const b = c << 2;
      const x0 = nBox[b];
      const y0 = nBox[b + 1];
      const x1 = nBox[b + 2];
      const y1 = nBox[b + 3];
      if (+(x0 > maxX) | +(x1 < minX) | +(y0 > maxY) | +(y1 < minY)) continue;
      if (+(x0 >= minX) & +(x1 <= maxX) & +(y0 >= minY) & +(y1 <= maxY)) collect(a, c, out);
      else stack[sp++] = c;
    }
  }
};

/**
 * Best-first k nearest over a non-empty tree, after rbush-knn (MIT): a heap
 * of nodes, and a bounded heap of the k nearest entries whose farthest
 * bounds what may still enter.
 *
 * @param queue nodes to visit, scratch
 * @param near the k nearest so far by negated squared distance, scratch
 * @param held pairs of a node and its squared distance, scratch
 */
export const nearestIn = <K>(
  a: Arena<K>,
  x: number,
  y: number,
  k: number,
  maxDist2: number,
  out: K[],
  queue: MinQueue,
  near: MinQueue,
  held: number[],
): void => {
  const eBox = a.eBox;
  const nBox = a.nBox;
  const kids = a.nKids;
  const count = a.nCount;
  const height = a.nHeight;
  const stride = a.stride;
  queue.clear();
  near.clear();
  // `+` keeps the bound unboxed; as in LinearIndex, no distance exceeds a NaN limit.
  let bound = +maxDist2;
  if (bound !== bound) bound = Infinity;
  // Until the first leaf, nodes wait unsorted in `held`: the bound it sets drops most of them.
  let first = true;
  let len = 0;
  let node = a.root;
  for (;;) {
    let i = node * stride;
    const end = i + count[node];
    if (height[node] === 1) {
      for (; i < end; i++) {
        const e = kids[i];
        const b = e << 2;
        const dx = Math.max(eBox[b] - x, 0, x - eBox[b + 2]);
        const dy = Math.max(eBox[b + 1] - y, 0, y - eBox[b + 3]);
        let d = dx * dx + dy * dy;
        if (d !== d) d = boxDist2(eBox, b, x, y);
        if (d > bound) continue;
        if (near.length < k) near.push(e, -d);
        else near.replace(e, -d);
        if (near.length === k) bound = -near.top();
      }
    } else {
      // The nearest child skips the queue while nothing queued is nearer.
      let next = -1;
      let nd = 0;
      for (; i < end; i++) {
        const c = kids[i];
        const b = c << 2;
        const dx = Math.max(nBox[b] - x, 0, x - nBox[b + 2]);
        const dy = Math.max(nBox[b + 1] - y, 0, y - nBox[b + 3]);
        let d = dx * dx + dy * dy;
        // not boxDist2, which inlined here slows every query: a NaN axis bounds nothing, the other still prunes
        if (d !== d) d = (dx === dx ? dx * dx : 0) + (dy === dy ? dy * dy : 0);
        if (d > bound) continue;
        if (next < 0) {
          next = c;
          nd = d;
          continue;
        }
        let far = c;
        let fd = d;
        if (d < nd) {
          far = next;
          fd = nd;
          next = c;
          nd = d;
        }
        if (first) {
          held[len++] = far;
          held[len++] = fd;
        } else queue.push(far, fd);
      }
      if (next >= 0) {
        if (!queue.length || nd <= queue.top()) {
          node = next;
          continue;
        }
        queue.push(next, nd);
      }
    }
    if (first) {
      first = false;
      for (let j = 0; j < len; j += 2) if (held[j + 1] <= bound) queue.push(held[j], held[j + 1]);
    }
    if (!queue.length || queue.top() > bound) break;
    node = queue.pop();
  }
  // The heap gives the farthest first.
  const ids = a.eIds;
  let i = out.length;
  while (near.length) out.push(ids[near.pop()] as K);
  for (let j = out.length - 1; i < j; i++, j--) {
    const t = out[i];
    out[i] = out[j];
    out[j] = t;
  }
};
