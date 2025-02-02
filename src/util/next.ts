import {first} from './first';
import type {HeadlessNode} from '../types';

export const next = <N extends HeadlessNode>(curr: N): N | undefined => {
  const r = curr.r as N | undefined;
  if (r) return first(r);
  let p = curr.p as N;
  while (p && p.r === curr) {
    curr = p;
    p = p.p as N;
  }
  return p;
};
