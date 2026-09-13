import assert from 'node:assert/strict';
import fs from 'node:fs';
import {maximizeStats,score} from './dist/solver.js';
import {recipeStats,theoreticalStats} from './dist/card-stats.js';
const iotas=[{id:1,internal:'single',color:1,tier:1,size:1,cells:[[0,0]]}];
const recipe={maxIota:1,color:1,cells:[[0,0,1],[1,0,1],[2,0,1]],board:[[0,0],[1,0],[2,0]],areas:[{cells:[[0,0,1]],effects:[{type:3,params:[1000]}]},{cells:[[1,0,1],[2,0,1]],effects:[{type:4,params:[100]}]}]};
const skills=[4,1,1,0,0,0,0];
const result=maximizeStats({recipe,iotas,skills,timeMs:650});
assert.equal(result.value,9990);assert.equal(result.score.total,0);assert.deepEqual(result.score.activeAreas,[0]);assert.equal(result.provenOptimal,false);assert.equal(recipeStats(recipe).fortitude,999);
const required=maximizeStats({recipe,iotas,skills,targets:['1,0','2,0'],timeMs:650});assert.ok(required.score.activeAreas.includes(1));assert.ok(required.placements.some(p=>p.cells.some(c=>c[0]===1)));assert.ok(required.placements.some(p=>p.cells.some(c=>c[0]===2)));assert.ok(required.value<result.value);
const all={...recipe,maxIota:3};const optimal=maximizeStats({recipe:all,iotas,skills:[4,1,3,0,0,0,0],timeMs:650});assert.equal(optimal.value,10989);assert.equal(optimal.provenOptimal,true);
const d=JSON.parse(fs.readFileSync('dist/data.json'));let positive=0;
for(const r of d.recipes){const x=maximizeStats({recipe:r,iotas:d.iotas,skills:d.characters[r.character].skills,timeMs:250});assert.deepEqual(x.score,score(r,d.characters[r.character].skills,x.placements));const a=theoreticalStats(r,x);assert.equal(x.value,a.power+a.fortitude);for(const p of x.placements){const raw=d.iotas.find(i=>i.id===p.id);assert.deepEqual(p.cells,raw.cells.map(c=>[c[0]+p.q,c[1]+p.r]));}if(x.value>0)positive++;}
console.log({passed:true,recipes:d.recipes.length,positive,fixtures:'curse tradeoff, honors required areas, verifiable upper bound'});

const heroRecipe=d.recipes.find(r=>r.id===72),heroFixture=JSON.parse(fs.readFileSync('fixtures/hero-required.json'));
assert.deepEqual(heroFixture.score.activeAreas,[6,7,8,9,14]);
const heroStats=theoreticalStats(heroRecipe,heroFixture);assert.equal(heroStats.power,53946);assert.equal(heroStats.fortitude,29970);assert.equal(heroFixture.score.total,0);
const resumed=maximizeStats({recipe:heroRecipe,iotas:d.iotas,skills:d.characters[heroRecipe.character].skills,initialSolution:heroFixture,timeMs:250});assert.ok(resumed.value>=83916);
console.log('Hero area 7/8/9/10/15 fixture and non-regressing resumed search passed');
