import {printBinary} from '../print/printBinary';
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
  const gl = g.l;
  const zigzag = gl === p;
  const u = zigzag ? g.r : gl;
  const uncleIsBlack = !u || u.b;
  if (uncleIsBlack) {
    g.b = false;
    if (zigzag) {
      lrRotate(g, p, n);
      // rRotate(p, n);
      // lRotate(g, n);
      n.b = true;
      return n;
    }
    p.b = true;
    rRotate(g, p);
    return p;
  }
  return recolor(p, g, u);
};

const lRebalance = (n: RbHeadlessNode, p: RbHeadlessNode, g: RbHeadlessNode): RbHeadlessNode => {
  const gr = g.r;
  const zigzag = gr === p;
  const u = zigzag ? g.l : gr;
  const uncleIsBlack = !u || u.b;
  if (uncleIsBlack) {
    g.b = false;
    if (zigzag) {
      rlRotate(g, p, n);
      // lRotate(p, n);
      // rRotate(g, n);
      n.b = true;
      return n;
    }
    p.b = true;
    lRotate(g, p);
    return p;
  }
  return recolor(p, g, u);
};

const recolor = (p: RbHeadlessNode, g: RbHeadlessNode, u?: RbHeadlessNode): RbHeadlessNode => {
  p.b = true;
  if (u) u.b = true;
  const gg = g.p;
  if (gg) {
    g.b = false;
    if (gg.b) return g;
  } else {
    g.b = true;
    return g;
  }
  const ggg = gg.p;
  if (!ggg) return gg;
  return gg.l === g ? lRebalance(g, gg, ggg) : rRebalance(g, gg, ggg);
};

const lRotate = (n: RbHeadlessNode, nl: RbHeadlessNode): void => {
  const p = n.p;
  const nlr = nl.r;
  ((nl.r = n).l = nlr) && (nlr.p = n);
  ((n.p = nl).p = p) && (p.l === n ? (p.l = nl) : (p.r = nl));
};

const rRotate = (n: RbHeadlessNode, nr: RbHeadlessNode): void => {
  const p = n.p;
  const nrl = nr.l;
  ((nr.l = n).r = nrl) && (nrl.p = n);
  ((n.p = nr).p = p) && (p.l === n ? (p.l = nr) : (p.r = nr));
};

const lrRotate = (g: RbHeadlessNode, p: RbHeadlessNode, n: RbHeadlessNode): void => {
  const gg = g.p;
  const nl = n.l;
  const nr = n.r;
  gg && (gg.l === g ? (gg.l = n) : (gg.r = n));
  n.p = gg;
  n.l = p;
  n.r = g;
  p.p = g.p = n;
  (p.r = nl) && (nl.p = p);
  (g.l = nr) && (nr.p = g);
};

const rlRotate = (g: RbHeadlessNode, p: RbHeadlessNode, n: RbHeadlessNode): void => {
  const gg = g.p;
  const nl = n.l;
  const nr = n.r;
  gg && (gg.l === g ? (gg.l = n) : (gg.r = n));
  n.p = gg;
  n.l = g;
  n.r = p;
  g.p = p.p = n;
  (g.r = nl) && (nl.p = g);
  (p.l = nr) && (nr.p = p);
};

export const remove = <K, N extends IRbTreeNode<K>>(root: N | undefined, n: N): N | undefined => {
  if (!root) return; // TODO: This line is not necessary...?
  let r = n.r as N | undefined;
  const l = n.l as N | undefined;
  let child: N | undefined;
  if (r) {
    let inOrderSuccessor = r as N | undefined;
    if (inOrderSuccessor) while (true) {
        const next = inOrderSuccessor.l as N | undefined;
        if (next) inOrderSuccessor = next;
        else break;
      }
    if (!inOrderSuccessor) return;
    n.k = inOrderSuccessor.k;
    n.v = inOrderSuccessor.v;
    n = inOrderSuccessor;
    child = r = n.r as N | undefined;
  } else if (!n.p) {
    if (l) {
      l.b = true;
      l.p = undefined;
    }
    return l;
  } else {
    child = r || l;
  }
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
    if (p2) {
      if (n === p2.l) p2.l = undefined;
      else p2.r = undefined;
    } else {
      n.b = true;
      return n;
    }
  }
  return root;
};

const correctDoubleBlack = <K, N extends IRbTreeNode<K>>(root: N, n: N): N => {
  LOOP: while (true) {
    let p = n.p as N | undefined;
    if (!p) return n;
    const pl = p.l;
    const isLeftChild = n === pl;
    let s = (isLeftChild ? p.r : pl) as N;
    const sl = s.l;
    if (s && !s.b && (!sl || sl.b)) {
      const sr = s.r;
      if (!sr || sr.b) {
        if (isLeftChild) rRotate(p, s);
        else lRotate(p, s);
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
        lRotate(s, sl);
      } else if (n === p.r && (!sl || sl.b) && sr && !sr.b) {
        sr.b = true;
        s.b = false;
        rRotate(s, sr);
      }
      if (!s.p) return s;
      const pl = p.l;
      s = (n === pl ? p.r : pl) as N;
    }
    s.b = p.b;
    p.b = true;
    if (n === p.l) {
      s.r!.b = true;
      rRotate(p, s);
    } else {
      s.l!.b = true;
      lRotate(p, s);
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
