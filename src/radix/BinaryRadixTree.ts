import {Printable} from '../print/types';
import {BinaryTrieNode} from './BinaryTrieNode';
import {Slice} from './Slice';
import {insert, find, remove} from './binaryRadix';

export class BinaryRadixTree<V = unknown> extends BinaryTrieNode<V> implements Printable {
  public size: number = 0;

  constructor() {
    super(new Slice(new Uint8Array(), 0, 0), undefined as any as V);
  }

  public set(key: Uint8Array, value: V): void {
    this.size += insert(this, key, value);
  }

  public get(key: Uint8Array): V | undefined {
    const node = find(this, key) as BinaryTrieNode<V> | undefined;
    return node && node.v;
  }

  public delete(key: Uint8Array): boolean {
    const removed = remove(this, key);
    if (removed) this.size--;
    return removed;
  }
}