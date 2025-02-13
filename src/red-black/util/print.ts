import {printBinary} from '../../print/printBinary';
import type {IRbTreeNode, RbHeadlessNode} from '../types';

const stringify = JSON.stringify;

export const print = (node: undefined | RbHeadlessNode | IRbTreeNode, tab: string = ''): string => {
  if (!node) return '∅';
  const {b, l, r, k, v} = node as IRbTreeNode;
  const content = k !== undefined ? ` { ${stringify(k)} = ${stringify(v)} }` : '';
  const bfFormatted = !b ? ` [red]` : '';
  return (
    node.constructor.name +
    `${bfFormatted}` +
    content +
    printBinary(tab, [l ? (tab) => print(l, tab) : null, r ? (tab) => print(r, tab) : null])
  );
};
