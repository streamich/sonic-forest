import {assertRedBlackTree} from '../../red-black/__tests__/utils';
import {assertLlrbTree} from './llrb-utils';
import {LlrbTree} from '../LlrbTree';
import {next} from '../../util';

const randomInt = (max: number) => Math.floor(Math.random() * max);

describe('LlrbTree fuzzing', () => {
  for (let instance = 0; instance < 50; instance++) {
    test(`fuzzing instance ${instance}`, () => {
      const tree = new LlrbTree<number, number>();
      const shadowMap = new Map<number, number>();
      const operations = randomInt(500) + 100; // 100-600 operations

      for (let op = 0; op < operations; op++) {
        const key = randomInt(100) + 1; // Keys 1-100
        const action = Math.random();

        if (action < 0.6) {
          // 60% insertions
          const value = key * 2; // Some deterministic value
          tree.set(key, value);
          shadowMap.set(key, value);

          // Validate tree properties after every 10th insertion
          if (op % 10 === 0) {
            assertRedBlackTree(tree.root);
            assertLlrbTree(tree.root);
          }
        } else if (action < 0.9) {
          // 30% deletions
          const deleted = tree.del(key);
          const shadowDeleted = shadowMap.delete(key);

          expect(deleted).toBe(shadowDeleted);

          // Validate tree properties after every deletion
          if (tree.root) {
            assertRedBlackTree(tree.root);
            assertLlrbTree(tree.root);
          }
        } else {
          // 10% lookups (validation)
          const treeValue = tree.get(key);
          const shadowValue = shadowMap.get(key);
          expect(treeValue).toBe(shadowValue);
        }

        // Periodically validate the entire tree contents match
        if (op % 50 === 0) {
          expect(tree.size()).toBe(shadowMap.size);

          // Check all keys in shadow map exist in tree
          for (const [k, v] of shadowMap) {
            expect(tree.get(k)).toBe(v);
          }

          // Check tree doesn't have extra keys
          let treeSize = 0;
          let current = tree.min;
          while (current) {
            expect(shadowMap.has(current.k)).toBe(true);
            expect(shadowMap.get(current.k)).toBe(current.v);
            treeSize++;
            current = next(current);
          }
          expect(treeSize).toBe(shadowMap.size);
        }
      }

      // Final validation
      expect(tree.size()).toBe(shadowMap.size);
      if (tree.root) {
        assertRedBlackTree(tree.root);
        assertLlrbTree(tree.root);
      }

      // Validate all entries
      for (const [k, v] of shadowMap) {
        expect(tree.get(k)).toBe(v);
      }
    });
  }
});
