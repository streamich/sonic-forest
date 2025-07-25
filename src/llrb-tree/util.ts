import {LlrbNode} from './LlrbTree';
import type {Comparator} from '../types';

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
 */
export function rotateLeft<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> {
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
  }

  x.b = node.b;
  node.b = false;
  return x;
}

/**
 * Rotate right with parent pointer updates.
 */
export function rotateRight<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> {
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
  }

  x.b = node.b;
  node.b = false;
  return x;
}

/**
 * Move red link to the left.
 */
export function moveRedLeft<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> {
  colorFlip(node);
  if (node.r && (node.r.l ? !node.r.l.b : false)) {
    node.r = rotateRight(node.r);
    node = rotateLeft(node);
    colorFlip(node);
  }
  return node;
}

/**
 * Move red link to the right.
 */
export function moveRedRight<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> {
  colorFlip(node);
  if (node.l && (node.l.l ? !node.l.l.b : false)) {
    node = rotateRight(node);
    colorFlip(node);
  }
  return node;
}

/**
 * Balance the LLRB tree after modifications.
 */
export function balance<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> {
  if (node.r ? !node.r.b : false) {
    node = rotateLeft(node);
  }
  if ((node.l ? !node.l.b : false) && node.l && (node.l.l ? !node.l.l.b : false)) {
    node = rotateRight(node);
  }
  if ((node.l ? !node.l.b : false) && (node.r ? !node.r.b : false)) {
    colorFlip(node);
  }
  return node;
}

/**
 * Delete the minimum node from the subtree.
 */
export function deleteMin<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> | undefined {
  if (!node.l) {
    return undefined;
  }
  if (!(node.l ? !node.l.b : false) && node.l && !(node.l.l ? !node.l.l.b : false)) {
    node = moveRedLeft(node);
  }
  node.l = deleteMin(node.l!);
  if (node.l) node.l.p = node;
  return balance(node);
}

/**
 * Find the minimum node in the subtree.
 */
export function min<K, V>(node: LlrbNode<K, V>): LlrbNode<K, V> {
  while (node.l) {
    node = node.l;
  }
  return node;
}

/**
 * Delete a node with the given key from the subtree.
 */
export function deleteNode<K, V>(
  node: LlrbNode<K, V> | undefined,
  k: K,
  comparator: Comparator<K>,
): LlrbNode<K, V> | undefined {
  if (!node) return undefined;

  const cmp = comparator(k, node.k);

  if (cmp < 0) {
    if (!node.l) return node;
    if (!(node.l ? !node.l.b : false) && node.l && !(node.l.l ? !node.l.l.b : false)) {
      node = moveRedLeft(node);
    }
    node.l = deleteNode(node.l!, k, comparator);
    if (node.l) node.l.p = node;
  } else {
    if (node.l ? !node.l.b : false) {
      node = rotateRight(node);
    }

    if (cmp === 0 && !node.r) {
      return undefined;
    }

    if (!node.r) return node;
    if (!(node.r ? !node.r.b : false) && !(node.r.l ? !node.r.l.b : false)) {
      node = moveRedRight(node);
    }

    if (comparator(k, node.k) === 0) {
      const minNode = min(node.r!);
      node.k = minNode.k;
      node.v = minNode.v;
      node.r = deleteMin(node.r!);
      if (node.r) node.r.p = node;
    } else {
      node.r = deleteNode(node.r, k, comparator);
      if (node.r) node.r.p = node;
    }
  }

  return balance(node);
}
