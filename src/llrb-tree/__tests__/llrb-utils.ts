import {assertRedBlackTree} from '../../red-black/__tests__/utils';
import {LlrbNode} from '../LlrbTree';

export const assertLlrbTree = <K, V>(root?: LlrbNode<K, V>): void => {
  // First, verify it's a valid red-black tree
  assertRedBlackTree(root as any);
  
  if (!root) return;
  
  // Then, verify the left-leaning property
  assertLeftLeaningProperty(root);
};

const assertLeftLeaningProperty = <K, V>(node: LlrbNode<K, V>): void => {
  // Left-leaning property: if a node has only one red child, it must be the left child
  const {l, r, b} = node;
  
  // If right child is red, left child must also be red (no lone right red links)
  if (r && !r.b && (!l || l.b)) {
    throw new Error(`Left-leaning property violated: node has red right child but black/null left child at key ${node.k}`);
  }
  
  // Recursively check children
  if (l) assertLeftLeaningProperty(l);
  if (r) assertLeftLeaningProperty(r);
};