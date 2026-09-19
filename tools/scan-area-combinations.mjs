import fs from 'node:fs';
import {solve,score,key} from '../dist/solver.js';
import {retainSolution,archiveDomain} from '../dist/solution-archive.js';
import {combinationAt,seedPlans} from './area-plans.mjs';
// From repository root: node tools/scan-area-combinations.mjs 60 [recipe-id|all]
//   [state-path] [archive-path] [milliseconds-per-plan] [all|no-tier3]
const seconds=Number(process.argv[2]||60),recipeId=process.argv[3]||'all',statePath=process.argv[4]||'area-search-state.json',archivePath=process.argv[5]||'dist/solution-archive-data.json',perPlan=Number(process.argv[6]||200),noTier3=process.argv[7]==='no-tier3';
if(!(seconds>0&&perPlan>0))throw Error('Positive search budgets required');
const data=JSON.parse(fs.readFileSync('dist/data.json')),archive=JSON.parse(fs.readFileSync(archivePath)),state=fs.existsSync(statePath)?JSON.parse(fs.readFileSync(statePath)):{version:1,domains:{}},recipes=data.recipes.filter(r=>recipeId==='all'||r.id===Number(recipeId));
if(!recipes.length)throw Error('Unknown recipe');
const started=Date.now(),deadline=started+seconds*1000;let attempts=0,changes=0,exact=0,last=started;
const checkpoint=()=>{for(const [path,value]of[[archivePath,archive],[statePath,state]]){fs.writeFileSync(path+'.tmp',JSON.stringify(value));fs.renameSync(path+'.tmp',path);}};
while(Date.now()<deadline){for(const recipe of recipes){if(Date.now()>=deadline)break;const domain=archiveDomain(recipe.id,noTier3),entries=archive.domains[domain]??=[],progress=state.domains[domain]??={areaCount:recipe.areas.length,priority:seedPlans(recipe,entries),priorityCursor:0,cursor:0,attempted:0,exactFound:0};if(progress.areaCount!==recipe.areas.length)throw Error('Recipe areas changed; use a new state file');
 const areas=progress.priorityCursor<progress.priority.length?progress.priority[progress.priorityCursor++]:combinationAt(recipe.areas.length,progress.cursor++),requested=areas.join(','),targets=[...new Set(areas.flatMap(i=>recipe.areas[i].cells.map(key)))];
 const distance=e=>areas.filter(i=>!e.result.score.activeAreas.includes(i)).length+e.result.score.activeAreas.filter(i=>!areas.includes(i)).length;
 const initial=entries.slice().sort((a,b)=>distance(a)-distance(b)||a.result.score.total-b.result.score.total)[0]?.result;
 let bestExact=null;const seen=new Set(),accept=result=>{
  // Store the ACTUALLY achieved area set, even when it differs from the requested
  // set or loses on total stats. The archive itself only compares this recipe.
  const checked={placements:result.placements,score:score(recipe,data.characters[recipe.character].skills,result.placements)},fingerprint=checked.score.activeAreas.join(',')+':'+checked.score.total+':'+checked.placements.length;
  if(seen.has(fingerprint))return;seen.add(fingerprint);
  if(checked.score.activeAreas.join(',')===requested){bestExact=Math.min(bestExact??Infinity,checked.score.total);}
  if(retainSolution(recipe,entries,checked))changes++;
  if(checked.placements.every(p=>p.tier!==3))retainSolution(recipe,archive.domains[archiveDomain(recipe.id,true)]??=[],checked);
 };
 const result=solve({recipe,iotas:data.iotas,skills:data.characters[recipe.character].skills,targets,excludeTier3:noTier3,initialSolution:initial,timeMs:Math.min(perPlan,Math.max(1,deadline-Date.now())),seed:19201+progress.attempted,searchStrategy:'portfolio',onCandidate:accept},m=>{if(m.result)accept(m.result)});
 attempts++;progress.attempted++;if(bestExact!==null){exact++;progress.exactFound++;}progress.last={requested:areas.map(i=>i+1),achieved:result.score.activeAreas.map(i=>i+1),exactPenalty:bestExact,minimumProven:bestExact===0};
 if(Date.now()-last>=10000){checkpoint();console.log(JSON.stringify({attempts,exact,archiveChanges:changes,elapsedMs:Date.now()-started}));last=Date.now();}
}}
checkpoint();console.log(JSON.stringify({attempts,exact,archiveChanges:changes,elapsedMs:Date.now()-started,retained:Object.values(archive.domains).reduce((n,e)=>n+e.length,0),note:'Limited search; nonzero penalties and unvisited combinations are not proven optimal.'}));
