import {find, first, next, size} from '../../util';
import {IRbTreeNode, RbHeadlessNode} from '../types';
import {insert, remove, print} from '../util';

const node = <K, V>(k: K, v: V): IRbTreeNode<K, V> => ({k, v, b: false, p: undefined, l: undefined, r: undefined});
const n = (val: number) => node(val, '' + val);
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

describe.only('deletes', () => {
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
    test('delete non-leaf red node', () => {
      const {root, ins, del} = setup();
      ins(10);
      ins(9);
      ins(8);
      ins(7);
      ins(6);
      ins(5);
      // del(10);
      // del(8);
      // ins(4);
      // assertRedBlackTree(root.root);
      // ins(3);
      // assertRedBlackTree(root.root);
      // ins(2);
      // assertRedBlackTree(root.root);
      // ins(1);
      // assertRedBlackTree(root.root);
      // ins(0);
      // assertRedBlackTree(root.root);
      // ins(11);
      // assertRedBlackTree(root.root);
      // ins(5);
      // assertRedBlackTree(root.root);
      // ins(16);
      // assertRedBlackTree(root.root);
      // ins(4);
      // assertRedBlackTree(root.root);
      // ins(2);
      // assertRedBlackTree(root.root);
      // ins(0);
      // assertRedBlackTree(root.root);
      // ins(3);
      // assertRedBlackTree(root.root);
      // ins(2);
      // assertRedBlackTree(root.root);
      // ins(1);
      // assertRedBlackTree(root.root);
      // ins(25);
      // assertRedBlackTree(root.root);
      console.log(print(root.root));
      // const node = find(root.root, 6, comparator)! as IRbTreeNode<number, string>;
      // expect(node.b).toBe(false);
      // expect(node.k).toBe(15);
      // expect(node.v).toBe('15');
      // expect(size(root.root)).toBe(2);
      // root.root = remove(root.root, node);
      // assertRedBlackTree(root.root);
      // expect(size(root.root)).toBe(1);
      // expect(root.root!.k).toBe(10);
    });
  });
});
