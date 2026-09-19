import {conditionPlans,satisfies} from '../dist/conditions.js';
import {theoreticalStats,recipeStats} from '../dist/card-stats.js';
import {score,solve,key,candidates} from '../dist/solver.js';
function maximizeStatsBeam({recipe,iotas,skills,targets=[],initialSolution=null,timeMs=5000,seed=1123,excludeTier3=false,searchStrategy='portfolio',onCandidate=null},report=()=>{}){
 if(excludeTier3)iotas=iotas.filter(p=>p.tier!==3);
 const begin=Date.now(),deadline=begin+Math.max(1,timeMs),full=recipe.areas.map((_,i)=>i);
 const ceiling=recipeStats(recipe),nonnegative=recipe.areas.every(a=>a.effects.every(e=>![3,4,5,6].includes(e.type)||Number(e.params[0])>=0));

 // Start with high-value, low-cost combinations before random mutations.
 // A tiny +1 reward can also remove most of the particle budget.
 const ranked=full.map(i=>{const a=recipe.areas[i],cost=a.effects.filter(e=>e.type===15).reduce((n,e)=>n+Number(e.params[0]),0);
 const value=a.effects.reduce((n,e)=>n+([3,4].includes(e.type)?Number(e.params[0]):e.type===5?ceiling.basePower*Number(e.params[0])/100:e.type===6?ceiling.baseFortitude*Number(e.params[0])/100:0),0);
 return {i,cost,value,priority:value/Math.max(1,a.cells.length)/(1+cost*2)};}).filter(a=>a.value>0).sort((a,b)=>b.priority-a.priority);
 // Explore additions and one-for-one swaps around a known high-value solution.
 const neighborhood=[];
 if(initialSolution?.score?.activeAreas){const active=initialSolution.score.activeAreas,missing=ranked.map(a=>a.i).filter(i=>!active.includes(i));
  for(const add of missing)neighborhood.push([...active,add]);
  for(const add of missing)for(const remove of active)neighborhood.push([...active.filter(i=>i!==remove),add]);
 }
 const free=ranked.filter(a=>a.cost<=0).map(a=>a.i),valuable=ranked.map(a=>a.i),seeds=[];
 for(let n=1;n<=free.length;n++)seeds.push(free.slice(0,n));
 seeds.push(valuable,full);for(let n=1;n<=valuable.length;n++)seeds.push(valuable.slice(0,n));
 const distinct=new Set();let plans=[...neighborhood,...seeds].filter(a=>{const k=a.slice().sort((a,b)=>a-b).join(',');if(!a.length||distinct.has(k))return false;distinct.add(k);return true});

 // Bounded best-first search over reward sets. The estimate orders trials only:
 // incidental rewards and geometric penalties mean it is not a pruning proof.
 if(searchStrategy==='rewardBeam'){
  const planningDeadline=Math.min(deadline,Date.now()+Math.min(120,timeMs*.12));
  const requiredKeys=new Set(targets),seenPlans=new Map();
  const maxSize=Array.from({length:6},(_,color)=>Math.max(1,...iotas.filter(p=>p.color===color).map(p=>p.cells.length)));
  const evaluatePlan=areas=>{
   const sig=areas.slice().sort((a,b)=>a-b).join(',');if(seenPlans.has(sig))return seenPlans.get(sig);
   const covered=new Set(requiredKeys);for(const i of areas)for(const c of recipe.areas[i].cells)covered.add(key(c));
   const active=full.filter(i=>recipe.areas[i].cells.length&&recipe.areas[i].cells.every(c=>covered.has(key(c))));
   const counts=Array(6).fill(0);for(const c of recipe.cells)if(covered.has(key(c))&&c[2]>0&&c[2]<6)counts[c[2]]++;
   let reduction=0;for(const i of active)for(const e of recipe.areas[i].effects)if(e.type===15)reduction+=Number(e.params[0]);
   const lowerPieces=counts.reduce((n,c,i)=>n+Math.ceil(c/maxSize[i]),0),strikes=Math.max(0,lowerPieces-Math.min(recipe.maxIota,skills[2])+reduction);
   const stat=theoreticalStats(recipe,{placements:[{}],score:{activeAreas:active,total:strikes}});
   const estimate=(stat.power+stat.fortitude)/(1+.002*covered.size+.01*lowerPieces);
   const p={areas,estimate};seenPlans.set(sig,p);return p;
  };
  let beam=[full,valuable,initialSolution?.score?.activeAreas||[],...seeds].map(evaluatePlan);
  for(let depth=0;depth<3&&Date.now()<planningDeadline;depth++){
   const next=[];for(const p of beam){for(const i of full){if(Date.now()>=planningDeadline)break;const set=new Set(p.areas);set.has(i)?set.delete(i):set.add(i);next.push(evaluatePlan([...set]));}if(Date.now()>=planningDeadline)break;}
   beam=[...new Set(next)].sort((a,b)=>b.estimate-a.estimate).slice(0,48);
  }
  const prioritized=[...seenPlans.values()].filter(p=>p.areas.length).sort((a,b)=>b.estimate-a.estimate).map(p=>p.areas);
  // Reserve regular exploration to avoid trusting the optimistic estimate alone.
  const mixed=[];for(let i=0;i<Math.max(prioritized.length,plans.length);i++){if(prioritized[i])mixed.push(prioritized[i]);if(i%3===0&&plans[i/3])mixed.push(plans[i/3]);}
  const keys=new Set();plans=mixed.filter(a=>{const k=a.slice().sort((a,b)=>a-b).join(',');if(keys.has(k))return false;keys.add(k);return true;});
 }
 const required=new Set(targets),requiredCells=recipe.cells.filter(c=>required.has(key(c)));
 let state=seed>>>0,iterations=0,last=begin;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const areaElite=[];
 let best=null;
 const consider=result=>{onCandidate?.(result);const covered=new Set(result.placements.flatMap(p=>p.cells.map(c=>key(c)+','+p.color)));if(requiredCells.some(c=>!covered.has(c.join(','))))return;const stats=theoreticalStats(recipe,result),value=stats.power+stats.fortitude;
  if(searchStrategy!=='legacy'){
   const signature=result.score.activeAreas.join(','),previous=areaElite.find(x=>x.signature===signature);
   if(previous){if(value>previous.value){previous.value=value;previous.areas=result.score.activeAreas.slice();}}
   else if(areaElite.length<12||value>areaElite.at(-1).value)areaElite.push({signature,value,areas:result.score.activeAreas.slice()});
   areaElite.sort((a,b)=>b.value-a.value);if(areaElite.length>12)areaElite.pop();
  }
  if(!best||value>best.value||value===best.value&&(result.score.total<best.score.total||result.score.total===best.score.total&&result.placements.length<best.placements.length)){
   best={...result,placements:result.placements.slice(),objective:'stats',value,stats,provenOptimal:nonnegative&&value===ceiling.power+ceiling.fortitude};
   report({type:'progress',result:best,iterations});
  }
 };
 if(initialSolution?.placements&&initialSolution.placements.every(p=>iotas.some(i=>i.id===p.id)))consider({...initialSolution,score:score(recipe,skills,initialSolution.placements)});
 const candidateCache=new Map(),planBest=new Map();
 if(required.size){solve({recipe,iotas,skills,targets:[...required],seed,searchStrategy,timeMs:Math.min(180,timeMs)},m=>{if(m.result)consider(m.result)});}else consider({placements:[],score:score(recipe,skills,[])});
 while(Date.now()<deadline&&!best?.provenOptimal){
  let areas;
  if(iterations<plans.length)areas=plans[iterations];
  else if(iterations<plans.length+full.length)areas=[iterations-plans.length];
  else if(iterations%4===0)areas=full.filter(()=>rand()<.25+rand()*.65);
  else{const source=searchStrategy==='legacy'||!areaElite.length?best.score.activeAreas:areaElite[Math.floor(rand()*rand()*areaElite.length)].areas;const active=new Set(source);for(let j=0;j<1+Math.floor(rand()*3);j++){const i=Math.floor(rand()*full.length);active.has(i)?active.delete(i):active.add(i)}areas=[...active]}
  const targets=[...new Set([...required,...areas.flatMap(i=>recipe.areas[i].cells).filter(c=>c[2]>0&&c[2]<6).map(key)])];
  if(targets.length){
   const planKey=targets.slice().sort().join(';');let prepared=candidateCache.get(planKey);
   if(!prepared){prepared=candidates(recipe,iotas,new Set(targets));if(candidateCache.size>=32)candidateCache.delete(candidateCache.keys().next().value);candidateCache.set(planKey,prepared);}
   if(Date.now()>=deadline)break;
   const previous=planBest.get(planKey),warm=previous||best;
   const result=solve({recipe,iotas,skills,targets,initialSolution:warm,preparedCandidates:prepared,onCandidate:consider,searchStrategy,seed:Math.floor(rand()*4294967296),timeMs:Math.min(250,Math.max(1,deadline-Date.now()))},m=>{if(m.result)consider(m.result)});
   if(!previous||result.score.total<previous.score.total||result.score.total===previous.score.total&&result.placements.length<previous.placements.length)planBest.set(planKey,result);
  }
  iterations++;
  if(Date.now()-last>500){report({type:'progress',result:best,iterations});last=Date.now()}
 }
 best={...best,iterations,elapsedMs:Date.now()-begin};report({type:'done',result:best,iterations});return best;
}

export function solveConstrained(args,report=()=>{}){
 const {recipe,minSlots=0,cardColor=0,minRange=1}=args,plans=conditionPlans(recipe,minSlots,cardColor,minRange),start=Date.now(),deadline=start+(args.timeMs||5000);let best=null,iterations=0;
 if(!plans.length)throw Error('此配方无法满足所选特质槽、颜色或范围要求');
 const accept=result=>{const covered=new Set(result.placements.flatMap(p=>p.cells.map(c=>key(c)+','+p.color)));if(recipe.cells.some(c=>(args.targets||[]).includes(key(c))&&!covered.has(c.join(','))))return;if(!satisfies(recipe,result,minSlots,cardColor,minRange))return;const stats=theoreticalStats(recipe,result),value=stats.power+stats.fortitude;if(!best||value>best.value||value===best.value&&result.score.total<best.score.total){best={...result,stats,value,minSlots,cardColor,minRange};report({type:'progress',result:best,iterations})}};
 if(args.initialSolution&&args.initialSolution.placements.every(p=>args.iotas.some(i=>i.id===p.id&&(!args.excludeTier3||i.tier!==3))))accept({...args.initialSolution,score:score(recipe,args.skills,args.initialSolution.placements)});
 for(let n=0;Date.now()<deadline;n++){
  const plan=plans[n%plans.length],targets=[...new Set([...(args.targets||[]),...plan.flatMap(i=>recipe.areas[i].cells.map(key))])];
  maximizeStats({...args,targets,initialSolution:best||args.initialSolution,timeMs:Math.max(100,Math.min(deadline-Date.now(),Math.max(250,(args.timeMs||5000)/plans.length))),seed:(args.seed||1123)+n*937},m=>{if(m.result)accept(m.result)});iterations++;if(best?.provenOptimal)break;
 }
 if(!best)throw Error('本次搜索未找到满足槽位、颜色和范围要求的方案');best={...best,iterations,elapsedMs:Date.now()-start};report({type:'done',result:best,iterations});return best;
}

export function maximizeStats(args,report=()=>{}){
 const start=Date.now(),budget=Math.max(100,args.timeMs??5000);
 const warm=maximizeStatsBeam({...args,searchStrategy:'portfolio',timeMs:Math.max(100,budget*.35)},report);
 if(warm.provenOptimal||Date.now()-start>=budget)return warm;
 const result=maximizeStatsBeam({...args,initialSolution:warm,searchStrategy:'rewardBeam',timeMs:Math.max(1,budget-(Date.now()-start))},report);
 return {...result,elapsedMs:Date.now()-start};
}

