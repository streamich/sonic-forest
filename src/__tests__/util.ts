import {print} from '../util/print';
import type {HeadlessNode} from '../types';

export const assertTreeLinks = (node: HeadlessNode): void => {
  const {l, r, p} = node;
  if (l) {
    if (l.p !== node) {
      // tslint:disable-next-line: no-console
      console.log('at node:\n\n' + print(node));
      throw new Error('Left child has wrong parent');
    }
    assertTreeLinks(l);
  } else if (l !== undefined) {
    // tslint:disable-next-line: no-console
    console.log('at node:\n\n' + print(node));
    throw new Error('Empty left child is not undefined');
  }
  if (r) {
    if (r.p !== node) {
      // tslint:disable-next-line: no-console
      console.log('at node:\n\n' + print(node));
      throw new Error('Right child has wrong parent');
    }
    assertTreeLinks(r);
  } else if (r !== undefined) {
    // tslint:disable-next-line: no-console
    console.log('at node:\n\n' + print(node));
    throw new Error('Empty right child is not undefined');
  }
  if (p) {
    if (p.l !== node && p.r !== node) {
      // tslint:disable-next-line: no-console
      console.log('at node:\n\n' + print(node));
      throw new Error('Parent does not link to node');
    }
  } else if (p !== undefined) {
    // tslint:disable-next-line: no-console
    console.log('at node:\n\n' + print(node));
    throw new Error('Empty parent is not undefined');
  }
};
