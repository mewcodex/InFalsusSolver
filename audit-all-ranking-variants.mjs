import {retainConditionSolution} from './dist/conditions.js';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {maximizeStats,score} from './dist/solver.js';
import {recipeStats,theoreticalStats} from './dist/card-stats.js';
const d=JSON.parse(fs.readFileSync('dist/data.json')),ranking=JSON.parse(fs.readFileSync('dist/ranking-data.json'));
const f32=x=>new Float32Array([x])[0],key=c=>c.slice(0,2).join(',');
function independent(r,placements){
 const safe=new Set(r.cells.map(key)),occupied=new Map(),color=new Set();
 for(const [i,p] of placements.entries()){const raw=d.iotas.find(t=>t.id===p.id);assert.equal(raw.color,p.color);assert.deepEqual(p.cells,raw.cells.map(c=>[c[0]+p.q,c[1]+p.r]));for(const c of p.cells){assert.ok(r.board.some(b=>key(b)===key(c)));const k=key(c);occupied.set(k,[...(occupied.get(k)||[]),i]);color.add(k+','+p.color);}}
 const active=r.areas.map((a,i)=>a.cells.length&&a.cells.every(c=>color.has(c.join(',')))?i:-1).filter(i=>i>=0);
 const effects=active.flatMap(i=>r.areas[i].effects),sum=t=>effects.filter(e=>e.type===t).reduce((s,e)=>s+Number(e.params[0]),0),skills=d.characters[r.character].skills;
 const groups=[];const pending=new Set(placements.map((_,i)=>i));while(pending.size){const todo=[pending.values().next().value],group=[];pending.delete(todo[0]);while(todo.length){const i=todo.pop();group.push(i);for(const j of pending){if(placements[i].cells.some(a=>placements[j].cells.some(b=>Math.max(Math.abs(a[0]-b[0]),Math.abs(a[1]-b[1]),Math.abs(a[0]+a[1]-b[0]-b[1]))<=1))){pending.delete(j);todo.push(j);}}}groups.push(group);}
 const limit=Math.min(r.maxIota,skills[2])-sum(15),unsafe=placements.filter(p=>p.cells.some(c=>!safe.has(key(c)))).length,overlap=[...occupied.values()].filter(v=>v.length>1).length;
 const unanchored=groups.some(g=>!g.some(i=>placements[i].cells.some(c=>safe.has(key(c)))));
 const strikes=Math.max(0,placements.length-limit)+Math.max(0,unsafe-skills[3]-sum(9))+Math.max(0,overlap-skills[4]-sum(10))+Math.max(0,groups.length-1-skills[5]-sum(11))+(unanchored?999:0);
 const retention=strikes>=3?0:f32((9-strikes**2)/9),potency=placements.length?f32(999/100):0;
 return {active,strikes,power:Math.ceil(sum(3)*(1+sum(5)/100)*retention*potency),fortitude:Math.ceil(sum(4)*(1+sum(6)/100)*retention*potency)};
}
function verify(r,x){const independentResult=independent(r,x.placements),s=theoreticalStats(r,x);assert.deepEqual(independentResult.active,x.score.activeAreas);assert.equal(independentResult.strikes,x.score.total);assert.equal(independentResult.power,s.power);assert.equal(independentResult.fortitude,s.fortitude);return s;}
// Every saved solution is audited before optimization, with independent geometry,
// graph connectivity, area activation, penalties and stat arithmetic.
for(const row of ranking.rows)for(const saved of row.variants){const r=d.recipes.find(r=>r.id===row.id),stats=verify(r,saved);assert.equal(stats.power+stats.fortitude,saved.value);const upper=recipeStats(r);assert.equal(row.upper,upper.power+upper.fortitude);}
console.log('Independent audit: all saved variants, activation and penalties agree.');
