// npx ts-node src/__bench__/bench.map.insert.nums.libs.ts

import {runBenchmark, IBenchmark} from './runBenchmark';
import {Tree} from '../Tree';
import {AvlBstNumNumMap} from '../avl/AvlBstNumNumMap';
import {RadixTree} from '../radix/RadixTree';
import * as payloads from './payloads';
import BTree from 'sorted-btree';
import {OrderedMap} from 'js-sdsl';
import {AvlMap} from '../avl/AvlMap';
import {AvlMap as AvlMapOld} from '../avl/AvlMapOld';
import {RbMap} from '../red-black/RbMap';
import {LlrbTree} from '../llrb-tree/LlrbTree';
import {SortedMap} from '../SortedMap/SortedMap';

const benchmark: IBenchmark = {
  name: 'Numeric inserts into maps',
  warmup: 100,
  payloads: payloads.numbers,
  runners: [
    // {
    //   name: 'json-joy AvlBstNumNumMap',
    //   setup: () => {
    //     return (num: unknown) => {
    //       const map = new AvlBstNumNumMap();
    //       const numbers = num as number[];
    //       const length = numbers.length;
    //       for (let i = 0; i < length; i++) {
    //         const key = numbers[i];
    //         map.set(key, key);
    //       }
    //     };
    //   },
    // },
    // {
    //   name: 'json-joy AvlMapOld<number, number>',
    //   setup: () => {
    //     return (num: unknown) => {
    //       const map = new AvlMapOld<number, number>();
    //       const numbers = num as number[];
    //       const length = numbers.length;
    //       for (let i = 0; i < length; i++) {
    //         const key = numbers[i];
    //         map.set(key, key);
    //       }
    //     };
    //   },
    // },
    {
      name: 'json-joy AvlMap<number, number>',
      setup: () => {
        return (num: unknown) => {
          const map = new AvlMap<number, number>();
          const numbers = num as number[];
          const length = numbers.length;
          for (let i = 0; i < length; i++) {
            const key = numbers[i];
            map.set(key, key);
          }
        };
      },
    },
    {
      name: 'json-joy RbMap<number, number>',
      setup: () => {
        return (num: unknown) => {
          const map = new RbMap<number, number>();
          const numbers = num as number[];
          const length = numbers.length;
          for (let i = 0; i < length; i++) {
            const key = numbers[i];
            map.set(key, key);
          }
        };
      },
    },
    {
      name: 'json-joy LlrbTree<number, number>',
      setup: () => {
        return (num: unknown) => {
          const map = new LlrbTree<number, number>();
          const numbers = num as number[];
          const length = numbers.length;
          for (let i = 0; i < length; i++) {
            const key = numbers[i];
            map.set(key, key);
          }
        };
      },
    },
    {
      name: 'json-joy SortedMap<number, number>',
      setup: () => {
        return (num: unknown) => {
          const map = new SortedMap<number, number>();
          const numbers = num as number[];
          const length = numbers.length;
          for (let i = 0; i < length; i++) {
            const key = numbers[i];
            map.setElement(key, key);
          }
        };
      },
    },
    // {
    //   name: 'json-joy Tree<number, number>',
    //   setup: () => {
    //     return (num: unknown) => {
    //       const map = new Tree<number, number>();
    //       const numbers = num as number[];
    //       const length = numbers.length;
    //       for (let i = 0; i < length; i++) {
    //         const key = numbers[i];
    //         map.set(key, key);
    //       }
    //     };
    //   },
    // },
    // {
    //   name: 'json-joy RadixTree',
    //   setup: () => {
    //     return (num: unknown) => {
    //       const map = new RadixTree();
    //       const numbers = num as number[];
    //       const length = numbers.length;
    //       for (let i = 0; i < length; i++) {
    //         const key = numbers[i];
    //         map.set('' + key, key);
    //       }
    //     };
    //   },
    // },
    // {
    //   name: 'sorted-btree BTree<number, number>',
    //   setup: () => {
    //     return (num: unknown) => {
    //       const map = new BTree<number, number>();
    //       const numbers = num as number[];
    //       const length = numbers.length;
    //       for (let i = 0; i < length; i++) {
    //         const key = numbers[i];
    //         map.set(key, key);
    //       }
    //     };
    //   },
    // },
    // {
    //   name: 'js-sdsl OrderedMap<number, number>',
    //   setup: () => {
    //     return (num: unknown) => {
    //       const map = new OrderedMap<number, number>();
    //       const numbers = num as number[];
    //       const length = numbers.length;
    //       for (let i = 0; i < length; i++) {
    //         const key = numbers[i];
    //         map.setElement(key, key);
    //       }
    //     };
    //   },
    // },
  ],
};

runBenchmark(benchmark);
