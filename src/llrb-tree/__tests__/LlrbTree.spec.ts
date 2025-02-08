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
});
