import {Printable} from '../print/types';
import {BinaryTrieNode} from './BinaryTrieNode';
import {Slice} from './Slice';
import {insert, find, remove} from './binaryRadix';

/**
 * Binary radix tree implementation for Uint8Array keys.
 * 
 * A binary radix tree is a compressed trie optimized for binary data keys.
 * It provides efficient storage and lookup for binary keys such as protocol
 * headers, file paths as binary data, cryptographic hashes, and network
 * packet classification.
 * 
 * Key features:
 * - Optimized for Uint8Array keys
 * - Efficient prefix compression using Slice references
 * - O(k) operations where k is the key length in bytes
 * - Memory efficient through slice-based key storage
 * - Binary-safe (handles null bytes and arbitrary data)
 * 
 * @example
 * ```typescript
 * const tree = new BinaryRadixTree<string>();
 * 
 * // HTTP method routing with binary keys
 * tree.set(new Uint8Array([0x47, 0x45, 0x54, 0x20]), 'GET ');     // "GET "
 * tree.set(new Uint8Array([0x50, 0x4F, 0x53, 0x54]), 'POST');      // "POST"
 * tree.set(new Uint8Array([0x50, 0x55, 0x54, 0x20]), 'PUT ');      // "PUT "
 * 
 * console.log(tree.get(new Uint8Array([0x47, 0x45, 0x54, 0x20]))); // "GET "
 * console.log(tree.size); // 3
 * ```
 * 
 * @template V - The type of values stored in the tree
 */
export class BinaryRadixTree<V = unknown> extends BinaryTrieNode<V> implements Printable {
  /** The number of key-value pairs stored in the tree */
  public size: number = 0;

  /**
   * Creates a new binary radix tree instance.
   */
  constructor() {
    super(new Slice(new Uint8Array(), 0, 0), undefined as any as V);
  }

  /**
   * Inserts or updates a key-value pair in the binary radix tree.
   * 
   * @param key - The Uint8Array key to insert
   * @param value - The value to associate with the key
   */
  public set(key: Uint8Array, value: V): void {
    this.size += insert(this, key, value);
  }

  /**
   * Retrieves the value associated with the given binary key.
   * 
   * @param key - The Uint8Array key to lookup
   * @returns The associated value, or undefined if the key is not found
   */
  public get(key: Uint8Array): V | undefined {
    const node = find(this, key) as BinaryTrieNode<V> | undefined;
    return node && node.v;
  }

  /**
   * Removes a key-value pair from the binary radix tree.
   * 
   * @param key - The Uint8Array key to remove
   * @returns true if the key was found and removed, false otherwise
   */
  public delete(key: Uint8Array): boolean {
    const removed = remove(this, key);
    if (removed) this.size--;
    return removed;
  }
}
