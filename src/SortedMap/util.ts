export function throwIteratorAccessError() {
  throw new RangeError('Iterator access denied!');
}

export function $checkWithinAccessParams(pos: number, lower: number, upper: number) {
  if (pos < lower || pos > upper) {
    throw new RangeError();
  }
}
