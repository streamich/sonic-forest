import {printBinary} from '../print/printBinary';
import {first} from '../util/first';
import type {Comparator} from '../types';
import type {IRbTreeNode, RbHeadlessNode} from './types';

const stringify = JSON.stringify;

export const insert = <K, N extends IRbTreeNode<K>>(root: N | undefined, n: N, comparator: Comparator<K>): N => {
  if (!root) return (n.b = true), n;
  const key = n.k;
  let curr: N | undefined = root;
  let next: N | undefined = undefined;
  let cmp: number = 0;
  while ((next = <N>((cmp = comparator(key, curr.k)) < 0 ? curr.l : curr.r))) curr = next;
  return (cmp < 0 ? insertLeft(root, n, curr) : insertRight(root, n, curr)) as N;
};

export const insertRight = (root: RbHeadlessNode, n: RbHeadlessNode, p: RbHeadlessNode): RbHeadlessNode => {
  const g = p.p;
  p.r = n;
  n.p = p;
  if (p.b || !g) return root;
  const top = rRebalance(n, p, g);
  return top.p ? root : top;
};

export const insertLeft = (root: RbHeadlessNode, n: RbHeadlessNode, p: RbHeadlessNode): RbHeadlessNode => {
  const g = p.p;
  p.l = n;
  n.p = p;
  if (p.b || !g) return root;
  const top = lRebalance(n, p, g);
  return top.p ? root : top;
};

const rRebalance = (n: RbHeadlessNode, p: RbHeadlessNode, g: RbHeadlessNode): RbHeadlessNode => {
  const u = g.l === p ? g.r : g.l;
  const uncleIsBlack = !u || u.b;
  if (uncleIsBlack) {
    const zigzag = g.l === p;
    g.b = false;
    if (zigzag) {
      n.b = true;
      rrRotate(p, n);
      llRotate(g, n);
      return n;
    }
    p.b = true;
    rrRotate(g, p);
    return p;
  }
  return recolor(p, g, u);
};

const lRebalance = (n: RbHeadlessNode, p: RbHeadlessNode, g: RbHeadlessNode): RbHeadlessNode => {
  const u = g.l === p ? g.r : g.l;
  const uncleIsBlack = !u || u.b;
  if (uncleIsBlack) {
    const zigzag = g.r === p;
    g.b = false;
    if (zigzag) {
      n.b = true;
      llRotate(p, n);
      rrRotate(g, n);
      return n;
    }
    p.b = true;
    llRotate(g, p);
    return p;
  }
  return recolor(p, g, u);
};

const recolor = (p: RbHeadlessNode, g: RbHeadlessNode, u?: RbHeadlessNode): RbHeadlessNode => {
  p.b = true;
  g.b = false;
  if (u) u.b = true;
  const gg = g.p;
  if (!gg) return (g.b = true), g;
  if (gg.b) return g;
  const ggg = gg.p;
  if (!ggg) return (gg.b = true), gg;
  return gg.l === g ? lRebalance(g, gg, ggg) : rRebalance(g, gg, ggg);
};

const llRotate = (n: RbHeadlessNode, nl: RbHeadlessNode): void => {
  const p = n.p;
  const nlr = nl.r;
  nl.p = p;
  nl.r = n;
  n.p = nl;
  n.l = nlr;
  nlr && (nlr.p = n);
  p && (p.l === n ? (p.l = nl) : (p.r = nl));
};

const rrRotate = (n: RbHeadlessNode, nr: RbHeadlessNode): void => {
  const p = n.p;
  const nrl = nr.l;
  nr.p = p;
  nr.l = n;
  n.p = nr;
  n.r = nrl;
  nrl && (nrl.p = n);
  p && (p.l === n ? (p.l = nr) : (p.r = nr));
};

export const remove = <K, N extends IRbTreeNode<K>>(root: N | undefined, n: N): N | undefined => {
  if (!root) return;
  const l = n.l;
  const r = n.r;
  if (l && r) {
    const inOrderSuccessor = first(r)! as N;
    n.k = inOrderSuccessor.k;
    n.v = inOrderSuccessor.v;
    return remove(root, inOrderSuccessor);
  }
  const p = n.p as N | undefined;
  n.p = n.l = n.r = void 0;
  const child = (l || r) as N | undefined;
  if (!p) return child;
  if (p.l === n) p.l = child; else p.r = child;
  if (child) {
    child.p = p;
    const b = n.b;
    if (b && !child.b) child.b = true;
    return removeCase1(root, child);
  }
  return root;
};

const removeCase1 = <K, N extends IRbTreeNode<K>>(root: N, n: N): N =>
  !n.p ? n : removeCase2(root, n);

const removeCase2 = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  const p = n.p! as N;
  const s = (n === p.l ? p.r : p.l) as N;
  if (s && !s.b) {
    if (n === p.l) rrRotate(p, s); else llRotate(p, s);
    if (!s.p) return s;
  }
  return removeCase3(root, n);
};

const removeCase3 = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  const p = n.p! as N;
  const s = (n === p.l ? p.r : p.l) as N;
  if (p.b && s.b && (!s.l || s.l.b) && (!s.r || s.r.b)) {
    s.b = false;
    return removeCase1(root, p);
  }
  return removeCase4(root, n);
};

const removeCase4 = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  const p = n.p! as N;
  const s = (n === p.l ? p.r : p.l) as N;
  if (!p.b && s.b && (!s.l || s.l.b) && (!s.r || s.r.b)) {
    s.b = false;
    p.b = true;
    return root;
  }
  return removeCase5(root, n);
};

const removeCase5 = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  const p = n.p! as N;
  const s = (n === p.l ? p.r : p.l) as N;
  if (s.b) {
    if (n === p.l && (!s.r || s.r.b) && s.l && !s.l.b) {
      s.l.b = true;
      s.b = false;
      rrRotate(s, s.l);
    } else if (n === p.r && (!s.l || s.l.b) && s.r && !s.r.b) {
      s.r.b = true;
      s.b = false;
      llRotate(s, s.r);
    }
  }
  return removeCase6(root, n);
};

const removeCase6 = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  const p = n.p! as N;
  const s = (n === p.l ? p.r : p.l) as N;
  s.b = p.b;
  p.b = true;
  if (n === p.l) {
    s.r!.b = true;
    llRotate(p, s);
  } else {
    s.l!.b = true;
    rrRotate(p, s);
  }
  return root;
};

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
