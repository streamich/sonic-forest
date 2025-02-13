import {assertMapContents} from './util';
import type {SonicMap} from '../types';
import type {Trace, TraceStep} from './types';

export class TraceReplay {
  public readonly twin: Map<number, number> = new Map();

  constructor(
    public readonly trace: Trace,
    public readonly beforeStep?: (step: TraceStep, replay: TraceReplay) => void,
  ) {}

  public run(map: SonicMap<number, number>): void {
    this.twin.clear();
    for (const step of this.trace) {
      const [type, k, v] = step;
      this.beforeStep?.(step, this);
      switch (type) {
        case 'insert': {
          map.set(k, v);
          this.twin.set(k, v);
          this.assertContents(map);
          break;
        }
        case 'delete': {
          map.del(k);
          this.twin.delete(k);
          this.assertContents(map);
          break;
        }
        case 'clear': {
          map.clear();
          this.twin.clear();
          this.assertContents(map);
          break;
        }
      }
    }
  }

  public assertContents(map: SonicMap<number, number>): void {
    assertMapContents(map, this.twin);
  }
}
