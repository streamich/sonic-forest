import {Printable} from '../print/types';
import {TrieNode} from '../trie/TrieNode';
import {insert, find, remove} from './radix';

/**
 * Radix tree (compressed trie) implementation for string keys.
 * 
 * A radix tree is a space-optimized trie where nodes with single children
 * are merged with their parents. This provides efficient storage and lookup
 * for strings with common prefixes, making it ideal for applications like
 * routing, autocomplete, and IP routing tables.
 * 
 * Key features:
 * - Compressed storage of string keys
 * - O(k) operations where k is the key length
 * - Automatic prefix compression
 * - Memory efficient for sparse key spaces
 * 
 * @example
 * ```typescript
 * const tree = new RadixTree<string>();
 * tree.set('/api/users', 'users-handler');
 * tree.set('/api/posts', 'posts-handler');
 * tree.set('/api/posts/new', 'new-post-handler');
 * 
 * console.log(tree.get('/api/users')); // 'users-handler'
 * console.log(tree.size); // 3
 * ```
 * 
 * @template V - The type of values stored in the tree
 */
export class RadixTree<V = unknown> extends TrieNode<V> implements Printable {
  /** The number of key-value pairs stored in the tree */
  public size: number = 0;

  /**
   * Creates a new radix tree instance.
   */
  constructor() {
    super('', undefined as any as V);
  }

  /**
   * Inserts or updates a key-value pair in the radix tree.
   * 
   * @param key - The string key to insert
   * @param value - The value to associate with the key
   */
  public set(key: string, value: V): void {
    this.size += insert(this, key, value);
  }

  /**
   * Retrieves the value associated with the given key.
   * 
   * @param key - The string key to lookup
   * @returns The associated value, or undefined if the key is not found
   */
  public get(key: string): V | undefined {
    const node = find(this, key) as TrieNode<V> | undefined;
    return node && node.v;
  }

  /**
   * Removes a key-value pair from the radix tree.
   * 
   * @param key - The string key to remove
   * @returns true if the key was found and removed, false otherwise
   */
  public delete(key: string): boolean {
    const removed = remove(this, key);
    if (removed) this.size--;
    return removed;
  }
}
