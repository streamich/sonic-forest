import type {SonicMap} from '../types';
import {Trace} from './types';
import {assertMapContents} from './util';

export class MapFuzzer {
  public readonly twin: Map<number, number> = new Map();
  public readonly trace: Trace = [];

  constructor(
    public readonly map: SonicMap<number, number>,
  ) {}

  public runStep(): void {
    const insertCount = Math.random() < .5 ? 0 : Math.round(Math.random() * 10);
    const deleteCount = Math.random() < .5 ? Math.round(Math.random() * 40) : Math.round(Math.random() * 10);
    const doClear = Math.random() < .1;
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
      console.log('Trace:', JSON.stringify(this.trace));
      throw error;
    }
  }
}
