import fs from 'node:fs';
import assert from 'node:assert/strict';
import {hasLegalOverlap} from '../dist/placement-rules.js';
import {score,key} from '../dist/solver.js';
import {theoreticalStats} from '../dist/card-stats.js';
import {features} from '../dist/conditions.js';
const read=p=>JSON.parse(fs.readFileSync('dist/'+p)),data=read('data.json');let checked=0;
function check(recipeId,result,label){
 const r=data.recipes.find(r=>r.id===recipeId);assert.ok(r,label+' recipe');assert.ok(hasLegalOverlap(result.placements),label+' has fourfold overlap');
 for(const p of result.placements){const raw=data.iotas.find(i=>i.id===p.id);assert.ok(raw,label+' particle');assert.equal(raw.color,p.color,label);assert.deepEqual(p.cells,raw.cells.map(c=>[c[0]+p.q,c[1]+p.r]),label);assert.ok(p.cells.every(c=>r.board.some(b=>key(c)===key(b))),label);}
 assert.deepEqual(result.score,score(r,data.characters[r.character].skills,result.placements),label);if(result.stats)assert.deepEqual(result.stats,theoreticalStats(r,result),label);checked++;return r;
}
for(const row of read('ranking-data.json').rows)for(const [i,result]of[row.result,...row.variants||[]].entries())check(row.id,result,'ranking/'+row.id+'/'+i);
for(const [domain,entries]of Object.entries(read('solution-archive-data.json').domains))for(const e of entries){const id=Number(domain.split(':')[0]);assert.equal(e.recipeId,id);check(id,e.result,'archive/'+domain+'/'+e.areas);if(domain.endsWith('no-tier3'))assert.ok(e.result.placements.every(p=>p.tier!==3));}
for(const file of ['team-data.json','team-score-data.json','team-balanced-data.json'])for(const c of read(file).cards){const r=check(c.id,c.crafting,file+'/'+c.position),stats=theoreticalStats(r,c.crafting),f=features(r,c.crafting);assert.equal(c.power,stats.power);assert.equal(c.fortitude,stats.fortitude);for(const k of ['slots','left','right'])assert.equal(c[k],f[k]);assert.ok(f.colors.includes(c.color));}
console.log(JSON.stringify({checked,maxParticlesPerCell:3,valid:true}));
