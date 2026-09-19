import assert from 'node:assert/strict';
import {combinationAt,seedPlans} from './tools/area-plans.mjs';
for(let n=1;n<=12;n++){
 const seen=new Set();for(let i=0;i<2**n-1;i++){const areas=combinationAt(n,i);assert.ok(areas.length);assert.ok(areas.every(j=>j>=0&&j<n));seen.add(areas.join(','));}
 assert.equal(seen.size,2**n-1);assert.deepEqual(combinationAt(n,0),combinationAt(n,2**n-1));
}
const recipe={areas:[{},{},{}]},entries=[{result:{score:{total:1,activeAreas:[0,2]}}}];const plans=seedPlans(recipe,entries);assert.deepEqual(plans[0],[0,2]);assert.ok(plans.some(a=>a.join(',')==='0,1,2'));assert.ok(plans.some(a=>a.join(',')==='0'));assert.ok(plans.some(a=>a.join(',')==='2'));
console.log('PASS: all nonempty combinations exactly once for 1–12 areas, resumable cursors and every retained tradeoff neighborhood.');
