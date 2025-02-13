import {assertMapContents} from './util';
import type {FuzzerSonicMap, Trace} from './types';

export class MapFuzzer {
  public readonly twin: Map<number, number> = new Map();
  public readonly trace: Trace = [];

  constructor(public readonly map: FuzzerSonicMap) {}

  public runStep(): void {
    const insertCount = Math.random() < 0.5 ? 0 : Math.round(Math.random() * 10);
    const deleteCount = Math.random() < 0.5 ? Math.round(Math.random() * 40) : Math.round(Math.random() * 10);
    const doClear = Math.random() < 0.1;
    for (let i = 0; i < insertCount; i++) {
      const number = Math.round(Math.random() * 100);
      this.map.set(number, number);
      this.twin.set(number, number);
      this.trace.push(['insert', number, number]);
      this.assertContents();
    }
    for (let i = 0; i < deleteCount; i++) {
      const number = Math.round(Math.random() * 100);
      this.map.del(number);
      this.twin.delete(number);
      this.trace.push(['delete', number]);
      this.assertContents();
    }
    if (doClear) {
      this.map.clear();
      this.twin.clear();
      this.trace.push(['clear']);
      this.assertContents();
    }
  }

  public assertContents(): void {
    try {
      assertMapContents(this.map, this.twin);
    } catch (error) {
      // tslint:disable-next-line no-console
      console.log('Trace:', JSON.stringify(this.trace));
      throw error;
    }
  }
}
