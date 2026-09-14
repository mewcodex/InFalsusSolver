import fs from 'node:fs';import assert from 'node:assert/strict';
import {solve,solveConstrained,score,key,maximizeStats} from './dist/solver.js';
import {satisfies} from './dist/conditions.js';
import * as experiment from './fixtures/solver-experimental-backtracking.mjs';
const d=JSON.parse(fs.readFileSync('dist/data.json')),ranking=JSON.parse(fs.readFileSync('dist/ranking-data.json'));let cases=0;
function verify(r,x,targets,excludeTier3){
 assert.deepEqual(x.score,score(r,d.characters[r.character].skills,x.placements));const covered=new Set();
 for(const p of x.placements){const raw=d.iotas.find(i=>i.id===p.id);assert.ok(raw);assert.equal(p.color,raw.color);assert.equal(p.rotation,0);assert.deepEqual(p.cells,raw.cells.map(c=>[c[0]+p.q,c[1]+p.r]));if(excludeTier3)assert.notEqual(raw.tier,3);for(const c of p.cells){assert.ok(r.board.some(b=>key(b)===key(c)));covered.add(key(c)+','+p.color);}}
 for(const c of r.cells.filter(c=>targets.includes(key(c))))assert.ok(covered.has(c.join(',')));cases++;
}
for(const recipe of d.recipes){const targets=recipe.areas.find(a=>a.cells.length)?.cells.map(key)||[],initialSolution=ranking.rows.find(r=>r.id===recipe.id).result;
 for(const searchStrategy of ['portfolio','exact'])for(const excludeTier3 of [false,true]){
 const args={recipe,iotas:d.iotas,skills:d.characters[recipe.character].skills,targets,initialSolution,excludeTier3,searchStrategy,timeMs:100};
 const api=searchStrategy==='exact'?experiment:{solve,maximizeStats};verify(recipe,api.solve(args),targets,excludeTier3);verify(recipe,api.maximizeStats(args),targets,excludeTier3);
 }
}
const r=d.recipes.find(r=>r.id===72);for(const searchStrategy of ['portfolio','exact']){const fn=searchStrategy==='exact'?experiment.solveConstrained:solveConstrained;const x=fn({recipe:r,iotas:d.iotas,skills:d.characters[r.character].skills,minSlots:3,cardColor:5,minRange:1,excludeTier3:true,searchStrategy,timeMs:350});assert.ok(satisfies(r,x,3,5,1));verify(r,x,[],true);}
console.log({passed:true,cases,checks:'raw geometry, board bounds, required colors, tier filtering, independent rescoring, constrained search'});
