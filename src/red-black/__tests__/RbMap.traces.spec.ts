import {TraceReplay} from '../../__tests__/TraceReplay';
import {Trace} from '../../__tests__/types';
import {RbMap} from '../RbMap';
import {assertRedBlackTree} from './utils';

const trace1: Trace = [
  ['insert', 47, 47],
  ['insert', 20, 20],
  ['insert', 14, 14],
  ['insert', 88, 88],
  ['insert', 71, 71],
  ['insert', 100, 100],
  ['insert', 8, 8],
  ['insert', 53, 53],
  ['insert', 46, 46],
  ['insert', 52, 52],
  ['delete', 41],
  ['delete', 41],
  ['delete', 36],
  ['delete', 67],
  ['delete', 68],
  ['delete', 0],
  ['delete', 77],
  ['delete', 27],
  ['delete', 7],
  ['delete', 75],
  ['delete', 62],
  ['delete', 11],
  ['delete', 31],
  ['delete', 1],
  ['delete', 79],
  ['delete', 80],
  ['delete', 96],
  ['delete', 14],
];

const trace2: Trace = [
  ['delete', 12],
  ['delete', 15],
  ['delete', 94],
  ['delete', 27],
  ['delete', 52],
  ['delete', 6],
  ['delete', 44],
  ['delete', 67],
  ['delete', 9],
  ['delete', 87],
  ['delete', 52],
  ['delete', 50],
  ['delete', 17],
  ['delete', 5],
  ['delete', 89],
  ['delete', 60],
  ['delete', 24],
  ['delete', 20],
  ['delete', 32],
  ['delete', 31],
  ['delete', 27],
  ['delete', 76],
  ['delete', 31],
  ['delete', 28],
  ['delete', 54],
  ['delete', 3],
  ['delete', 40],
  ['delete', 28],
  ['delete', 44],
  ['delete', 31],
  ['delete', 38],
  ['delete', 2],
  ['delete', 94],
  ['delete', 9],
  ['delete', 89],
  ['delete', 44],
  ['delete', 62],
  ['delete', 66],
  ['delete', 54],
  ['delete', 89],
  ['delete', 73],
  ['delete', 9],
  ['delete', 27],
  ['delete', 100],
  ['delete', 24],
  ['insert', 12, 12],
  ['insert', 4, 4],
  ['insert', 37, 37],
  ['insert', 20, 20],
  ['insert', 50, 50],
  ['delete', 34],
  ['delete', 91],
  ['delete', 75],
  ['delete', 58],
  ['delete', 24],
  ['delete', 66],
  ['delete', 46],
  ['delete', 74],
  ['delete', 73],
  ['clear'],
  ['insert', 27, 27],
  ['insert', 36, 36],
  ['insert', 61, 61],
  ['insert', 6, 6],
  ['insert', 10, 10],
  ['insert', 52, 52],
  ['insert', 94, 94],
  ['delete', 83],
  ['delete', 6],
  ['delete', 14],
  ['delete', 51],
  ['delete', 96],
  ['delete', 24],
  ['delete', 79],
  ['delete', 88],
  ['delete', 19],
  ['delete', 73],
  ['delete', 13],
  ['delete', 74],
  ['delete', 94],
  ['delete', 66],
  ['delete', 24],
  ['delete', 43],
  ['delete', 47],
  ['delete', 59],
  ['delete', 24],
  ['delete', 37],
  ['insert', 42, 42],
  ['insert', 20, 20],
  ['insert', 77, 77],
  ['insert', 26, 26],
  ['insert', 42, 42],
  ['delete', 32],
  ['delete', 10],
  ['delete', 37],
  ['delete', 16],
  ['delete', 32],
  ['delete', 84],
  ['delete', 53],
  ['delete', 99],
  ['insert', 7, 7],
  ['insert', 77, 77],
  ['insert', 9, 9],
  ['insert', 23, 23],
  ['insert', 46, 46],
  ['insert', 95, 95],
  ['insert', 33, 33],
  ['insert', 19, 19],
  ['insert', 26, 26],
  ['delete', 65],
  ['delete', 61],
  ['delete', 38],
  ['delete', 6],
  ['delete', 13],
  ['delete', 41],
  ['delete', 85],
  ['delete', 81],
  ['delete', 6],
  ['delete', 59],
  ['delete', 77],
  ['delete', 28],
  ['delete', 13],
  ['delete', 27],
  ['delete', 74],
  ['delete', 46],
  ['clear'],
  ['insert', 97, 97],
  ['insert', 10, 10],
  ['insert', 74, 74],
  ['insert', 87, 87],
  ['insert', 81, 81],
  ['insert', 48, 48],
  ['delete', 98],
  ['delete', 48],
  ['delete', 96],
  ['delete', 97],
  ['delete', 69],
  ['delete', 43],
  ['delete', 94],
  ['delete', 56],
  ['delete', 85],
  ['delete', 26],
  ['delete', 31],
  ['delete', 60],
  ['delete', 48],
  ['delete', 49],
  ['delete', 83],
  ['delete', 49],
  ['delete', 39],
  ['delete', 8],
  ['delete', 89],
  ['delete', 74],
  ['delete', 15],
  ['delete', 88],
  ['delete', 38],
  ['delete', 94],
  ['delete', 25],
  ['delete', 60],
  ['delete', 3],
  ['delete', 73],
  ['delete', 76],
  ['delete', 30],
  ['delete', 12],
  ['delete', 88],
  ['delete', 81],
  ['delete', 30],
  ['delete', 55],
  ['delete', 100],
  ['delete', 97],
  ['delete', 64],
  ['delete', 87],
];

const trace3: Trace = [
  ['insert', 13, 13],
  ['insert', 17, 17],
  ['insert', 63, 63],
  ['delete', 99],
  ['delete', 66],
  ['delete', 4],
  ['delete', 33],
  ['delete', 33],
  ['delete', 92],
  ['delete', 17],
  ['delete', 23],
  ['delete', 96],
  ['delete', 27],
  ['delete', 56],
  ['delete', 63],
];

const trace4: Trace = [
  ['insert', 35, 35],
  ['insert', 56, 56],
  ['insert', 78, 78],
  ['insert', 14, 14],
  ['insert', 1, 1],
  ['insert', 52, 52],
  ['insert', 88, 88],
  ['delete', 31],
  ['delete', 24],
  ['delete', 26],
  ['delete', 45],
  ['delete', 10],
  ['delete', 74],
  ['delete', 71],
  ['delete', 84],
  ['delete', 80],
  ['delete', 27],
  ['delete', 74],
  ['delete', 17],
  ['delete', 47],
  ['delete', 5],
  ['delete', 38],
  ['delete', 3],
  ['delete', 24],
  ['delete', 45],
  ['delete', 75],
  ['delete', 87],
  ['delete', 70],
  ['delete', 12],
  ['delete', 34],
  ['delete', 89],
  ['delete', 33],
  ['delete', 72],
  ['delete', 95],
  ['delete', 78],
  ['delete', 90],
  ['delete', 41],
  ['delete', 32],
  ['delete', 12],
  ['delete', 26],
  ['delete', 54],
  ['delete', 92],
  ['delete', 43],
  ['delete', 2],
  ['delete', 18],
  ['delete', 6],
  ['delete', 4],
  ['delete', 37],
  ['delete', 15],
  ['delete', 85],
  ['delete', 38],
  ['delete', 98],
  ['delete', 48],
  ['delete', 33],
  ['delete', 67],
  ['delete', 2],
  ['delete', 70],
  ['delete', 54],
  ['delete', 81],
  ['delete', 30],
  ['delete', 68],
  ['delete', 76],
  ['delete', 91],
  ['delete', 22],
  ['delete', 32],
  ['delete', 57],
  ['delete', 15],
  ['delete', 37],
  ['delete', 82],
  ['delete', 58],
  ['delete', 1],
  ['delete', 34],
  ['delete', 8],
  ['delete', 37],
  ['delete', 98],
  ['delete', 70],
  ['delete', 1],
  ['insert', 85, 85],
  ['insert', 99, 99],
];

const trace5: Trace = [
  ['insert', 59, 59],
  ['insert', 86, 86],
  ['insert', 56, 56],
  ['insert', 43, 43],
  ['insert', 24, 24],
  ['delete', 59],
  ['insert', 90, 90],
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

test('trace 2', () => {
  const map = new RbMap<number, number>();
  const replay = new TraceReplay(trace2, (step) => {
    assertRedBlackTree(map.root as any);
  });
  replay.run(map);
});

test('trace 3', () => {
  const map = new RbMap<number, number>();
  const replay = new TraceReplay(trace3, (step) => {
    assertRedBlackTree(map.root as any);
  });
  replay.run(map);
});

test('trace 4', () => {
  const map = new RbMap<number, number>();
  const replay = new TraceReplay(trace4, (step) => {
    assertRedBlackTree(map.root as any);
  });
  replay.run(map);
});

test('trace 5', () => {
  const map = new RbMap<number, number>();
  const replay = new TraceReplay(trace5, (step) => {
    // console.log(step);
    // console.log(map + '');
    assertRedBlackTree(map.root as any);
  });
  replay.run(map);
});
