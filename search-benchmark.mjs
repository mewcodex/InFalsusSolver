import fs from 'node:fs';
import * as old from './fixtures/solver-before-indexing.mjs';
import * as next from './dist/solver.js';
const d=JSON.parse(fs.readFileSync('dist/data.json'));
const rows=[];
for(const recipe of d.recipes){
 const args={recipe,iotas:d.iotas,skills:d.characters[recipe.character].skills,targets:recipe.cells.filter(c=>c[2]>0&&c[2]<6).map(next.key),timeMs:350,seed:1123};
 const order=rows.length%2?[next,old]:[old,next],results=new Map(order.map(mod=>[mod,mod.solve(args)]));
 const a=results.get(old),b=results.get(next);
 rows.push({id:recipe.id,before:a.score.total,after:b.score.total,oldIterations:a.iterations,newIterations:b.iterations,oldMs:a.elapsedMs,newMs:b.elapsedMs});
}
fs.writeFileSync('search-benchmark.json',JSON.stringify(rows,null,2));
console.log({recipes:rows.length,improved:rows.filter(x=>x.after<x.before).length,regressed:rows.filter(x=>x.after>x.before).length,oldIterations:rows.reduce((n,x)=>n+x.oldIterations,0),newIterations:rows.reduce((n,x)=>n+x.newIterations,0)});
