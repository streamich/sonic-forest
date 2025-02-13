import {assertRedBlackTree} from '../../red-black/__tests__/utils';
import {LlrbTree} from '../LlrbTree';

describe('.put()', () => {
  test('can insert one element', () => {
    const tree = new LlrbTree<number, string>();
    expect(tree.root).toBeUndefined();
    assertRedBlackTree(tree.root as any);
    tree.set(1, 'a');
    expect(tree.root).toMatchObject({k: 1, v: 'a', b: true});
    assertRedBlackTree(tree.root as any);
    const val = tree.get(1);
    expect(val).toBe('a');
  });

  test('can insert the same element', () => {
    const tree = new LlrbTree<string, string>();
    tree.set('a', 'a');
    tree.set('b', 'b');
    tree.set('b', 'b');
    tree.set('b', 'b');
    tree.set('a', 'a');
    tree.set('c', 'c');
    tree.set('d', 'd');
    tree.set('e', 'e');
    tree.set('a', 'a');
  });

  test('can insert specific numbers', () => {
    const tree = new LlrbTree<number, number>();
    const nums = [88, 13, 30, 18, 35, 98, 51, 76, 96, 72, 94, 59, 92];
    for (const num of nums) {
      tree.set(num, num);
      assertRedBlackTree(tree.root);
    }
    expect(tree.size()).toBe(nums.length);
    for (const num of nums) {
      tree.set(num, num);
      assertRedBlackTree(tree.root);
    }
    expect(tree.size()).toBe(nums.length);
    for (const num of nums) {
      expect(tree.get(num)).toBe(num);
    }
    expect(tree.size()).toBe(nums.length);
  });

  describe('can insert multiple elements', () => {
    type Trace = [name: string, chars: string[]];
    const traces: Trace[] = [
      ['abc', ['a', 'b', 'c']],
      ['standard indexing client', ['S', 'E', 'A', 'R', 'C', 'H', 'X', 'M', 'P', 'L']],
      ['keys in increasing order', ['A', 'C', 'E', 'H', 'L', 'M', 'P', 'R', 'S', 'X']],
    ];

    for (const [name, chars] of traces) {
      test(name, () => {
        const tree = new LlrbTree<string, string>();
        for (let i = 0; i < chars.length; i++) {
          expect(tree.size()).toBe(i);
          const char = chars[i];
          expect(tree.get(char)).toBe(undefined);
          tree.set(char, char);
          assertRedBlackTree(tree.root);
          expect(tree.size()).toBe(i + 1);
          expect(tree.get(char)).toBe(char);
        }
      });
    }
  });

  describe('hundred numbers in increasing order', () => {
    test('once', () => {
      const tree = new LlrbTree<number, number>();
      for (let i = 0; i < 100; i++) {
        const num = i;
        tree.set(num, num);
        assertRedBlackTree(tree.root);
      }
    });

    test('twice', () => {
      const tree = new LlrbTree<number, number>();
      for (let i = 0; i < 100; i++) {
        const num = i;
        tree.set(num, num);
        assertRedBlackTree(tree.root);
      }
      for (let i = 0; i < 100; i++) {
        const num = i;
        tree.set(num, num);
        assertRedBlackTree(tree.root);
      }
    });
  });

  // describe('hundred random numbers', () => {
  //   test('...', () => {
  //     const tree = new LlrbTree<number, number>();
  //     for (let i = 0; i < 100; i++) {
  //       const num = Math.floor(Math.random() * 100);
  //       console.log(num);
  //       tree.set(num, num);
  //       assertRedBlackTree(tree.root);
  //     }
  //   });
  // });
});
