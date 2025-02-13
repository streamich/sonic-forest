import {assertTreeLinks} from '../../__tests__/util';
import {HeadlessNode} from '../../types';
import {swap} from '../swap';
import {print} from '../print';

test('immediate left child at root', () => {
  const x: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  const y: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  let root = x;
  x.l = y;
  y.p = x;
  assertTreeLinks(root);
  root = swap(root, x, y);
  expect(root).toBe(y);
  assertTreeLinks(root);
  expect(y.l).toBe(x);
  expect(x.p).toBe(y);
  expect(x.l).toBe(undefined);
  expect(y.p).toBe(undefined);
  // console.log(print(root));
});

test('immediate right child at root', () => {
  const x: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  const y: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  let root = x;
  x.r = y;
  y.p = x;
  assertTreeLinks(root);
  root = swap(root, x, y);
  expect(root).toBe(y);
  assertTreeLinks(root);
  expect(y.r).toBe(x);
  expect(x.p).toBe(y);
  expect(x.l).toBeUndefined();
  expect(y.p).toBe(undefined);
  // console.log(print(root));
});

test('immediate left child not at root', () => {
  const z: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  const x: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  const y: HeadlessNode = {p: undefined, l: undefined, r: undefined};
  x.l = y;
  y.p = x;
  z.l = x;
  x.p = z;
  let root = z;
  assertTreeLinks(root);
  root = swap(root, x, y);
  expect(root).toBe(z);
  assertTreeLinks(root);
  expect(y.l).toBe(x);
  expect(x.p).toBe(y);
  expect(x.l).toBe(undefined);
  expect(y.p).toBe(z);
  // console.log(print(root));
});
