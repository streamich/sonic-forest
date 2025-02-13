import {printBinary} from '../print/printBinary';
import type {HeadlessNode, ITreeNode} from '../types';

const stringify = JSON.stringify;

export const print = (node: undefined | HeadlessNode, tab: string = ''): string => {
  if (!node) return '∅';
  const {l, r, k, v} = node as ITreeNode<unknown, unknown>;
  const content = k !== undefined ? ` { ${stringify(k)} = ${stringify(v)} }` : '';
  return (
    node.constructor.name +
    content +
    printBinary(tab, [l ? (tab) => print(l, tab) : null, r ? (tab) => print(r, tab) : null])
  );
};
