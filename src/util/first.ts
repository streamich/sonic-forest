import type {HeadlessNode} from '../types';

export const first = <N extends HeadlessNode>(root: N | undefined): N | undefined => {
  let curr = root;
  while (curr)
    if (curr.l) curr = curr.l as N;
    else return curr;
  return curr;
};
