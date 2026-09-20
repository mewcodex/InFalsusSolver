import {solve,maximizeStats,solveConstrained} from './solver.js?v=snapshot-30548';
import {retainSolution,archiveDomain} from './solution-archive.js?v=exact-range-22894';
import {readArchive} from './archive-storage.js';
self.onmessage=async({data})=>{try{
 const entries=[];let dirty=false,last=0;
 const remember=result=>{if(retainSolution(data.recipe,entries,result)){dirty=true;if(Date.now()-last>1000){last=Date.now();self.postMessage({type:'archive',entries});dirty=false;}}};
 const local=await readArchive(data.recipe.id,!!data.excludeTier3).catch(()=>[]);
 const published=await fetch('solution-archive-data.json?v=snapshot-30548').then(r=>r.ok?r.json():{}).catch(()=>({}));
 for(const e of [...(published.domains?.[archiveDomain(data.recipe.id,!!data.excludeTier3)]||[]),...local])retainSolution(data.recipe,entries,e.result);
 const targets=new Set(data.targets||[]),eligible=entries.filter(e=>{const covered=new Set(e.result.placements.flatMap(p=>p.cells.map(c=>c[0]+','+c[1]+','+p.color)));return data.recipe.cells.filter(c=>targets.has(c[0]+','+c[1])).every(c=>covered.has(c.join(',')))&&(!data.excludeTier3||e.result.placements.every(p=>p.tier!==3));});
 if(!data.initialSolution&&eligible.length)data.initialSolution=eligible.sort((a,b)=>data.objective==='stats'?b.result.value-a.result.value:a.result.score.total-b.result.score.total)[0].result;
 const report=m=>{if(m.result)remember(m.result);if(m.type==='done'&&dirty){self.postMessage({type:'archive',entries});dirty=false;}self.postMessage(m)};
 (data.objective==='stats'?(data.minSlots||data.cardColor||data.minRange>1?solveConstrained:maximizeStats):solve)({...data,onCandidate:remember},report);
 }catch(e){self.postMessage({type:'error',message:e.message})}};
