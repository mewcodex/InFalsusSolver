import fs from 'node:fs';
import assert from 'node:assert/strict';
import * as old from './fixtures/solver-before-indexing.mjs';
import * as next from './dist/solver.js';
const d=JSON.parse(fs.readFileSync('dist/data.json'));
const realNow=Date.now;
let checked=0;
for(const recipe of d.recipes)for(const excludeTier3 of [false,true]){
 const args={recipe,iotas:d.iotas,skills:d.characters[recipe.character].skills,targets:recipe.cells.filter(c=>c[2]>0&&c[2]<6).map(next.key),timeMs:1000,seed:327,excludeTier3};
 const run=fn=>{let clock=0;Date.now=()=>clock++;try{return fn(args)}finally{Date.now=realNow}};
 const a=run(old.solve),b=run(next.solve);
 assert.deepEqual(b,a,`trajectory changed: ${recipe.id} / ${excludeTier3}`);checked++;
}
console.log({identicalSearchTrajectories:checked});
