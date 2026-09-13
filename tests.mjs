import assert from 'node:assert/strict';
import fs from 'node:fs';
import {score,solve,key} from './dist/solver.js';
const d=JSON.parse(fs.readFileSync(new URL('./dist/data.json',import.meta.url)));
assert.equal(d.recipes.length,42);assert.equal(d.iotas.length,40);
const fixture={maxIota:10,color:1,cells:[[0,0,1],[1,0,1],[4,0,1]],areas:[],board:Array.from({length:12},(_,i)=>[i-2,0,0])};
const p=c=>({color:1,cells:c});let s;
s=score(fixture,[4,1,2,0,0,0,0],[p([[0,0]]),p([[1,0]]),p([[4,0]])]);assert.equal(s.complexity,1);assert.equal(s.disconnected,1);
s=score(fixture,[4,1,10,0,0,0,0],[p([[0,0],[0,1],[0,2]])]);assert.equal(s.unsafeCount,1);assert.equal(s.unsafe,1);
s=score(fixture,[4,1,10,0,0,0,0],[p([[0,0]]),p([[0,0]]),p([[0,0]])]);assert.equal(s.overlapCount,1);assert.equal(s.overlap,1);
s=score(fixture,[4,1,10,0,0,0,0],[p([[9,0]])]);assert.equal(s.unanchored,1);assert.equal(s.total,1000);
const cost={...fixture,areas:[{cells:[[0,0,1]],effects:[{type:15,params:[9]}]}]};s=score(cost,[4,1,10,0,0,0,0],[p([[0,0]]),p([[1,0]])]);assert.equal(s.limit,1);assert.equal(s.total,1);
const forgive={...fixture,areas:[{cells:[[0,0,1]],effects:[{type:9,params:[1]}]}]};s=score(forgive,[4,1,10,0,0,0,0],[p([[0,0],[0,1]])]);assert.equal(s.unsafe,0);
const report=[];
for(const r of d.recipes){
 const targets=r.cells.filter(c=>c[2]>0&&c[2]<6).map(key);const result=solve({recipe:r,iotas:d.iotas,skills:d.characters[r.character].skills,targets,timeMs:300});
 // Independent geometry and color-coverage validation, against raw shapes.
 const actual=new Set();for(const p of result.placements){const raw=d.iotas.find(x=>x.id===p.id);assert.equal(p.color,raw.color);assert.equal(p.rotation,0);assert.deepEqual(p.cells,raw.cells.map(c=>[c[0]+p.q,c[1]+p.r]));p.cells.forEach(c=>actual.add(key(c)+','+p.color))}
 for(const c of r.cells.filter(c=>targets.includes(key(c))))assert.ok(actual.has(c.join(',')),r.internal+' missing '+c);
 assert.deepEqual(result.score,score(r,d.characters[r.character].skills,result.placements));assert.equal(result.provenOptimal,result.score.total===0);
 report.push({recipe:r.internal,targets:targets.length,particles:result.placements.length,penalties:result.score.total,iterations:result.iterations,ms:result.elapsedMs});
}
fs.writeFileSync(new URL('./validation.json',import.meta.url),JSON.stringify({tests:'penalty fixtures + all 42 recipes independently validated',results:report},null,2));console.log(JSON.stringify({passed:true,recipes:report.length,zeroPenalty:report.filter(r=>r.penalties===0).length,maxMs:Math.max(...report.map(r=>r.ms))}));
