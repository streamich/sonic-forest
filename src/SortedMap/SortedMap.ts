import {IteratorType} from './constants';
import {OrderedMapIterator} from './SortedMapIterator';
import {TreeNode} from './SortedMapNode';
import {TreeNodeEnableIndex} from './SortedMapNode';
import {throwIteratorAccessError, $checkWithinAccessParams} from './util';
import type {initContainer} from './types';

export class SortedMap<K, V> {
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
  protected readonly _cmp: (x: K, y: K) => number;
  /**
   * @internal
   */
  protected readonly _TreeNodeClass: typeof TreeNode | typeof TreeNodeEnableIndex;

  constructor(
    container: initContainer<[K, V]> = [],
    cmp: (x: K, y: K) => number = (x: K, y: K) => {
      if (x < y) return -1;
      if (x > y) return 1;
      return 0;
    },
    enableIndex: boolean = false,
  ) {
    this._cmp = cmp;
    this.enableIndex = enableIndex;
    this._TreeNodeClass = enableIndex ? TreeNodeEnableIndex : TreeNode;
    this._header = new this._TreeNodeClass<undefined, undefined>(undefined, undefined) as TreeNode<K, V>;

    const self = this;
    container.forEach((el) => {
      self.setElement(el[0], el[1]);
    });
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
   * @returns The size of the container.
   * @example
   * const container = new Vector([1, 2]);
   * console.log(container.size()); // 2
   */
  size() {
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
      const cmpResult = this._cmp(curNode.k!, key);
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
      const cmpResult = this._cmp(curNode.k!, key);
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
      const cmpResult = this._cmp(curNode.k!, key);
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
      const cmpResult = this._cmp(curNode.k!, key);
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
  protected _inOrderTraversal(): TreeNode<K, V>[];
  protected _inOrderTraversal(pos: number): TreeNode<K, V>;
  protected _inOrderTraversal(callback: (node: TreeNode<K, V>, index: number, map: this) => void): TreeNode<K, V>;
  /**
   * @internal
   */
  protected _inOrderTraversal(param?: number | ((node: TreeNode<K, V>, index: number, map: this) => void)) {
    const pos = typeof param === 'number' ? param : undefined;
    const callback = typeof param === 'function' ? param : undefined;
    const nodeList = typeof param === 'undefined' ? <TreeNode<K, V>[]>[] : undefined;
    let index = 0;
    let curNode = this._root;
    const stack: TreeNode<K, V>[] = [];
    while (stack.length || curNode) {
      if (curNode) {
        stack.push(curNode);
        curNode = curNode.l;
      } else {
        curNode = stack.pop()!;
        if (index === pos) return curNode;
        nodeList && nodeList.push(curNode);
        callback && callback(curNode, index, this);
        index += 1;
        curNode = curNode.r;
      }
    }
    return nodeList;
  }
  /**
   * @internal
   */
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
  /**
   * @internal
   */
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
    const compareToMin = this._cmp(minNode.k!, key);
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
      const compareToMax = this._cmp(maxNode.k!, key);
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
            const iterCmpRes = this._cmp(iterNode.k!, key);
            if (iterCmpRes === 0) {
              iterNode.v = value;
              return this._length;
            } else if (iterCmpRes > 0) {
              /* istanbul ignore else */ const preNode = iterNode.prev();
              const preCmpRes = this._cmp(preNode.k!, key);
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
            const cmpResult = this._cmp(curNode.k!, key);
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
      const cmpResult = this._cmp(curNode.k!, key);
      if (cmpResult < 0) {
        curNode = curNode.r;
      } else if (cmpResult > 0) {
        curNode = curNode.l;
      } else return curNode;
    }
    return curNode || this._header;
  }
  clear() {
    this._length = 0;
    this._root = undefined;
    this._header.p = undefined;
    this._header.l = this._header.r = undefined;
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
      if (this._cmp(nextKey, key) > 0) {
        node.k = key;
        return true;
      }
      return false;
    }
    const preKey = node.prev().k!;
    if (node === this._header.r) {
      if (this._cmp(preKey, key) < 0) {
        node.k = key;
        return true;
      }
      return false;
    }
    if (this._cmp(preKey, key) >= 0 || this._cmp(nextKey, key) <= 0) return false;
    node.k = key;
    return true;
  }
  eraseElementByPos(pos: number) {
    $checkWithinAccessParams!(pos, 0, this._length - 1);
    const node = this._inOrderTraversal(pos);
    this._eraseNode(node);
    return this._length;
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
  forEach(callback: (element: [K, V], index: number, map: SortedMap<K, V>) => void) {
    this._inOrderTraversal(function (node, index, map) {
      callback(<[K, V]>[node.k, node.v], index, map);
    });
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
    $checkWithinAccessParams!(pos, 0, this._length - 1);
    const node = this._inOrderTraversal(pos);
    return <[K, V]>[node.k, node.v];
  }
  find(key: K) {
    const curNode = this._getTreeNodeByKey(this._root, key);
    return new OrderedMapIterator<K, V>(curNode, this._header, this);
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
  union(other: SortedMap<K, V>) {
    const self = this;
    other.forEach(function (el) {
      self.setElement(el[0], el[1]);
    });
    return this._length;
  }
  *[Symbol.iterator]() {
    const length = this._length;
    const nodeList = this._inOrderTraversal();
    for (let i = 0; i < length; ++i) {
      const node = nodeList[i];
      yield <[K, V]>[node.k, node.v];
    }
  }
}
