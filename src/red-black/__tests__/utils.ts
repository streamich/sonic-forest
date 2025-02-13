import {assertTreeLinks} from '../../__tests__/util';
import {find, first, next} from '../../util';
import {IRbTreeNode, RbHeadlessNode} from '../types';
import {insert, remove, print} from '../util';

export const node = <K, V>(k: K, v: V, black: boolean = false): IRbTreeNode<K, V> => ({
  k,
  v,
  b: black,
  p: undefined,
  l: undefined,
  r: undefined,
});

export const n = (val: number, black: boolean = false) => node(val, '' + val, black);

export const linkLeft = <K, V>(parent: IRbTreeNode<K, V>, child: IRbTreeNode<K, V>) => {
  parent.l = child;
  child.p = parent;
};

export const linkRight = <K, V>(parent: IRbTreeNode<K, V>, child: IRbTreeNode<K, V>) => {
  parent.r = child;
  child.p = parent;
};

export const comparator = (a: number, b: number) => a - b;

export const setup = () => {
  const root: {root: IRbTreeNode<number, string> | undefined} = {root: undefined};
  const ins = (...vals: number[]) => {
    vals.forEach((val) => (root.root = insert(root.root, n(val), comparator)));
    assertRedBlackTree(root.root);
  };
  const del = (val: number) => {
    const node = find(root.root!, val, comparator) as IRbTreeNode<number, string>;
    if (!node) return;
    root.root = remove(root.root!, node);
    assertRedBlackTree(root.root);
  };
  return {root, ins, del};
};

export const assertTreeBlackHeight = (node: RbHeadlessNode): number => {
  const {l, r} = node;
  if (!l && !r) return node.b ? 1 : 0;
  const lh = l ? assertTreeBlackHeight(l) : 0;
  const rh = r ? assertTreeBlackHeight(r) : 0;
  if (lh !== rh) {
    // tslint:disable-next-line: no-console
    console.log('at node:\n\n' + print(node));
    throw new Error('Black height mismatch');
  }
  return lh + (node.b ? 1 : 0);
};

export const assertRedBlackTree = (root?: RbHeadlessNode | (RbHeadlessNode & {b: 0 | 1})): void => {
  if (!root) return;
  if (!!root.p) {
    // tslint:disable-next-line: no-console
    console.log('root:\n\n' + print(root));
    throw new Error('Root has parent');
  }
  if (!root.b) {
    // tslint:disable-next-line: no-console
    console.log('root:\n\n' + print(root));
    throw new Error('Root is not black');
  }
  assertTreeLinks(root);
  assertTreeBlackHeight(root);
  let curr = first(root);
  let prev: typeof curr;
  while (curr) {
    const {b, l, r, p} = curr;
    if (prev) {
      if ((prev as IRbTreeNode<any, any>).k > (curr as IRbTreeNode<any, any>).k) {
        // tslint:disable-next-line: no-console
        console.log('at node:\n\n' + print(curr));
        throw new Error('Node is out of order');
      }
    }
    if (!b) {
      if (p && !p.b) {
        // tslint:disable-next-line: no-console
        console.log('at node:\n\n' + print(curr));
        throw new Error('Red node has red parent');
      }
      if (l && !l.b) {
        // tslint:disable-next-line: no-console
        console.log('at node:\n\n' + print(curr));
        throw new Error('Red node has red left child');
      }
      if (r && !r.b) {
        // tslint:disable-next-line: no-console
        console.log('at node:\n\n' + print(curr));
        throw new Error('Red node has red right child');
      }
    }
    prev = curr;
    curr = next(curr);
  }
};
