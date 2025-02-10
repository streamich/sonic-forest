import {MapFuzzer} from '../../__tests__/MapFuzzer';
import {AvlMap} from '../AvlMap';

describe('AvlMap fuzzing', () => {
  for (let i = 0; i < 50; i++) {
    test(`map instance ${i}`, () => {
      const map = new AvlMap<number, number>();
      const fuzzer = new MapFuzzer(map);
      for (let j = 0; j < 1000; j++) fuzzer.runStep();
    });
  }
});
