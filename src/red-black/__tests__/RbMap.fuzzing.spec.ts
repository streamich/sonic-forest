import {MapFuzzer} from '../../__tests__/MapFuzzer';
import {RbMap} from '../RbMap';

describe('RbMap fuzzing', () => {
  for (let i = 0; i < 25; i++) {
    test(`map instance ${i}`, () => {
      const map = new RbMap<number, number>();
      const fuzzer = new MapFuzzer(map);
      for (let j = 0; j < 1000; j++) fuzzer.runStep();
    });
  }
});
