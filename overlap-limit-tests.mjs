import assert from 'node:assert/strict';
import fs from 'node:fs';
import {hasLegalOverlap,overlapViolations} from './dist/placement-rules.js';
import {score,solve,maximizeStats,solveConstrained} from './dist/solver.js';
import {retainSolution} from './dist/solution-archive.js';
const piece={id:1,color:1,cells:[[0,0]],q:0,r:0,tier:1},r={id:1,color:1,maxIota:20,cells:[[0,0,1]],areas:[{cells:[[0,0,1]],effects:[]}]},skills=[0,0,20,99,99,99,0];
assert.ok(hasLegalOverlap([piece,piece,piece]));assert.ok(!hasLegalOverlap([piece,piece,piece,piece]));assert.equal(score(r,skills,[piece,piece,piece]).total,0);assert.equal(score(r,skills,[piece,piece,piece,piece]).total,Infinity);assert.equal(score(r,skills,[piece,piece,piece,piece]).invalidOverlap,true);assert.deepEqual(overlapViolations([piece,piece,piece,piece]),[{cell:'0,0',count:4}]);
const invalid={placements:[piece,piece,piece,piece],score:{...score(r,skills,[piece]),total:0}};
assert.equal(retainSolution(r,[],invalid),false);
const legacy=[{recipeId:1,result:invalid}],valid={placements:[piece],score:score(r,skills,[piece])};assert.ok(retainSolution(r,legacy,valid));assert.equal(legacy.length,1);assert.ok(hasLegalOverlap(legacy[0].result.placements));
const d=JSON.parse(fs.readFileSync('dist/data.json')),recipe=d.recipes.find(r=>r.id===66),team=JSON.parse(fs.readFileSync('dist/team-score-data.json')),initial=structuredClone(team.cards.find(c=>c.id===66).crafting);
// Deliberately poison a valid saved seed and its cached score. Every old search
// entry point must rescore/filter it rather than accepting a cached zero penalty.
initial.placements.push(...Array(4).fill(initial.placements[0]));initial.score.total=0;
for(const fn of [solve,maximizeStats,solveConstrained]){
 let callbacks=0;const result=fn({recipe,iotas:d.iotas,skills:d.characters[recipe.character].skills,targets:recipe.areas[0].cells.map(c=>c.slice(0,2).join(',')),initialSolution:initial,timeMs:200,minSlots:0,minRange:1,cardColor:0,onCandidate:x=>{assert.ok(hasLegalOverlap(x.placements));callbacks++;}},m=>{if(m.result)assert.ok(hasLegalOverlap(m.result.placements));});
 assert.ok(hasLegalOverlap(result.placements));assert.ok(Number.isFinite(result.score.total));
}
console.log('PASS: three legal, four illegal despite 99 forgiveness, poisoned archive rejection, all three search modes and callbacks.');
