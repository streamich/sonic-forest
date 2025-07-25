import {assertRedBlackTree} from '../../red-black/__tests__/utils';
import {assertLlrbTree} from './llrb-utils';
import {LlrbTree} from '../LlrbTree';

describe('.put()', () => {
  test('can insert one element', () => {
    const tree = new LlrbTree<number, string>();
    expect(tree.root).toBeUndefined();
    assertRedBlackTree(tree.root as any);
    tree.set(1, 'a');
    expect(tree.root).toMatchObject({k: 1, v: 'a', b: true});
    assertRedBlackTree(tree.root as any);
    assertLlrbTree(tree.root);
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
      assertLlrbTree(tree.root);
    }
    expect(tree.size()).toBe(nums.length);
    for (const num of nums) {
      tree.set(num, num);
      assertRedBlackTree(tree.root);
      assertLlrbTree(tree.root);
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

describe('.del()', () => {
  test('returns false when deleting from empty tree', () => {
    const tree = new LlrbTree<number, string>();
    expect(tree.del(1)).toBe(false);
    expect(tree.size()).toBe(0);
    expect(tree.root).toBeUndefined();
  });

  test('returns false when deleting non-existent key', () => {
    const tree = new LlrbTree<number, string>();
    tree.set(1, 'a');
    expect(tree.del(2)).toBe(false);
    expect(tree.size()).toBe(1);
    expect(tree.get(1)).toBe('a');
  });

  test('can delete single element (root)', () => {
    const tree = new LlrbTree<number, string>();
    tree.set(1, 'a');
    expect(tree.size()).toBe(1);
    expect(tree.del(1)).toBe(true);
    expect(tree.size()).toBe(0);
    expect(tree.root).toBeUndefined();
    expect(tree.get(1)).toBeUndefined();
    assertLlrbTree(tree.root);
  });

  test('can delete leaf nodes', () => {
    const tree = new LlrbTree<number, number>();
    tree.set(2, 2);
    tree.set(1, 1);
    tree.set(3, 3);
    assertRedBlackTree(tree.root);
    
    expect(tree.del(1)).toBe(true);
    expect(tree.size()).toBe(2);
    expect(tree.get(1)).toBeUndefined();
    expect(tree.get(2)).toBe(2);
    expect(tree.get(3)).toBe(3);
    assertRedBlackTree(tree.root);
    
    expect(tree.del(3)).toBe(true);
    expect(tree.size()).toBe(1);
    expect(tree.get(3)).toBeUndefined();
    expect(tree.get(2)).toBe(2);
    assertRedBlackTree(tree.root);
  });

  test('can delete nodes with one child', () => {
    const tree = new LlrbTree<number, number>();
    tree.set(5, 5);
    tree.set(3, 3);
    tree.set(7, 7);
    tree.set(1, 1);
    tree.set(9, 9);
    assertRedBlackTree(tree.root);
    
    // Delete node with left child
    expect(tree.del(3)).toBe(true);
    expect(tree.size()).toBe(4);
    expect(tree.get(3)).toBeUndefined();
    expect(tree.get(1)).toBe(1);
    assertRedBlackTree(tree.root);
    
    // Delete node with right child
    expect(tree.del(7)).toBe(true);
    expect(tree.size()).toBe(3);
    expect(tree.get(7)).toBeUndefined();
    expect(tree.get(9)).toBe(9);
    assertRedBlackTree(tree.root);
  });

  test('can delete nodes with two children', () => {
    const tree = new LlrbTree<number, number>();
    tree.set(5, 5);
    tree.set(3, 3);
    tree.set(7, 7);
    tree.set(1, 1);
    tree.set(4, 4);
    tree.set(6, 6);
    tree.set(9, 9);
    assertRedBlackTree(tree.root);
    
    expect(tree.del(3)).toBe(true);
    expect(tree.size()).toBe(6);
    expect(tree.get(3)).toBeUndefined();
    expect(tree.get(1)).toBe(1);
    expect(tree.get(4)).toBe(4);
    assertRedBlackTree(tree.root);
    
    expect(tree.del(5)).toBe(true); // Delete root with two children
    expect(tree.size()).toBe(5);
    expect(tree.get(5)).toBeUndefined();
    assertRedBlackTree(tree.root);
  });

  test('can delete all elements', () => {
    const tree = new LlrbTree<number, number>();
    const nums = [5, 3, 7, 1, 4, 6, 9, 2, 8];
    
    // Insert all numbers
    for (const num of nums) {
      tree.set(num, num);
      assertRedBlackTree(tree.root);
    }
    expect(tree.size()).toBe(nums.length);
    
    // Delete all numbers
    for (const num of nums) {
      expect(tree.del(num)).toBe(true);
      expect(tree.get(num)).toBeUndefined();
      assertRedBlackTree(tree.root);
      assertLlrbTree(tree.root);
    }
    
    expect(tree.size()).toBe(0);
    expect(tree.root).toBeUndefined();
  });

  test('maintains min/max correctly during deletions', () => {
    const tree = new LlrbTree<number, number>();
    const nums = [5, 3, 7, 1, 4, 6, 9];
    
    for (const num of nums) {
      tree.set(num, num);
    }
    
    expect(tree.min?.k).toBe(1);
    expect(tree.max?.k).toBe(9);
    
    // Delete min
    tree.del(1);
    expect(tree.min?.k).toBe(3);
    expect(tree.max?.k).toBe(9);
    
    // Delete max
    tree.del(9);
    expect(tree.min?.k).toBe(3);
    expect(tree.max?.k).toBe(7);
    
    // Delete current min
    tree.del(3);
    expect(tree.min?.k).toBe(4);
    
    // Delete current max
    tree.del(7);
    expect(tree.max?.k).toBe(6);
  });

  test('handles complex deletion patterns', () => {
    const tree = new LlrbTree<number, number>();
    const nums = [88, 13, 30, 18, 35, 98, 51, 76, 96, 72, 94, 59, 92];
    
    // Insert all
    for (const num of nums) {
      tree.set(num, num);
      assertRedBlackTree(tree.root);
    }
    
    // Delete some elements in different order
    const toDelete = [13, 98, 30, 76, 88];
    for (const num of toDelete) {
      expect(tree.del(num)).toBe(true);
      expect(tree.get(num)).toBeUndefined();
      assertRedBlackTree(tree.root);
    }
    
    // Verify remaining elements
    const remaining = nums.filter(n => !toDelete.includes(n));
    expect(tree.size()).toBe(remaining.length);
    for (const num of remaining) {
      expect(tree.get(num)).toBe(num);
    }
  });

  test('can delete and re-insert same elements', () => {
    const tree = new LlrbTree<string, string>();
    const chars = ['S', 'E', 'A', 'R', 'C', 'H'];
    
    // Insert
    for (const char of chars) {
      tree.set(char, char);
      assertRedBlackTree(tree.root);
    }
    
    // Delete half
    for (let i = 0; i < chars.length / 2; i++) {
      tree.del(chars[i]);
      assertRedBlackTree(tree.root);
    }
    
    // Re-insert deleted ones
    for (let i = 0; i < chars.length / 2; i++) {
      tree.set(chars[i], chars[i]);
      assertRedBlackTree(tree.root);
    }
    
    // Verify all are present
    expect(tree.size()).toBe(chars.length);
    for (const char of chars) {
      expect(tree.get(char)).toBe(char);
    }
  });

  test('delete from tree with sequential inserts and deletes', () => {
    const tree = new LlrbTree<number, number>();
    
    // Insert 1-10
    for (let i = 1; i <= 10; i++) {
      tree.set(i, i);
      assertRedBlackTree(tree.root);
    }
    
    // Delete even numbers
    for (let i = 2; i <= 10; i += 2) {
      expect(tree.del(i)).toBe(true);
      assertRedBlackTree(tree.root);
    }
    
    // Verify odd numbers remain
    for (let i = 1; i <= 10; i++) {
      if (i % 2 === 1) {
        expect(tree.get(i)).toBe(i);
      } else {
        expect(tree.get(i)).toBeUndefined();
      }
    }
    
    expect(tree.size()).toBe(5);
  });

  test('delete with duplicated operations', () => {
    const tree = new LlrbTree<number, number>();
    tree.set(1, 1);
    tree.set(2, 2);
    tree.set(3, 3);
    
    // First deletion should succeed
    expect(tree.del(2)).toBe(true);
    expect(tree.size()).toBe(2);
    
    // Second deletion of same key should fail
    expect(tree.del(2)).toBe(false);
    expect(tree.size()).toBe(2);
    
    assertRedBlackTree(tree.root);
  });

  test('handles large deletions', () => {
    const tree = new LlrbTree<number, number>();
    const size = 100;
    
    // Insert 1-100
    for (let i = 1; i <= size; i++) {
      tree.set(i, i);
    }
    
    // Delete all odd numbers
    for (let i = 1; i <= size; i += 2) {
      expect(tree.del(i)).toBe(true);
      assertRedBlackTree(tree.root);
    }
    
    expect(tree.size()).toBe(size / 2);
    
    // Verify even numbers remain
    for (let i = 2; i <= size; i += 2) {
      expect(tree.get(i)).toBe(i);
    }
  });
});
