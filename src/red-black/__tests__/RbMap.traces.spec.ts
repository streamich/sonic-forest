import {TraceReplay} from '../../__tests__/TraceReplay';
import {Trace} from '../../__tests__/types';
import {RbMap} from '../RbMap';
import {assertRedBlackTree} from './utils';

const trace1: Trace = [
  ["insert", 47, 47],
  ["insert", 20, 20],
  ["insert", 14, 14],
  ["insert", 88, 88],
  ["insert", 71, 71],
  ["insert", 100, 100],
  ["insert", 8, 8],
  ["insert", 53, 53],
  ["insert", 46, 46],
  ["insert", 52, 52],
  ["delete", 41],
  ["delete", 41],
  ["delete", 36],
  ["delete", 67],
  ["delete", 68],
  ["delete", 0],
  ["delete", 77],
  ["delete", 27],
  ["delete", 7],
  ["delete", 75],
  ["delete", 62],
  ["delete", 11],
  ["delete", 31],
  ["delete", 1],
  ["delete", 79],
  ["delete", 80],
  ["delete", 96],
  ["delete", 14]
];

test('trace 1', () => {
  const map = new RbMap<number, number>();
  const replay = new TraceReplay(trace1, (step) => {
    // console.log(step);
    // console.log(map + '');
    assertRedBlackTree(map.root as any);
  });
  replay.run(map);
});
