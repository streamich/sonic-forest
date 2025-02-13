/**
 * NODE_ENV=production node --prof profiler/rb-remove.js
 * node --prof-process isolate-0xnnnnnnnnnnnn-v8.log
 */

const {RbMap} = require('../lib/red-black/RbMap');

const map = new RbMap();
const iterations = 30000000;

for (let j = 0; j < iterations; j++) {
  map.set(j, j);
}

for (let j = 0; j < iterations; j++) {
  map.del(j);
}
