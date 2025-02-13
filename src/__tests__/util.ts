import {print} from '../util/print';
import type {HeadlessNode, SonicMap} from '../types';

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

export const assertMapContents = (map: SonicMap<number, number>, twin: Map<number, number>): void => {
  if (map.size() !== twin.size) {
    throw new Error(`Size mismatch: ${map.size()} !== ${twin.size}`);
  }
  for (const [key, value] of twin) {
    if (map.get(key) !== value) {
      throw new Error(`Value mismatch for key ${key}: ${map.get(key)} !== ${value}`);
    }
  }
};
