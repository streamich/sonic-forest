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
  let r = n.r;
  if ((r && n.l) || !n.p) {
    let inOrderSuccessor = r as N | undefined;
    while (inOrderSuccessor)
      if (inOrderSuccessor.l) inOrderSuccessor = inOrderSuccessor.l as N;
      else break;
    if (!inOrderSuccessor) return;
    n.k = inOrderSuccessor.k;
    n.v = inOrderSuccessor.v;
    n = inOrderSuccessor;
    r = n.r;
  }
  const child = r as N | undefined;
  if (child) {
    const p = n.p! as N;
    child.p = p;
    if (p.l === n) p.l = child;
    else p.r = child;
    if (!child.b) child.b = true;
    else root = correctDoubleBlack(root, child);
  } else {
    if (n.b) root = correctDoubleBlack(root, n);
    const p2 = n.p as N;
    if (p2)
      if (n === p2.l) p2.l = undefined;
      else p2.r = undefined;
  }
  return root;
};

const correctDoubleBlack = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  LOOP: while (true) {
    let p = n.p as N | undefined;
    if (!p) return n;
    const pl = p.l;
    let s = (n === pl ? p.r : pl) as N;
    const sl = s.l;
    if (s && !s.b && (!sl || sl.b)) {
      const sr = s.r;
      if (!sr || sr.b) {
        if (n === p.l) rrRotate(p, s);
        else llRotate(p, s);
        p.b = false;
        s.b = true;
        if (!s.p) root = s;
      }
    }
    if (p.b && s.b && (!sl || sl.b)) {
      const sr = s.r;
      if (!sr || sr.b) {
        s.b = false;
        n = p;
        continue LOOP;
      }
    }
    if (!p.b) {
      const pl = p.l;
      s = (n === pl ? p.r : pl) as N;
      const sl = s.l;
      if (s.b && (!sl || sl.b)) {
        const sr = s.r;
        if (!sr || sr.b) {
          const sr = s.r;
          if (!sr || sr.b) {
            s.b = false;
            p.b = true;
            return root;
          }
        }
      }
    }
    if (s.b) {
      const sl = s.l;
      const sr = s.r;
      if (n === p.l && (!sr || sr.b) && sl && !sl.b) {
        sl.b = true;
        s.b = false;
        llRotate(s, sl);
      } else if (n === p.r && (!sl || sl.b) && sr && !sr.b) {
        sr.b = true;
        s.b = false;
        rrRotate(s, sr);
      }
      if (!s.p) return s;
      const pl = p.l;
      s = (n === pl ? p.r : pl) as N;
    }
    s.b = p.b;
    p.b = true;
    if (n === p.l) {
      s.r!.b = true;
      rrRotate(p, s);
    } else {
      s.l!.b = true;
      llRotate(p, s);
    }
    return s.p ? root : s;
  }
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
