import fs from 'node:fs';import assert from 'node:assert/strict';import {solve,score,key} from './fixtures/solver-experimental-backtracking.mjs';
const d=JSON.parse(fs.readFileSync('dist/data.json')),rows=[];
for(const seed of [1123,937,47119])for(const recipe of d.recipes){
 const args={recipe,iotas:d.iotas,skills:d.characters[recipe.character].skills,targets:recipe.cells.filter(c=>c[2]>0&&c[2]<6).map(key),timeMs:250,seed};
 const results={};for(const searchStrategy of rows.length%2?['exact','legacy']:['legacy','exact']){const x=solve({...args,searchStrategy});assert.deepEqual(x.score,score(recipe,args.skills,x.placements));results[searchStrategy]=x;}
 rows.push({id:recipe.id,seed,before:results.legacy.score.total,after:results.exact.score.total,oldIterations:results.legacy.iterations,newIterations:results.exact.iterations});
}
fs.writeFileSync('exact-benchmark.json',JSON.stringify(rows,null,2));console.log({cases:rows.length,improved:rows.filter(x=>x.after<x.before).length,regressed:rows.filter(x=>x.after>x.before).length,before:rows.reduce((n,x)=>n+x.before,0),after:rows.reduce((n,x)=>n+x.after,0)});
