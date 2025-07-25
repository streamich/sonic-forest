import {LlrbNode} from './LlrbTree';

/**
 * Check if a node is red (non-black).
 */
export function isRed<K, V>(node: LlrbNode<K, V> | undefined): boolean {
  return node ? !node.b : false;
}

/**
 * Flip colors of node and its children.
 */
export function colorFlip<K, V>(node: LlrbNode<K, V>): void {
  node.b = !node.b;
  if (node.l) node.l.b = !node.l.b;
  if (node.r) node.r.b = !node.r.b;
}

/**
 * Rotate left with parent pointer updates.
 * The rootSetter callback is called if the rotated node becomes the new root.
 */
export function rotateLeft<K, V>(
  node: LlrbNode<K, V>, 
  rootSetter: (newRoot: LlrbNode<K, V>) => void
): LlrbNode<K, V> {
  const x = node.r!;
  node.r = x.l;
  if (x.l) x.l.p = node;
  x.l = node;
  x.p = node.p;
  node.p = x;
  
  // Update parent's child pointer
  if (x.p) {
    if (x.p.l === node) x.p.l = x;
    else x.p.r = x;
  } else {
    rootSetter(x);
  }
  
  x.b = node.b;
  node.b = false;
  return x;
}

/**
 * Rotate right with parent pointer updates.
 * The rootSetter callback is called if the rotated node becomes the new root.
 */
export function rotateRight<K, V>(
  node: LlrbNode<K, V>, 
  rootSetter: (newRoot: LlrbNode<K, V>) => void
): LlrbNode<K, V> {
  const x = node.l!;
  node.l = x.r;
  if (x.r) x.r.p = node;
  x.r = node;
  x.p = node.p;
  node.p = x;
  
  // Update parent's child pointer
  if (x.p) {
    if (x.p.l === node) x.p.l = x;
    else x.p.r = x;
  } else {
    rootSetter(x);
  }
  
  x.b = node.b;
  node.b = false;
  return x;
}