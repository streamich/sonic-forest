import {first2, insert2, next2} from '../../util2';
import {splay} from '../util';
import {splay2} from '../util2';

class Node {
  public p: Node | undefined = undefined;
  public l: Node | undefined = undefined;
  public r: Node | undefined = undefined;
  public p2: Node | undefined = undefined;
  public l2: Node | undefined = undefined;
  public r2: Node | undefined = undefined;
  constructor(public readonly key: number) {}
}

const cmp = (a: Node, b: Node) => a.key - b.key;

const shape = (node: Node | undefined): unknown => (node ? [node.key, shape(node.l), shape(node.r)] : null);
const shape2 = (node: Node | undefined): unknown => (node ? [node.key, shape2(node.l2), shape2(node.r2)] : null);

describe('splay2()', () => {
  test('makes the same rotations as splay()', () => {
    let seed = 12345;
    const rnd = () => (seed = (seed * 1103515245 + 12345) & 0x7fffffff) / 0x80000000;
    for (let i = 0; i < 300; i++) {
      const size = 1 + Math.floor(rnd() * 40);
      const keys: number[] = [];
      for (let j = 0; j < size; j++) keys.push(Math.floor(rnd() * 1000) + j * 1000);
      keys.sort(() => rnd() - 0.5);
      let root: Node | undefined;
      const nodes: Node[] = [];
      for (const key of keys) {
        const node = new Node(key);
        nodes.push(node);
        root = insert2(root, node, cmp);
      }
      for (const node of nodes) {
        node.p = node.p2;
        node.l = node.l2;
        node.r = node.r2;
      }
      const target = nodes[Math.floor(rnd() * size)];
      const res2 = splay2(root!, target);
      const res = splay(root!, target, size);
      expect(res2).toBe(target);
      expect(res2.p2).toBe(undefined);
      expect(shape2(res2)).toEqual(shape(res));
    }
  });

  test('splays the bottom of a 100k-node spine', () => {
    const root = new Node(100000);
    let bottom = root;
    for (let i = 99999; i > 0; i--) {
      const node = new Node(i);
      node.p2 = bottom;
      bottom.l2 = node;
      bottom = node;
    }
    const res = splay2(root, bottom);
    expect(res.key).toBe(1);
    expect(res.p2).toBe(undefined);
    let count = 0;
    for (let node = first2(res); node; node = next2(node)) if (node.key !== ++count) throw new Error('ORDER');
    expect(count).toBe(100000);
  });
});
