import {find, first, next, size} from '../../util';
import {IRbTreeNode, RbHeadlessNode} from '../types';
import {insert, remove, print} from '../util';

const node = <K, V>(k: K, v: V, black: boolean = false): IRbTreeNode<K, V> => ({k, v, b: black, p: undefined, l: undefined, r: undefined});
const n = (val: number, black: boolean = false) => node(val, '' + val, black);
const linkLeft = <K, V>(parent: IRbTreeNode<K, V>, child: IRbTreeNode<K, V>) => {
  parent.l = child;
  child.p = parent;
};
const linkRight = <K, V>(parent: IRbTreeNode<K, V>, child: IRbTreeNode<K, V>) => {
  parent.r = child;
  child.p = parent;
};
const comparator = (a: number, b: number) => a - b;
const setup = () => {
  const root: {root: IRbTreeNode<number, string> | undefined} = {root: undefined};
  const ins = (...vals: number[]) => {
    vals.forEach((val) => (root.root = insert(root.root, n(val), comparator)));
    assertRedBlackTree(root.root);
  };
  const del = (val: number) => {
    const node = find(root.root!, val, comparator) as IRbTreeNode<number, string>;
    root.root = remove(root.root, node);
    assertRedBlackTree(root.root);
  };
  return {root, ins, del};
};

const treeBlackHeight = (node: RbHeadlessNode): number => {
  const {l, r} = node;
  if (!l && !r) return 1;
  const lh = l ? treeBlackHeight(l) : 0;
  const rh = r ? treeBlackHeight(r) : 0;
  return +node.b + Math.max(lh, rh);
};

const assertRedBlackTree = (root?: RbHeadlessNode): void => {
  if (!root) return;
  if (!root.b) {
    // tslint:disable-next-line: no-console
    console.log('root:\n\n' + print(root));
    throw new Error('Root is not black');
  }
  let curr = first(root);
  while (curr) {
    const {b, l, r, p} = curr;
    const lh = l ? treeBlackHeight(l) : 0;
    const rh = r ? treeBlackHeight(r) : 0;
    const bf = lh - rh;
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
    try {
      expect(bf < 2 && bf > -2).toBe(true);
    } catch (error) {
      // tslint:disable-next-line: no-console
      console.log('at node:\n\n' + print(curr));
      throw error;
    }
    curr = next(curr);
  }
};

describe('inserts', () => {
  test('can insert into empty tree', () => {
    const {root, ins} = setup();
    ins(1);
    assertRedBlackTree(root.root);
  });

  test('can insert to the left of root', () => {
    const {root, ins} = setup();
    ins(50);
    ins(30);
    assertRedBlackTree(root.root);
  });

  test('can insert twice to left of root', () => {
    const {root, ins} = setup();
    ins(50);
    ins(30);
    ins(10);
    assertRedBlackTree(root.root);
  });

  test('ascending ladder inserts', () => {
    const {root, ins} = setup();
    for (let i = 0; i < 100; i++) {
      ins(i);
      assertRedBlackTree(root.root);
      const val = find(root.root, i, comparator);
      expect(val!.k).toBe(i);
    }
    expect(size(root.root)).toBe(100);
  });

  test('descending ladder inserts', () => {
    const {root, ins} = setup();
    for (let i = 100; i > 0; i--) {
      ins(i);
      assertRedBlackTree(root.root);
      const val = find(root.root, i, comparator);
      expect(val!.k).toBe(i);
    }
    expect(size(root.root)).toBe(100);
  });

  test('random inserts', () => {
    const valueSet = new Set<number>();
    for (let i = 0; i < 200; i++) valueSet.add((Math.random() * 1000) | 0);
    const values: number[] = Array.from(valueSet);
    const {root, ins} = setup();
    for (const i of values) {
      ins(i);
      assertRedBlackTree(root.root);
      const val = find(root.root, i, comparator);
      expect(val!.k).toBe(i);
    }
  });

  test('towards the middle inserts', () => {
    const {root, ins} = setup();
    ins(100);
    ins(1);
    ins(50);
    ins(25);
    ins(75);
    ins(12);
    ins(37);
    ins(62);
    ins(87);
    ins(6);
    ins(18);
    ins(31);
    ins(43);
    ins(56);
    ins(68);
    ins(81);
    assertRedBlackTree(root.root);
    expect(size(root.root)).toBe(16);
    const val = find(root.root, 43, comparator);
    expect(val!.v).toBe('43');
  });
});

describe('deletes', () => {
  test('can delete a red leaf', () => {
    const {root, ins} = setup();
    ins(10);
    assertRedBlackTree(root.root);
    ins(15);
    assertRedBlackTree(root.root);
    const node = find(root.root, 15, comparator)! as IRbTreeNode<number, string>;
    expect(node.b).toBe(false);
    expect(node.k).toBe(15);
    expect(node.v).toBe('15');
    expect(size(root.root)).toBe(2);
    root.root = remove(root.root, node);
    assertRedBlackTree(root.root);
    expect(size(root.root)).toBe(1);
    expect(root.root!.k).toBe(10);
  });

  describe('removed node is double-black', () => {
    test('case 4', () => {
      const n0: IRbTreeNode<number, string> = n(0, true);
      const n10: IRbTreeNode<number, string> = n(10, true);
      const n20: IRbTreeNode<number, string> = n(20, true);
      const n30: IRbTreeNode<number, string> = n(30, false);
      const n40: IRbTreeNode<number, string> = n(40, true);
      let root = n10;
      linkLeft(root, n0);
      linkRight(root, n30);
      linkLeft(n30, n20);
      linkRight(n30, n40);
      assertRedBlackTree(root);
      root = remove(root, n20)!;
      assertRedBlackTree(root);
      expect(size(root)).toBe(4);
      expect(!!find(root, 20, comparator)).toBe(false);
      expect(!!find(root, 10, comparator)).toBe(true);
      expect(!!find(root, 40, comparator)).toBe(true);
    });
  });
});
