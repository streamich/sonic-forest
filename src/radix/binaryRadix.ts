import {BinaryTrieNode} from './BinaryTrieNode';
import {Slice, getCommonPrefixLength} from './Slice';
import {findOrNextLower, first, insertLeft, insertRight, next, remove as plainRemove} from '../util';

/**
 * @param root Root of the Binary Radix Tree
 * @param path Associative key to insert (Uint8Array)
 * @param value Value to insert
 * @returns Number of new nodes created
 */
export const insert = (root: BinaryTrieNode, path: Uint8Array, value: unknown): number => {
  let curr: BinaryTrieNode | undefined = root;
  let k = Slice.fromUint8Array(path);
  
  main: while (curr) {
    let child: BinaryTrieNode | undefined = curr.children;
    if (!child) {
      curr.children = new BinaryTrieNode(k, value);
      return 1;
    }
    
    const firstByte = k.length > 0 ? k.at(0) : -1;
    let prevChild: BinaryTrieNode | undefined = undefined;
    let cmp: boolean = false;
    
    child: while (child) {
      prevChild = child;
      const childFirstByte = child.k.length > 0 ? child.k.at(0) : -1;
      
      if (childFirstByte === firstByte) {
        const commonPrefixLength = getCommonPrefixLength(child.k, k);
        const isChildKContained = commonPrefixLength === child.k.length;
        const isKContained = commonPrefixLength === k.length;
        const areKeysEqual = isChildKContained && isKContained;
        
        if (areKeysEqual) {
          child.v = value;
          return 0;
        }
        
        if (isChildKContained) {
          k = k.substring(commonPrefixLength);
          curr = child;
          continue main;
        }
        
        if (isKContained) {
          const newChild = new BinaryTrieNode(child.k.substring(commonPrefixLength), child.v);
          newChild.children = child.children;
          child.k = k.substring(0, commonPrefixLength);
          child.v = value;
          child.children = newChild;
          return 1;
        }
        
        if (commonPrefixLength) {
          const newChild = new BinaryTrieNode(child.k.substring(commonPrefixLength), child.v);
          newChild.children = child.children;
          child.k = child.k.substring(0, commonPrefixLength);
          child.v = undefined;
          child.children = newChild;
          curr = child;
          k = k.substring(commonPrefixLength);
          continue main;
        }
      }
      
      cmp = childFirstByte > firstByte;
      if (cmp) child = child.l;
      else child = child.r;
    }
    
    if (prevChild) {
      const node = new BinaryTrieNode(k, value);
      if (cmp) insertLeft(node, prevChild);
      else insertRight(node, prevChild);
      return 1;
    }
    break;
  }
  return 0;
};

/** Finds the node which matches `key`, if any. */
export const find = (node: BinaryTrieNode, key: Uint8Array): undefined | BinaryTrieNode => {
  if (key.length === 0) return node;
  
  const keySlice = Slice.fromUint8Array(key);
  let offset: number = 0;
  
  while (node) {
    const remainingKey = keySlice.substring(offset);
    if (remainingKey.length === 0) return node;
    
    const child = findOrNextLower(node.children, remainingKey, (a: Slice, b: Slice) => {
      const aByte = a.length > 0 ? a.at(0) : -1;
      const bByte = b.length > 0 ? b.at(0) : -1;
      return aByte > bByte ? 1 : -1;
    }) as BinaryTrieNode | undefined;
    
    if (!child) return undefined;
    
    const childKey = child.k;
    const childKeyLength = childKey.length;
    let commonPrefixLength = 0;
    const limit = Math.min(childKeyLength, remainingKey.length);
    
    for (
      ;
      commonPrefixLength < limit && childKey.at(commonPrefixLength) === remainingKey.at(commonPrefixLength);
      commonPrefixLength++
    );
    
    if (!commonPrefixLength) return undefined;
    offset += commonPrefixLength;
    
    if (offset === key.length) return child;
    if (commonPrefixLength < childKeyLength) return undefined;
    
    node = child;
  }
  return undefined;
};

/** Finds the node which matches `key`, and returns a list of all its parents. */
export const findWithParents = (node: BinaryTrieNode, key: Uint8Array): undefined | BinaryTrieNode[] => {
  if (key.length === 0) return undefined;
  
  const list: BinaryTrieNode[] = [node];
  const keySlice = Slice.fromUint8Array(key);
  let offset: number = 0;
  
  while (node) {
    const remainingKey = keySlice.substring(offset);
    
    const child = findOrNextLower(node.children, remainingKey, (a: Slice, b: Slice) => {
      const aByte = a.length > 0 ? a.at(0) : -1;
      const bByte = b.length > 0 ? b.at(0) : -1;
      return aByte > bByte ? 1 : -1;
    }) as BinaryTrieNode | undefined;
    
    if (!child) return undefined;
    
    const childKey = child.k;
    const childKeyLength = childKey.length;
    let commonPrefixLength = 0;
    const limit = Math.min(childKeyLength, remainingKey.length);
    
    for (
      ;
      commonPrefixLength < limit && childKey.at(commonPrefixLength) === remainingKey.at(commonPrefixLength);
      commonPrefixLength++
    );
    
    if (!commonPrefixLength) return undefined;
    offset += commonPrefixLength;
    
    if (commonPrefixLength < childKeyLength) return undefined;
    list.push(child);
    
    if (offset === key.length) return list;
    node = child;
  }
  return undefined;
};

export const remove = (root: BinaryTrieNode, key: Uint8Array): boolean => {
  if (key.length === 0) {
    const deleted = root.v !== undefined;
    root.v = undefined;
    return deleted;
  }
  
  const list = findWithParents(root, key);
  if (!list) return false;
  
  const length = list.length;
  const lastIndex = length - 1;
  const last = list[lastIndex];
  const deleted = last.v !== undefined;
  last.v = undefined;
  
  for (let i = lastIndex; i >= 1; i--) {
    const child = list[i];
    const parent = list[i - 1];
    if (child.v || child.children) break;
    parent.children = plainRemove(parent.children, child);
  }
  
  return deleted;
};

export const toRecord = (
  node: BinaryTrieNode | undefined,
  prefix: Uint8Array = new Uint8Array(),
  record: Record<string, unknown> = {},
): Record<string, unknown> => {
  if (!node) return record;
  
  const currentPrefix = new Uint8Array([...prefix, ...node.k.toUint8Array()]);
  
  if (node.v !== undefined) {
    const key = Array.from(currentPrefix).join(',');
    record[key] = node.v;
  }
  
  let child = first<BinaryTrieNode>(node.children);
  if (!child) return record;
  
  do toRecord(child, currentPrefix, record);
  while ((child = next<BinaryTrieNode>(child!)));
  
  return record;
};

export const print = (node: BinaryTrieNode, tab: string = ''): string => {
  return node.toString(tab);
};