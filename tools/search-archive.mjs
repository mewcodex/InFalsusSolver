import fs from 'node:fs';import {score,maximizeStats} from '../dist/solver.js';import {retainSolution,archiveDomain} from '../dist/solution-archive.js';
// Run from repository root: node tools/search-archive.mjs [milliseconds-per-recipe] [recipe-id]
const data=JSON.parse(fs.readFileSync('dist/data.json')),path='dist/solution-archive-data.json',archive=JSON.parse(fs.readFileSync(path)),budget=Number(process.argv[2]||5000),recipeId=Number(process.argv[3]);
for(const recipe of data.recipes.filter(r=>!recipeId||r.id===recipeId)){
 const entries=archive.domains[archiveDomain(recipe.id)]??=[];
 const accept=result=>{result={...result,score:score(recipe,data.characters[recipe.character].skills,result.placements)};retainSolution(recipe,entries,result);if(result.placements.every(p=>p.tier!==3))retainSolution(recipe,archive.domains[archiveDomain(recipe.id,true)]??=[],result);};
 maximizeStats({recipe,iotas:data.iotas,skills:data.characters[recipe.character].skills,timeMs:budget,seed:Date.now(),onCandidate:accept},m=>{if(m.result)accept(m.result)});
 fs.writeFileSync(path+'.tmp',JSON.stringify(archive));fs.renameSync(path+'.tmp',path);console.log({recipe:recipe.id,retained:entries.length});
}
