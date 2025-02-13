import type {IRbTreeNode} from '../red-black/types';

export class TreeNode<K, V> implements IRbTreeNode<K, V> {
  l: TreeNode<K, V> | undefined = undefined;
  r: TreeNode<K, V> | undefined = undefined;
  p: TreeNode<K, V> | undefined = undefined;

  constructor(
    public k: K,
    public v: V,
    public b = false,
  ) {}

  prev() {
    let prev: TreeNode<K, V> = this;
    const isRootOrHeader = prev.p!.p === prev;
    if (isRootOrHeader && !prev.b) prev = prev.r!;
    else if (prev.l) {
      prev = prev.l;
      while (prev.r) prev = prev.r;
    } else {
      if (isRootOrHeader) return prev.p!;
      let v = prev.p!;
      while (v.l === prev) {
        prev = v;
        v = prev.p!;
      }
      prev = v;
    }
    return prev;
  }

  next() {
    let next: TreeNode<K, V> = this;
    if (next.r) {
      next = next.r;
      while (next.l) next = next.l;
      return next;
    } else {
      let v = next.p!;
      while (v.r === next) {
        next = v;
        v = next.p!;
      }
      if (next.r !== v) return v;
      else return next;
    }
  }

  rRotate() {
    const p = this.p!;
    const r = this.r!;
    const l = r.l;
    if (p.p === this) p.p = r;
    else if (p.l === this) p.l = r;
    else p.r = r;
    r.p = p;
    r.l = this;
    this.p = r;
    this.r = l;
    if (l) l.p = this;
    return r;
  }

  lRotate() {
    const p = this.p!;
    const l = this.l!;
    const r = l.r;
    if (p.p === this) p.p = l;
    else if (p.l === this) p.l = l;
    else p.r = l;
    l.p = p;
    l.r = this;
    this.p = l;
    this.l = r;
    if (r) r.p = this;
    return l;
  }
}

export class TreeNodeEnableIndex<K, V> extends TreeNode<K, V> {
  _size = 1;

  rRotate() {
    const parent = super.rRotate() as TreeNodeEnableIndex<K, V>;
    this.compute();
    parent.compute();
    return parent;
  }

  lRotate() {
    const parent = super.lRotate() as TreeNodeEnableIndex<K, V>;
    this.compute();
    parent.compute();
    return parent;
  }

  compute() {
    this._size = 1;
    if (this.l) {
      this._size += (this.l as TreeNodeEnableIndex<K, V>)._size;
    }
    if (this.r) {
      this._size += (this.r as TreeNodeEnableIndex<K, V>)._size;
    }
  }
}
