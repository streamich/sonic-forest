/**
 * Efficient slice reference to a portion of a Uint8Array without copying data.
 * This avoids creating new Uint8Array instances for every node in the radix tree.
 */
export class Slice {
  constructor(
    public readonly data: Uint8Array,
    public readonly start: number,
    public readonly length: number,
  ) {}

  /**
   * Get byte at the given index within this slice.
   */
  public at(index: number): number {
    if (index < 0 || index >= this.length) {
      throw new Error(`Index ${index} out of bounds for slice of length ${this.length}`);
    }
    return this.data[this.start + index];
  }

  /**
   * Create a new slice that represents a substring of this slice.
   */
  public substring(start: number, length?: number): Slice {
    if (start < 0 || start > this.length) {
      throw new Error(`Start ${start} out of bounds for slice of length ${this.length}`);
    }
    const newLength = length !== undefined ? Math.min(length, this.length - start) : this.length - start;
    return new Slice(this.data, this.start + start, newLength);
  }

  /**
   * Compare this slice with another slice for equality.
   */
  public equals(other: Slice): boolean {
    if (this.length !== other.length) return false;
    for (let i = 0; i < this.length; i++) {
      if (this.at(i) !== other.at(i)) return false;
    }
    return true;
  }

  /**
   * Compare this slice with another slice lexicographically.
   * Returns negative if this < other, positive if this > other, 0 if equal.
   */
  public compare(other: Slice): number {
    const minLength = Math.min(this.length, other.length);
    for (let i = 0; i < minLength; i++) {
      const thisByte = this.at(i);
      const otherByte = other.at(i);
      if (thisByte !== otherByte) {
        return thisByte - otherByte;
      }
    }
    return this.length - other.length;
  }

  /**
   * Create a new Uint8Array containing the data from this slice.
   * Use sparingly as this creates a copy.
   */
  public toUint8Array(): Uint8Array {
    return this.data.slice(this.start, this.start + this.length);
  }

  /**
   * Get string representation for debugging.
   */
  public toString(): string {
    return `Slice(${Array.from(this.toUint8Array()).join(',')})`;
  }

  /**
   * Create a slice from a Uint8Array.
   */
  public static fromUint8Array(data: Uint8Array): Slice {
    return new Slice(data, 0, data.length);
  }
}

/**
 * Find the length of common prefix between two slices.
 */
export const getCommonPrefixLength = (a: Slice, b: Slice): number => {
  const len = Math.min(a.length, b.length);
  let i = 0;
  for (; i < len && a.at(i) === b.at(i); i++);
  return i;
};