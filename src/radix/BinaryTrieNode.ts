import {Slice} from './Slice';
import {Printable} from '../print/types';
import type {ITreeNode} from '../types';
import {first, next} from '../util';

export class BinaryTrieNode<V = unknown> implements ITreeNode<Slice, unknown>, Printable {
  public p: BinaryTrieNode<V> | undefined = undefined;
  public l: BinaryTrieNode<V> | undefined = undefined;
  public r: BinaryTrieNode<V> | undefined = undefined;
  public children: BinaryTrieNode<V> | undefined = undefined;

  constructor(
    public k: Slice,
    public v: V,
  ) {}

  public forChildren(callback: (child: BinaryTrieNode<V>, index: number) => void): void {
    let child = first(this.children);
    let i = 0;
    while (child) {
      callback(child, i);
      i++;
      child = next(child);
    }
  }

  public toRecord(prefix?: Uint8Array, record?: Record<string, unknown>): Record<string, unknown> {
    if (!record) record = {};
    const currentPrefix = prefix ? new Uint8Array([...prefix, ...this.k.toUint8Array()]) : this.k.toUint8Array();
    
    if (this.v !== undefined) {
      // Convert Uint8Array to string representation for record key
      const key = Array.from(currentPrefix).join(',');
      record[key] = this.v;
    }
    
    let child = first(this.children);
    while (child) {
      child.toRecord(currentPrefix, record);
      child = next(child);
    }
    
    return record;
  }

  public toString(tab: string = ''): string {
    const value = this.v === undefined ? '' : ` = ${JSON.stringify(this.v)}`;
    const childrenNodes: BinaryTrieNode<V>[] = [];
    this.forChildren((child) => childrenNodes.push(child));
    
    let result = `${this.constructor.name} ${this.k.toString()}${value}`;
    
    if (childrenNodes.length > 0) {
      result += '\n';
      childrenNodes.forEach((child, index) => {
        const isLast = index === childrenNodes.length - 1;
        const prefix = isLast ? '└── ' : '├── ';
        const childTab = tab + (isLast ? '    ' : '│   ');
        result += tab + prefix + child.toString(childTab).replace(/\n/g, '\n' + childTab);
        if (!isLast) result += '\n';
      });
    }
    
    return result;
  }
}