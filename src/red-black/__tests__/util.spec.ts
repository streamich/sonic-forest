import {find, size} from '../../util';
import {IRbTreeNode} from '../types';
import {remove} from '../util';
import {assertRedBlackTree, comparator, linkLeft, linkRight, n, setup} from './utils';

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

  test('delete root node', () => {
    const n148 = n(148, true);
    const n149 = n(149, true);
    const n150 = n(150, false);
    const n49 = n(-49, false);
    const n50 = n(-50, true);
    const n48 = n(-48, true);
    let root: typeof n148 | undefined = n148;
    linkLeft(root, n49);
    linkRight(root, n149);
    linkLeft(n49, n50);
    linkRight(n49, n48);
    linkRight(n149, n150);
    assertRedBlackTree(root);
    root = remove(root, n148);
    assertRedBlackTree(root);
  });

  test('single red child', () => {
    const n100: IRbTreeNode<number, string> = n(100, false);
    const n99: IRbTreeNode<number, string> = n(99, true);
    let root = n99;
    linkRight(root, n100);
    assertRedBlackTree(root);
    expect(size(root)).toBe(2);
    root = remove(root, root)!;
    expect(size(root)).toBe(1);
    assertRedBlackTree(root);
  });

  describe('removed node is double-black', () => {
    test('case 2', () => {
      const nn20: IRbTreeNode<number, string> = n(-20, true);
      const nn10: IRbTreeNode<number, string> = n(-10, true);
      const nn5: IRbTreeNode<number, string> = n(-5, true);
      const n10: IRbTreeNode<number, string> = n(10, true);
      const n20: IRbTreeNode<number, string> = n(20, true);
      const n40: IRbTreeNode<number, string> = n(40, true);
      const n50: IRbTreeNode<number, string> = n(50, true);
      const n60: IRbTreeNode<number, string> = n(60, false);
      const n80: IRbTreeNode<number, string> = n(80, true);
      let root = n10;
      linkLeft(root, nn10);
      linkRight(root, n40);
      linkLeft(nn10, nn20);
      linkRight(nn10, nn5);
      linkLeft(n40, n20);
      linkRight(n40, n60);
      linkLeft(n60, n50);
      linkRight(n60, n80);
      assertRedBlackTree(root);
      expect(size(root)).toBe(9);
      root = remove(root, n10)!;
      expect(size(root)).toBe(8);
      // console.log(print(root));
      assertRedBlackTree(root);
      expect(!!find(root, 10, comparator)).toBe(false);
      expect(!!find(root, -20, comparator)).toBe(true);
      expect(!!find(root, -10, comparator)).toBe(true);
      expect(!!find(root, -5, comparator)).toBe(true);
      expect(!!find(root, 20, comparator)).toBe(true);
      expect(!!find(root, 40, comparator)).toBe(true);
      expect(!!find(root, 50, comparator)).toBe(true);
      expect(!!find(root, 60, comparator)).toBe(true);
      expect(!!find(root, 80, comparator)).toBe(true);
    });

    test('case 3', () => {
      const n0: IRbTreeNode<number, string> = n(0, true);
      const n10: IRbTreeNode<number, string> = n(10, true);
      const n20: IRbTreeNode<number, string> = n(20, true);
      let root = n10;
      linkLeft(root, n0);
      linkRight(root, n20);
      assertRedBlackTree(root);
      root = remove(root, n0)!;
      assertRedBlackTree(root);
      // console.log(print(root));
      expect(size(root)).toBe(2);
      expect(!!find(root, 0, comparator)).toBe(false);
      expect(!!find(root, 10, comparator)).toBe(true);
      expect(!!find(root, 20, comparator)).toBe(true);
    });

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

    test('case 5 (after case 3)', () => {
      const n10: IRbTreeNode<number, string> = n(10, true);
      const nn20: IRbTreeNode<number, string> = n(-20, true);
      const nn30: IRbTreeNode<number, string> = n(-30, true);
      const nn40: IRbTreeNode<number, string> = n(-40, true);
      const n50: IRbTreeNode<number, string> = n(50, true);
      const n30: IRbTreeNode<number, string> = n(30, false);
      const n15: IRbTreeNode<number, string> = n(15, true);
      const n40: IRbTreeNode<number, string> = n(40, true);
      const n70: IRbTreeNode<number, string> = n(70, true);
      let root = n10;
      linkLeft(root, nn30);
      linkLeft(nn30, nn40);
      linkRight(nn30, nn20);
      linkRight(root, n50);
      linkLeft(n50, n30);
      linkRight(n50, n70);
      linkLeft(n30, n15);
      linkRight(n30, n40);
      assertRedBlackTree(root);
      expect(size(root)).toBe(9);
      root = remove(root, nn40)!;
      assertRedBlackTree(root);
      expect(size(root)).toBe(8);
      // console.log(print(root));
      expect(!!find(root, -40, comparator)).toBe(false);
      expect(!!find(root, -30, comparator)).toBe(true);
      expect(!!find(root, 10, comparator)).toBe(true);
      expect(!!find(root, 15, comparator)).toBe(true);
      expect(!!find(root, 30, comparator)).toBe(true);
      expect(!!find(root, 30, comparator)).toBe(true);
      expect(!!find(root, 70, comparator)).toBe(true);
    });

    test('case 6', () => {
      const n0: IRbTreeNode<number, string> = n(0, true);
      const n10: IRbTreeNode<number, string> = n(10, true);
      const n20: IRbTreeNode<number, string> = n(20, false);
      const n30: IRbTreeNode<number, string> = n(30, true);
      const n40: IRbTreeNode<number, string> = n(40, false);
      let root = n10;
      linkLeft(root, n0);
      linkRight(root, n30);
      linkLeft(n30, n20);
      linkRight(n30, n40);
      assertRedBlackTree(root);
      root = remove(root, n0)!;
      assertRedBlackTree(root);
      // console.log(print(root));
      expect(size(root)).toBe(4);
      expect(!!find(root, 0, comparator)).toBe(false);
      expect(!!find(root, 10, comparator)).toBe(true);
      expect(!!find(root, 20, comparator)).toBe(true);
      expect(!!find(root, 30, comparator)).toBe(true);
      expect(!!find(root, 40, comparator)).toBe(true);
    });

    test('case 3, to case 5, to case 6', () => {
      const nn40: IRbTreeNode<number, string> = n(-40, true);
      const nn30: IRbTreeNode<number, string> = n(-30, true);
      const nn20: IRbTreeNode<number, string> = n(-20, true);
      const n10: IRbTreeNode<number, string> = n(10, true);
      const n15: IRbTreeNode<number, string> = n(15, true);
      const n30: IRbTreeNode<number, string> = n(30, false);
      const n40: IRbTreeNode<number, string> = n(40, true);
      const n50: IRbTreeNode<number, string> = n(50, true);
      const n70: IRbTreeNode<number, string> = n(70, true);
      let root = n10;
      linkLeft(root, nn30);
      linkRight(root, n50);
      linkLeft(nn30, nn40);
      linkRight(nn30, nn20);
      linkLeft(n50, n30);
      linkRight(n50, n70);
      linkLeft(n30, n15);
      linkRight(n30, n40);
      assertRedBlackTree(root);
      expect(size(root)).toBe(9);
      root = remove(root, nn40)!;
      assertRedBlackTree(root);
      expect(size(root)).toBe(8);
      // console.log(print(root));
      expect(!!find(root, -40, comparator)).toBe(false);
      expect(!!find(root, -30, comparator)).toBe(true);
      expect(!!find(root, -20, comparator)).toBe(true);
      expect(!!find(root, 10, comparator)).toBe(true);
      expect(!!find(root, 15, comparator)).toBe(true);
      expect(!!find(root, 30, comparator)).toBe(true);
      expect(!!find(root, 40, comparator)).toBe(true);
      expect(!!find(root, 50, comparator)).toBe(true);
      expect(!!find(root, 70, comparator)).toBe(true);
    });
  });
});

describe('scale tests', () => {
  test('can insert and delete various numbers', () => {
    const {root, ins, del} = setup();
    ins(10);
    ins(11);
    ins(12);
    ins(50);
    ins(60);
    ins(25);
    ins(100);
    ins(88);
    ins(33);
    ins(22);
    ins(55);
    ins(59);
    ins(51);
    expect(size(root.root)).toBe(13);
    del(100);
    expect(size(root.root)).toBe(12);
    del(33);
    del(33);
    expect(size(root.root)).toBe(11);
    del(10);
    expect(size(root.root)).toBe(10);
    del(60);
    expect(size(root.root)).toBe(9);
    del(22);
    expect(size(root.root)).toBe(8);
  });

  test('numbers from 0 to 100', () => {
    const {root, ins, del} = setup();
    for (let i = 0; i <= 100; i++) {
      ins(i);
      expect(size(root.root)).toBe(i + 1);
    }
    for (let i = 0; i <= 100; i++) {
      del(i);
      expect(size(root.root)).toBe(100 - i);
    }
  });

  test('numbers from 100 to 11', () => {
    const {root, ins, del} = setup();
    for (let i = 100; i >= 11; i--) ins(i);
    for (let i = 100; i >= 11; i--) del(i);
    expect(root.root).toBeUndefined();
  });

  test('numbers going both directions from 50', () => {
    const {root, ins, del} = setup();
    for (let i = 0; i <= 100; i++) {
      ins(50 + i);
      ins(50 - i);
      expect(size(root.root)).toBe(i * 2 + 2);
    }
    for (let i = 0; i <= 100; i++) {
      del(50 - i);
      del(50 + i);
    }
    expect(root.root).toBeUndefined();
  });

  test('random numbers from 0 to 100', () => {
    const {root, ins, del} = setup();
    for (let i = 0; i <= 1000; i++) {
      const num = (Math.random() * 100) | 0;
      const found = find(root.root!, num, comparator);
      if (!found) ins(num);
    }
    const size1 = size(root.root);
    expect(size1 > 4).toBe(true);
    for (let i = 0; i <= 400; i++) {
      const num = (Math.random() * 100) | 0;
      del(num);
    }
    const size2 = size(root.root);
    expect(size2 < size1).toBe(true);
  });
});
