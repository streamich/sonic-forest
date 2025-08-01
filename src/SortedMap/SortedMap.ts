import {printTree} from '../print/printTree';
import {IteratorType} from './constants';
import {OrderedMapIterator} from './SortedMapIterator';
import {TreeNode} from './SortedMapNode';
import {TreeNodeEnableIndex} from './SortedMapNode';
import {throwIteratorAccessError} from './util';
import {next} from '../util';
import {print} from '../red-black/util/print';
import type {Comparator, SonicMap, SonicNodePublicReference} from '../types';

/**
 * High-performance sorted map implementation with optional indexing support.
 *
 * This sorted map provides a complete implementation with support for ordered
 * iteration, range queries, and optional O(log n) index-based access. It's
 * designed for applications that need both key-based and positional access
 * to sorted data.
 *
 * Features:
 * - O(log n) insertion, deletion, and lookup
 * - Ordered iteration in sorted key order
 * - Optional index-based access when enableIndex is true
 * - Range queries and nearest neighbor searches
 * - Iterator support for for...of loops
 *
 * @example
 * ```typescript
 * const map = new SortedMap<number, string>();
 * map.set(3, 'three');
 * map.set(1, 'one');
 * map.set(2, 'two');
 *
 * // Iteration in sorted order
 * for (const node of map) {
 *   console.log(node.k, node.v); // 1 'one', 2 'two', 3 'three'
 * }
 *
 * // With indexing enabled
 * const indexedMap = new SortedMap<number, string>(undefined, true);
 * // Now supports O(log n) access by position
 * ```
 *
 * @template K - The type of keys stored in the map
 * @template V - The type of values stored in the map
 */
export class SortedMap<K, V> implements SonicMap<K, V, TreeNode<K, V>> {
  /** Whether index-based access is enabled */
  enableIndex: boolean;
  /**
   * @internal
   */
  protected _header: TreeNode<K, V> | TreeNodeEnableIndex<K, V>;
  /**
   * @internal
   */
  protected _root: TreeNode<K, V> | undefined = undefined;

  /**
   * @internal
   */
  protected readonly _TreeNodeClass: typeof TreeNode | typeof TreeNodeEnableIndex;

  /**
   * Creates a new sorted map instance.
   *
   * @param comparator - Function to compare keys. Defaults to natural ordering.
   * @param enableIndex - Whether to enable O(log n) index-based access. Defaults to false.
   */
  constructor(comparator?: Comparator<K>, enableIndex: boolean = false) {
    this.comparator = comparator || ((a: unknown, b: unknown) => (a === b ? 0 : (a as any) < (b as any) ? -1 : 1));
    this.enableIndex = enableIndex;
    this._TreeNodeClass = enableIndex ? TreeNodeEnableIndex : TreeNode;
    this._header = new this._TreeNodeClass<undefined, undefined>(undefined, undefined) as TreeNode<K, V>;
  }

  /**
   * @description Container's size.
   * @internal
   */
  protected _length = 0;
  /**
   * @returns The size of the container.
   * @example
   * const container = new Vector([1, 2]);
   * console.log(container.length); // 2
   */
  get length() {
    return this._length;
  }

  /**
   * @returns Whether the container is empty.
   * @example
   * container.clear();
   * console.log(container.empty());  // true
   */
  empty() {
    return this._length === 0;
  }

  /**
   * @internal
   */
  protected _lowerBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this.comparator(curNode.k!, key);
      if (cmpResult < 0) {
        curNode = curNode.r;
      } else if (cmpResult > 0) {
        resNode = curNode;
        curNode = curNode.l;
      } else return curNode;
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _upperBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this.comparator(curNode.k!, key);
      if (cmpResult <= 0) {
        curNode = curNode.r;
      } else {
        resNode = curNode;
        curNode = curNode.l;
      }
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _reverseLowerBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this.comparator(curNode.k!, key);
      if (cmpResult < 0) {
        resNode = curNode;
        curNode = curNode.r;
      } else if (cmpResult > 0) {
        curNode = curNode.l;
      } else return curNode;
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _reverseUpperBound(curNode: TreeNode<K, V> | undefined, key: K) {
    let resNode = this._header;
    while (curNode) {
      const cmpResult = this.comparator(curNode.k!, key);
      if (cmpResult < 0) {
        resNode = curNode;
        curNode = curNode.r;
      } else {
        curNode = curNode.l;
      }
    }
    return resNode;
  }
  /**
   * @internal
   */
  protected _eraseNodeSelfBalance(curNode: TreeNode<K, V>) {
    while (true) {
      const parentNode = curNode.p!;
      if (parentNode === this._header) return;
      if (!curNode.b) {
        curNode.b = true;
        return;
      }
      if (curNode === parentNode.l) {
        const brother = parentNode.r!;
        if (!brother.b) {
          brother.b = true;
          parentNode.b = false;
          if (parentNode === this._root) {
            this._root = parentNode.rRotate();
          } else parentNode.rRotate();
        } else {
          if (brother.r && brother.r.b === false) {
            brother.b = parentNode.b;
            parentNode.b = true;
            brother.r.b = true;
            if (parentNode === this._root) {
              this._root = parentNode.rRotate();
            } else parentNode.rRotate();
            return;
          } else if (brother.l && brother.l.b === false) {
            brother.b = false;
            brother.l.b = true;
            brother.lRotate();
          } else {
            brother.b = false;
            curNode = parentNode;
          }
        }
      } else {
        const brother = parentNode.l!;
        if (brother.b === false) {
          brother.b = true;
          parentNode.b = false;
          if (parentNode === this._root) {
            this._root = parentNode.lRotate();
          } else parentNode.lRotate();
        } else {
          if (brother.l && brother.l.b === false) {
            brother.b = parentNode.b;
            parentNode.b = true;
            brother.l.b = true;
            if (parentNode === this._root) {
              this._root = parentNode.lRotate();
            } else parentNode.lRotate();
            return;
          } else if (brother.r && brother.r.b === false) {
            brother.b = false;
            brother.r.b = true;
            brother.rRotate();
          } else {
            brother.b = false;
            curNode = parentNode;
          }
        }
      }
    }
  }
  /**
   * @internal
   */
  protected _eraseNode(curNode: TreeNode<K, V>) {
    if (this._length === 1) {
      this.clear();
      return;
    }
    let swapNode = curNode;
    while (swapNode.l || swapNode.r) {
      if (swapNode.r) {
        swapNode = swapNode.r;
        while (swapNode.l) swapNode = swapNode.l;
      } else {
        swapNode = swapNode.l!;
      }
      const key = curNode.k;
      curNode.k = swapNode.k;
      swapNode.k = key;
      const value = curNode.v;
      curNode.v = swapNode.v;
      swapNode.v = value;
      curNode = swapNode;
    }
    if (this._header.l === swapNode) {
      this._header.l = swapNode.p;
    } else if (this._header.r === swapNode) {
      this._header.r = swapNode.p;
    }
    this._eraseNodeSelfBalance(swapNode);
    let _parent = swapNode.p as TreeNodeEnableIndex<K, V>;
    if (swapNode === _parent.l) {
      _parent.l = undefined;
    } else _parent.r = undefined;
    this._length -= 1;
    this._root!.b = true;
    if (this.enableIndex) {
      while (_parent !== this._header) {
        _parent._size -= 1;
        _parent = _parent.p as TreeNodeEnableIndex<K, V>;
      }
    }
  }

  /** @internal */
  protected _insertNodeSelfBalance(curNode: TreeNode<K, V>) {
    while (true) {
      const parentNode = curNode.p!;
      if (parentNode.b === true) return;
      const grandParent = parentNode.p!;
      if (parentNode === grandParent.l) {
        const uncle = grandParent.r;
        if (uncle && uncle.b === false) {
          uncle.b = parentNode.b = true;
          if (grandParent === this._root) return;
          grandParent.b = false;
          curNode = grandParent;
          continue;
        } else if (curNode === parentNode.r) {
          curNode.b = true;
          if (curNode.l) {
            curNode.l.p = parentNode;
          }
          if (curNode.r) {
            curNode.r.p = grandParent;
          }
          parentNode.r = curNode.l;
          grandParent.l = curNode.r;
          curNode.l = parentNode;
          curNode.r = grandParent;
          if (grandParent === this._root) {
            this._root = curNode;
            this._header.p = curNode;
          } else {
            const GP = grandParent.p!;
            if (GP.l === grandParent) {
              GP.l = curNode;
            } else GP.r = curNode;
          }
          curNode.p = grandParent.p;
          parentNode.p = curNode;
          grandParent.p = curNode;
          grandParent.b = false;
        } else {
          parentNode.b = true;
          if (grandParent === this._root) {
            this._root = grandParent.lRotate();
          } else grandParent.lRotate();
          grandParent.b = false;
          return;
        }
      } else {
        const uncle = grandParent.l;
        if (uncle && uncle.b === false) {
          uncle.b = parentNode.b = true;
          if (grandParent === this._root) return;
          grandParent.b = false;
          curNode = grandParent;
          continue;
        } else if (curNode === parentNode.l) {
          curNode.b = true;
          if (curNode.l) {
            curNode.l.p = grandParent;
          }
          if (curNode.r) {
            curNode.r.p = parentNode;
          }
          grandParent.r = curNode.l;
          parentNode.l = curNode.r;
          curNode.l = grandParent;
          curNode.r = parentNode;
          if (grandParent === this._root) {
            this._root = curNode;
            this._header.p = curNode;
          } else {
            const GP = grandParent.p!;
            if (GP.l === grandParent) {
              GP.l = curNode;
            } else GP.r = curNode;
          }
          curNode.p = grandParent.p;
          parentNode.p = curNode;
          grandParent.p = curNode;
          grandParent.b = false;
        } else {
          parentNode.b = true;
          if (grandParent === this._root) {
            this._root = grandParent.rRotate();
          } else grandParent.rRotate();
          grandParent.b = false;
          return;
        }
      }
      if (this.enableIndex) {
        (<TreeNodeEnableIndex<K, V>>parentNode).compute();
        (<TreeNodeEnableIndex<K, V>>grandParent).compute();
        (<TreeNodeEnableIndex<K, V>>curNode).compute();
      }
      return;
    }
  }

  /** @internal */
  protected _set(key: K, value: V, hint?: OrderedMapIterator<K, V>) {
    if (this._root === undefined) {
      this._length += 1;
      this._root = new this._TreeNodeClass(key, value, true);
      this._root.p = this._header;
      this._header.p = this._header.l = this._header.r = this._root;
      return this._length;
    }
    let curNode;
    const minNode = this._header.l!;
    const compareToMin = this.comparator(minNode.k!, key);
    if (compareToMin === 0) {
      minNode.v = value;
      return this._length;
    } else if (compareToMin > 0) {
      minNode.l = new this._TreeNodeClass(key, value);
      minNode.l.p = minNode;
      curNode = minNode.l;
      this._header.l = curNode;
    } else {
      const maxNode = this._header.r!;
      const compareToMax = this.comparator(maxNode.k!, key);
      if (compareToMax === 0) {
        maxNode.v = value;
        return this._length;
      } else if (compareToMax < 0) {
        maxNode.r = new this._TreeNodeClass(key, value);
        maxNode.r.p = maxNode;
        curNode = maxNode.r;
        this._header.r = curNode;
      } else {
        if (hint !== undefined) {
          const iterNode = hint._node;
          if (iterNode !== this._header) {
            const iterCmpRes = this.comparator(iterNode.k!, key);
            if (iterCmpRes === 0) {
              iterNode.v = value;
              return this._length;
            } else if (iterCmpRes > 0) {
              /* istanbul ignore else */ const preNode = iterNode.prev();
              const preCmpRes = this.comparator(preNode.k!, key);
              if (preCmpRes === 0) {
                preNode.v = value;
                return this._length;
              } else if (preCmpRes < 0) {
                curNode = new this._TreeNodeClass(key, value);
                if (preNode.r === undefined) {
                  preNode.r = curNode;
                  curNode.p = preNode;
                } else {
                  iterNode.l = curNode;
                  curNode.p = iterNode;
                }
              }
            }
          }
        }
        if (curNode === undefined) {
          curNode = this._root;
          while (true) {
            const cmpResult = this.comparator(curNode.k!, key);
            if (cmpResult > 0) {
              if (curNode.l === undefined) {
                curNode.l = new this._TreeNodeClass(key, value);
                curNode.l.p = curNode;
                curNode = curNode.l;
                break;
              }
              curNode = curNode.l;
            } else if (cmpResult < 0) {
              if (curNode.r === undefined) {
                curNode.r = new this._TreeNodeClass(key, value);
                curNode.r.p = curNode;
                curNode = curNode.r;
                break;
              }
              curNode = curNode.r;
            } else {
              curNode.v = value;
              return this._length;
            }
          }
        }
      }
    }
    if (this.enableIndex) {
      let parent = curNode.p as TreeNodeEnableIndex<K, V>;
      while (parent !== this._header) {
        parent._size += 1;
        parent = parent.p as TreeNodeEnableIndex<K, V>;
      }
    }
    this._insertNodeSelfBalance(curNode);
    this._length += 1;
    return this._length;
  }
  /**
   * @internal
   */
  protected _getTreeNodeByKey(curNode: TreeNode<K, V> | undefined, key: K) {
    while (curNode) {
      const cmpResult = this.comparator(curNode.k!, key);
      if (cmpResult < 0) {
        curNode = curNode.r;
      } else if (cmpResult > 0) {
        curNode = curNode.l;
      } else return curNode;
    }
    return curNode || this._header;
  }

  /**
   * @description Update node's key by iterator.
   * @param iter - The iterator you want to change.
   * @param key - The key you want to update.
   * @returns Whether the modification is successful.
   * @example
   * const st = new orderedSet([1, 2, 5]);
   * const iter = st.find(2);
   * st.updateKeyByIterator(iter, 3); // then st will become [1, 3, 5]
   */
  updateKeyByIterator(iter: OrderedMapIterator<K, V>, key: K): boolean {
    const node = iter._node;
    if (node === this._header) {
      throwIteratorAccessError();
    }
    if (this._length === 1) {
      node.k = key;
      return true;
    }
    const nextKey = node.next().k!;
    if (node === this._header.l) {
      if (this.comparator(nextKey, key) > 0) {
        node.k = key;
        return true;
      }
      return false;
    }
    const preKey = node.prev().k!;
    if (node === this._header.r) {
      if (this.comparator(preKey, key) < 0) {
        node.k = key;
        return true;
      }
      return false;
    }
    if (this.comparator(preKey, key) >= 0 || this.comparator(nextKey, key) <= 0) return false;
    node.k = key;
    return true;
  }
  eraseElementByPos(pos: number) {
    throw new Error('Method not implemented.');
    // $checkWithinAccessParams!(pos, 0, this._length - 1);
    // const node = this._inOrderTraversal(pos);
    // this._eraseNode(node);
    // return this._length;
  }
  /**
   * @description Remove the element of the specified key.
   * @param key - The key you want to remove.
   * @returns Whether erase successfully.
   */
  eraseElementByKey(key: K) {
    if (this._length === 0) return false;
    const curNode = this._getTreeNodeByKey(this._root, key);
    if (curNode === this._header) return false;
    this._eraseNode(curNode);
    return true;
  }
  eraseElementByIterator(iter: OrderedMapIterator<K, V>) {
    const node = iter._node;
    if (node === this._header) {
      throwIteratorAccessError();
    }
    const hasNoRight = node.r === undefined;
    const isNormal = iter.iteratorType === IteratorType.NORMAL;
    // For the normal iterator, the `next` node will be swapped to `this` node when has right.
    if (isNormal) {
      // So we should move it to next when it's right is null.
      if (hasNoRight) iter.next();
    } else {
      // For the reverse iterator, only when it doesn't have right and has left the `next` node will be swapped.
      // So when it has right, or it is a leaf node we should move it to `next`.
      if (!hasNoRight || node.l === undefined) iter.next();
    }
    this._eraseNode(node);
    return iter;
  }

  /**
   * @description Get the height of the tree.
   * @returns Number about the height of the RB-tree.
   */
  getHeight() {
    if (this._length === 0) return 0;
    function traversal(curNode: TreeNode<K, V> | undefined): number {
      if (!curNode) return 0;
      return Math.max(traversal(curNode.l), traversal(curNode.r)) + 1;
    }
    return traversal(this._root);
  }

  begin() {
    return new OrderedMapIterator<K, V>(this._header.l || this._header, this._header, this);
  }
  end() {
    return new OrderedMapIterator<K, V>(this._header, this._header, this);
  }
  rBegin() {
    return new OrderedMapIterator<K, V>(this._header.r || this._header, this._header, this, IteratorType.REVERSE);
  }
  rEnd() {
    return new OrderedMapIterator<K, V>(this._header, this._header, this, IteratorType.REVERSE);
  }
  front() {
    if (this._length === 0) return;
    const minNode = this._header.l!;
    return <[K, V]>[minNode.k, minNode.v];
  }
  back() {
    if (this._length === 0) return;
    const maxNode = this._header.r!;
    return <[K, V]>[maxNode.k, maxNode.v];
  }
  lowerBound(key: K) {
    const resNode = this._lowerBound(this._root, key);
    return new OrderedMapIterator<K, V>(resNode, this._header, this);
  }
  upperBound(key: K) {
    const resNode = this._upperBound(this._root, key);
    return new OrderedMapIterator<K, V>(resNode, this._header, this);
  }
  reverseLowerBound(key: K) {
    const resNode = this._reverseLowerBound(this._root, key);
    return new OrderedMapIterator<K, V>(resNode, this._header, this);
  }
  reverseUpperBound(key: K) {
    const resNode = this._reverseUpperBound(this._root, key);
    return new OrderedMapIterator<K, V>(resNode, this._header, this);
  }

  /**
   * @description Insert a key-value pair or set value by the given key.
   * @param key - The key want to insert.
   * @param value - The value want to set.
   * @param hint - You can give an iterator hint to improve insertion efficiency.
   * @return The size of container after setting.
   * @example
   * const mp = new OrderedMap([[2, 0], [4, 0], [5, 0]]);
   * const iter = mp.begin();
   * mp.setElement(1, 0);
   * mp.setElement(3, 0, iter);  // give a hint will be faster.
   */
  setElement(key: K, value: V, hint?: OrderedMapIterator<K, V>) {
    return this._set(key, value, hint);
  }
  getElementByPos(pos: number) {
    throw new Error('Method not implemented.');
    // $checkWithinAccessParams!(pos, 0, this._length - 1);
    // const node = this._inOrderTraversal(pos);
    // return <[K, V]>[node.k, node.v];
  }

  /**
   * @description Get the value of the element of the specified key.
   * @param key - The specified key you want to get.
   * @example
   * const val = container.getElementByKey(1);
   */
  getElementByKey(key: K) {
    const curNode = this._getTreeNodeByKey(this._root, key);
    return curNode.v;
  }

  /**
   * Minimum node. The node with the smallest key in the tree.
   */
  public min: TreeNode<K, V> | undefined = undefined;
  /**
   * Root node. Typically approximates the middle of the tree.
   */
  public root: TreeNode<K, V> | undefined = undefined;
  /**
   * Maximum node. The node with the largest key in the tree.
   */
  public max: TreeNode<K, V> | undefined = undefined;
  /**
   * Comparator function. Used to relatively compare keys.
   */
  public readonly comparator: Comparator<K>;

  public set(k: K, v: V): SonicNodePublicReference<TreeNode<K, V>> {
    throw new Error('Method not implemented.');
  }

  public find(k: K): SonicNodePublicReference<TreeNode<K, V>> | undefined {
    throw new Error('Method not implemented.');
    // const curNode = this._getTreeNodeByKey(this._root, key);
    // return new OrderedMapIterator<K, V>(curNode, this._header, this);
  }

  public get(k: K): V | undefined {
    throw new Error('Method not implemented.');
  }

  public del(k: K): boolean {
    throw new Error('Method not implemented.');
  }

  public clear(): void {
    this._length = 0;
    this._root = undefined;
    this._header.p = undefined;
    this._header.l = this._header.r = undefined;
  }

  public has(k: K): boolean {
    return !!this.find(k);
  }

  public _size: number = 0;

  public size(): number {
    return this._length;
  }

  public isEmpty(): boolean {
    return !this.min;
  }

  public getOrNextLower(k: K): TreeNode<K, V> | undefined {
    // return (findOrNextLower(this.root, k, this.comparator) as TreeNode<K, V>) || undefined;
    throw new Error('Method not implemented.');
  }

  public forEach(fn: (node: TreeNode<K, V>) => void): void {
    // let curr = this.first();
    // if (!curr) return;
    // do fn(curr!);
    // while ((curr = next(curr as HeadlessNode) as TreeNode<K, V> | undefined));
    throw new Error('Method not implemented.');
  }
  // forEach(callback: (element: [K, V], index: number, map: SortedMap<K, V>) => void) {
  //   this._inOrderTraversal(function (node, index, map) {
  //     callback(<[K, V]>[node.k, node.v], index, map);
  //   });
  // }

  public first(): TreeNode<K, V> | undefined {
    // return this.min;
    throw new Error('Method not implemented.');
  }

  public last(): TreeNode<K, V> | undefined {
    // return this.max;
    throw new Error('Method not implemented.');
  }

  public readonly next = next;

  public iterator0(): () => undefined | TreeNode<K, V> {
    throw new Error('Method not implemented.');
    // let curr = this.first();
    // return () => {
    //   if (!curr) return;
    //   const value = curr;
    //   curr = next(curr as HeadlessNode) as TreeNode<K, V> | undefined;
    //   return value;
    // };
  }

  public iterator(): Iterator<TreeNode<K, V>> {
    throw new Error('Method not implemented.');
    // const iterator = this.iterator0();
    // return {
    //   next: () => {
    //     const value = iterator();
    //     const res = <IteratorResult<TreeNode<K, V>>>{value, done: !value};
    //     return res;
    //   },
    // };
  }

  public entries(): IterableIterator<TreeNode<K, V>> {
    // return <any>{[Symbol.iterator]: () => this.iterator()};
    throw new Error('Method not implemented.');
  }

  public toString(tab: string): string {
    return this.constructor.name + printTree(tab, [(tab) => print(this.root, tab)]);
  }
}
