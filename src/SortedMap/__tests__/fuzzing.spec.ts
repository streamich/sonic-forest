import {MapFuzzer} from '../../__tests__/MapFuzzer';
import {SortedMap} from '../SortedMap';

describe('red-black tree fuzzing', () => {
  for (let i = 0; i < 50; i++) {
    test(`map instance ${i}`, () => {
      const map = new SortedMap<number, number>();
      const fuzzer = new MapFuzzer(map);
      for (let j = 0; j < 1000; j++) fuzzer.runStep();
    });
  }
});
