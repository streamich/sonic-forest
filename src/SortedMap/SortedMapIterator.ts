import {IteratorType} from './constants';
import {throwIteratorAccessError} from './util';
import type {SortedMap} from './SortedMap';
import type {TreeNode, TreeNodeEnableIndex} from './SortedMapNode';

export class OrderedMapIterator<K, V> {
  /**
   * @internal
   */
  _node: TreeNode<K, V>;
  /**
   * @internal
   */
  protected _header: TreeNode<K, V>;
  /**
   * @internal
   */
  // protected constructor(
  //   node: TreeNode<K, V>,
  //   header: TreeNode<K, V>,
  //   iteratorType?: IteratorType
  // ) {
  //   super(iteratorType);

  // }

  pre: () => this;
  next: () => this;

  readonly container: SortedMap<K, V>;

  /**
   * @description Iterator's type.
   * @example
   * console.log(container.end().iteratorType === IteratorType.NORMAL);  // true
   */
  readonly iteratorType: IteratorType;

  constructor(
    node: TreeNode<K, V>,
    header: TreeNode<K, V>,
    container: SortedMap<K, V>,
    iteratorType: IteratorType = IteratorType.NORMAL,
  ) {
    this._node = node;
    this._header = header;
    this.iteratorType = iteratorType;
    if (this.iteratorType === IteratorType.NORMAL) {
      this.pre = function () {
        if (this._node === this._header._left) {
          throwIteratorAccessError();
        }
        this._node = this._node._pre();
        return this;
      };

      this.next = function () {
        if (this._node === this._header) {
          throwIteratorAccessError();
        }
        this._node = this._node._next();
        return this;
      };
    } else {
      this.pre = function () {
        if (this._node === this._header._right) {
          throwIteratorAccessError();
        }
        this._node = this._node._next();
        return this;
      };

      this.next = function () {
        if (this._node === this._header) {
          throwIteratorAccessError();
        }
        this._node = this._node._pre();
        return this;
      };
    }
    this.container = container;
  }

  /**
   * @description Get the sequential index of the iterator in the tree container.<br/>
   *              <strong>Note:</strong>
   *              This function only takes effect when the specified tree container `enableIndex = true`.
   * @returns The index subscript of the node in the tree.
   * @example
   * const st = new OrderedSet([1, 2, 3], true);
   * console.log(st.begin().next().index);  // 1
   */
  get index() {
    let _node = this._node as TreeNodeEnableIndex<K, V>;
    const root = this._header._parent as TreeNodeEnableIndex<K, V>;
    if (_node === this._header) {
      if (root) {
        return root._subTreeSize - 1;
      }
      return 0;
    }
    let index = 0;
    if (_node._left) {
      index += (_node._left as TreeNodeEnableIndex<K, V>)._subTreeSize;
    }
    while (_node !== root) {
      const _parent = _node._parent as TreeNodeEnableIndex<K, V>;
      if (_node === _parent._right) {
        index += 1;
        if (_parent._left) {
          index += (_parent._left as TreeNodeEnableIndex<K, V>)._subTreeSize;
        }
      }
      _node = _parent;
    }
    return index;
  }
  isAccessible() {
    return this._node !== this._header;
  }

  copy() {
    return new OrderedMapIterator<K, V>(this._node, this._header, this.container, this.iteratorType);
  }

  equals(iter: OrderedMapIterator<K, V>) {
    return this._node === iter._node;
  }
}
