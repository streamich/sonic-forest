/**
 * @description The initial data type passed in when initializing the container.
 */
export type initContainer<T> = {
  size?: number | (() => number);
  length?: number;
  forEach: (callback: (el: T) => void) => void;
}
