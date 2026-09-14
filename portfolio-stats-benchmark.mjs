import fs from 'node:fs';import assert from 'node:assert/strict';import {maximizeStats,score} from './dist/solver.js';
const d=JSON.parse(fs.readFileSync('dist/data.json')),ranking=JSON.parse(fs.readFileSync('dist/ranking-data.json')),rows=[];
for(const seed of [1123,47119])for(const row of ranking.rows.filter(r=>r.result.value<r.upper)){
 const recipe=d.recipes.find(r=>r.id===row.id),args={recipe,iotas:d.iotas,skills:d.characters[recipe.character].skills,timeMs:1500,seed,initialSolution:row.result};
 const results={};for(const searchStrategy of rows.length%2?['portfolio','legacy']:['legacy','portfolio']){const x=maximizeStats({...args,searchStrategy});assert.deepEqual(x.score,score(recipe,args.skills,x.placements));assert.ok(x.value>=row.result.value);results[searchStrategy]=x;}
 rows.push({id:recipe.id,seed,initial:row.result.value,before:results.legacy.value,after:results.portfolio.value,result:results.portfolio});
 console.log(JSON.stringify({id:recipe.id,seed,before:results.legacy.value,after:results.portfolio.value}));
}
fs.writeFileSync('portfolio-stats-benchmark.json',JSON.stringify(rows));console.log({cases:rows.length,improved:rows.filter(x=>x.after>x.before).length,regressed:rows.filter(x=>x.after<x.before).length,before:rows.reduce((n,x)=>n+x.before,0),after:rows.reduce((n,x)=>n+x.after,0)});
