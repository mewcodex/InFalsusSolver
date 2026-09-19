import {conditionPlans,satisfies} from './conditions.js?v=range-20260914-1';
import {theoreticalStats,recipeStats} from './card-stats.js';
import {hasLegalOverlap,MAX_CELL_PARTICLES} from './placement-rules.js';
// Axial hex coordinates. Placement anchors refer to the original serialized origin.
export const key=c=>c[0]+','+c[1];
const dirs=[[1,0],[1,-1],[0,-1],[-1,0],[-1,1],[0,1]];
export function rotate([q,r],n){while(n-->0)[q,r]=[-r,q+r];return [q,r]}
export function score(recipe,skills,placements){
 const safe=new Set(recipe.cells.map(key)),occupied=new Map(),colorCells=new Set();
 let unsafeCount=0;
 placements.forEach((p,i)=>{if(p.cells.some(c=>!safe.has(key(c))))unsafeCount++;for(const c of p.cells){const k=key(c);if(!occupied.has(k))occupied.set(k,[]);occupied.get(k).push(i);colorCells.add(k+','+p.color)}});
 let overlapCount=0;for(const ids of occupied.values())if(ids.length>1)overlapCount++;
 const parent=placements.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));
 for(const [k,ids] of occupied){const c=k.split(',').map(Number),neighbors=[ids,...dirs.map(d=>occupied.get(key([c[0]+d[0],c[1]+d[1]]))||[])];for(const ns of neighbors)for(const j of ns)parent[find(j)]=find(ids[0])}
 const roots=new Set(parent.map((_,i)=>find(i))),anchored=new Set();placements.forEach((p,i)=>{if(p.cells.some(c=>safe.has(key(c))))anchored.add(find(i))});
 const activeAreas=[];let outForgive=skills[3],overlapForgive=skills[4],disconnectForgive=skills[5],limitReduction=0;
 recipe.areas.forEach((a,i)=>{if(a.cells.length&&a.cells.every(c=>colorCells.has(c.join(',')))){activeAreas.push(i);for(const e of a.effects){if(e.type===9)outForgive+=Number(e.params[0]);if(e.type===10)overlapForgive+=Number(e.params[0]);if(e.type===11)disconnectForgive+=Number(e.params[0]);if(e.type===15)limitReduction+=Number(e.params[0])}}});
 const limit=Math.min(recipe.maxIota,skills[2])-limitReduction,complexity=Math.max(0,placements.length-limit),unsafe=Math.max(0,unsafeCount-outForgive),overlap=Math.max(0,overlapCount-overlapForgive),disconnected=Math.max(0,roots.size-1-disconnectForgive),unanchored=roots.size-anchored.size;
 const invalidOverlap=[...occupied.values()].some(ids=>ids.length>MAX_CELL_PARTICLES);
 return {total:invalidOverlap?Infinity:complexity+unsafe+overlap+disconnected+(unanchored?999:0),complexity,unsafe,overlap,disconnected,unanchored,limit,unsafeCount,overlapCount,components:roots.size,activeAreas,...(invalidOverlap?{invalidOverlap:true}:{})};
}
export function candidates(recipe,iotas,targets){
 const targetCells=recipe.cells.filter(c=>targets.has(key(c))),safe=new Set(recipe.cells.map(key)),board=new Set(recipe.board.map(key)),seen=new Set(),out=[],byTarget=targetCells.map(()=>[]);
 // The game copies IotaDetails.Segments directly into the placed piece (_qu -> _SDA).
 // Only translation is supported by this verified placement path.
 for(const p of iotas)for(let rot=0;rot<1;rot++){
  const shape=p.cells.map(c=>rotate(c,rot));
  for(const t of targetCells){if(t[2]!==p.color)continue;for(const anchor of shape){const q=t[0]-anchor[0],r=t[1]-anchor[1],cells=shape.map(c=>[c[0]+q,c[1]+r]);if(cells.some(c=>!board.has(key(c))))continue;
   const signature=p.color+':'+cells.map(key).sort().join(';');if(seen.has(signature))continue;seen.add(signature);
   const positions=new Set(cells.map(key)),cover=[];targetCells.forEach((c,i)=>{if(c[2]===p.color&&positions.has(key(c)))cover.push(i)});
   const candidate={id:p.id,internal:p.internal,color:p.color,tier:p.tier,rotation:rot,q,r,cells,cover,unsafe:cells.some(c=>!safe.has(key(c)))};
   const id=out.length;out.push(candidate);for(const i of cover)byTarget[i].push(id);
  }}
 }
 return {out,byTarget,targetCells};
}
// Compile coordinates once per candidate set; the hot search loop only uses integers.
const geometryCache=new WeakMap();
function compileGeometry(prepared){
 let compiled=geometryCache.get(prepared);if(compiled)return compiled;
 const index=new Map(),coords=[];
 const intern=c=>{const k=key(c);if(!index.has(k)){index.set(k,coords.length);coords.push(c)}return index.get(k)};
 const cells=prepared.out.map(p=>p.cells.map(intern));
 const neighbors=coords.map(c=>dirs.map(d=>index.get(key([c[0]+d[0],c[1]+d[1]]))).filter(i=>i!==undefined));
 compiled={cells,neighbors,size:coords.length,lookup:new Map(prepared.out.map((p,i)=>[p,cells[i]]))};
 geometryCache.set(prepared,compiled);return compiled;
}
export function solve({recipe,iotas,skills,targets,timeMs=5000,seed=1123,excludeTier3=false,initialSolution=null,preparedCandidates=null,onCandidate=null,searchStrategy='legacy',exploreAfterZero=false},report=()=>{}){
 if(excludeTier3)iotas=iotas.filter(p=>p.tier!==3);
 const begin=Date.now(),deadline=begin+Math.max(100,timeMs),targetSet=new Set(targets),prepared=preparedCandidates||candidates(recipe,iotas,targetSet),{out,byTarget,targetCells}=prepared;
 if(!targetCells.length)throw Error('没有有效目标');if(byTarget.some(a=>!a.length))throw Error('某些目标没有合法粒子覆盖');
 let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const safe=new Set(recipe.cells.map(key)),geometry=compileGeometry(prepared);
 const clean=ps=>{let counts=new Int16Array(targetCells.length);ps.forEach(p=>p.cover?.forEach(i=>counts[i]++));for(let j=ps.length-1;j>=0;j--){let p=ps[j];if(p.cover?.length&&p.cover.every(i=>counts[i]>1)){p.cover.forEach(i=>counts[i]--);ps.splice(j,1)}}return ps};
 let initial=targetCells.map((c,i)=>out[byTarget[i].find(j=>out[j].cells.length===1)]);if(initial.some(x=>!x))throw Error('缺少单格粒子');
 // Reuse the previous geometry and repair only uncovered target cells.
 if(initialSolution?.placements?.length){
  const signature=p=>p.color+':'+p.cells.map(key).sort().join(';'),lookup=new Map(out.map(p=>[signature(p),p])),warm=[],seen=new Set(),covered=new Set();
  for(const p of initialSolution.placements){const candidate=lookup.get(signature(p));if(candidate&&!seen.has(candidate)){seen.add(candidate);warm.push(candidate);candidate.cover.forEach(i=>covered.add(i));}}
  let repaired=clean([...warm,...initial.filter((_,i)=>!covered.has(i))]);
  // Old saved layouts may violate the hard three-particle cap. Remove a large
  // conflicting piece, refill only uncovered targets, and retain a legal seed.
  while(!hasLegalOverlap(repaired)){
   const owners=new Map();repaired.forEach((p,i)=>p.cells.forEach(c=>{const k=key(c);owners.set(k,[...(owners.get(k)||[]),i]);}));
   const ids=[...owners.values()].find(a=>a.length>MAX_CELL_PARTICLES),remove=ids.find(i=>repaired[i].cells.length>1)??ids.at(-1);repaired.splice(remove,1);
   const present=new Set(repaired.flatMap(p=>p.cover||[]));repaired=clean([...repaired,...initial.filter((_,i)=>!present.has(i))]);
  }
  const a=score(recipe,skills,initial),b=score(recipe,skills,repaired);if(b.total<a.total||b.total===a.total&&repaired.length<initial.length)initial=repaired;
 }
 let best={placements:initial,score:score(recipe,skills,initial)},iterations=0,last=begin;
 const observed=new Map();
 const emitCandidate=(ps,s)=>{
  if(!onCandidate||s.invalidOverlap)return;const area=s.activeAreas.join(','),prior=observed.get(area);
  if(prior&&(prior.penalty<s.total||prior.penalty===s.total&&prior.count<=ps.length))return;
  observed.set(area,{penalty:s.total,count:ps.length});onCandidate({placements:ps,score:s});
 };
 const elite=[best],identities=new Map(out.map((p,i)=>[p,i]));
 const signature=ps=>ps.map(p=>identities.get(p)??p.cells.map(key).join(';')).sort().join('|');
 const remember=(ps,s)=>{
  if(searchStrategy==='legacy'||s.total>best.score.total+2)return;
  const sig=signature(ps);if(elite.some(x=>x.signature===sig))return;
  elite.push({placements:ps.slice(),score:s,signature:sig});
  elite.sort((a,b)=>a.score.total-b.score.total||a.placements.length-b.placements.length);
  if(elite.length>8)elite.pop();
 };
 const accept=ps=>{const s=score(recipe,skills,ps);remember(ps,s);emitCandidate(ps,s);if(s.total<best.score.total||s.total===best.score.total&&ps.length<best.placements.length){best={placements:ps.slice(),score:s};return true}return false};
 emitCandidate(initial,best.score);
 report({type:'progress',result:best,iterations});
 while(Date.now()<deadline&&(best.score.total>0||exploreAfterZero)){
  let ps=[],covered=new Uint8Array(targetCells.length),occ=new Uint16Array(geometry.size),remaining=targetCells.length,blocked=false;
  if(iterations%3!==0||initialSolution&&iterations===0){const source=searchStrategy==='legacy'||iterations%4===0?best:elite[Math.floor(rand()*elite.length)];
   if(searchStrategy!=='legacy'&&iterations%2===1){
    // Destroy a contiguous patch rather than scattered pieces, then repair its targets.
    const anchor=source.placements[Math.floor(rand()*source.placements.length)].cells[0],radius=1+Math.floor(rand()*3);
    ps=source.placements.filter(p=>p.cover?.length&&!p.cells.some(c=>Math.max(Math.abs(c[0]-anchor[0]),Math.abs(c[1]-anchor[1]),Math.abs(c[0]+c[1]-anchor[0]-anchor[1]))<=radius));
   }else ps=source.placements.filter(p=>p.cover?.length&&rand()>.25-rand()*.1);
   for(const p of ps){for(const i of p.cover)if(!covered[i]){covered[i]=1;remaining--}for(const c of geometry.lookup.get(p))occ[c]++}}
  const overlapWeight=.15+rand()*1.5,unsafeWeight=.15+rand()*2,joinWeight=rand()*.8;
  while(remaining&&Date.now()<deadline){
   let ti=-1,small=Infinity;for(let i=0;i<targetCells.length;i++)if(!covered[i]){const n=byTarget[i].length*(.6+rand());if(n<small){small=n;ti=i}}
   let chosen=null,bestRank=-Infinity;const shortlist=[];
   for(const j of byTarget[ti]){if(geometry.cells[j].some(c=>occ[c]>=MAX_CELL_PARTICLES))continue;const p=out[j];let gain=0,over=0,adj=0;for(const i of p.cover)gain+=!covered[i];for(const c of geometry.cells[j]){if(occ[c])over++;else{for(const n of geometry.neighbors[c])if(occ[n]){adj++;break}}}
    const rank=gain/(1+over*overlapWeight+(p.unsafe?unsafeWeight:0))+.08*adj*joinWeight+rand()*(iterations===0?.001:.4);if(rank>bestRank){bestRank=rank;chosen=p}if(searchStrategy==='grasp')shortlist.push({p,rank});}
   if(searchStrategy==='grasp'&&shortlist.length){shortlist.sort((a,b)=>b.rank-a.rank);const cutoff=bestRank-Math.abs(bestRank)*(.05+rand()*.2),pool=shortlist.slice(0,4).filter(x=>x.rank>=cutoff);chosen=pool[Math.floor(rand()*pool.length)].p;}
   if(!chosen){blocked=true;break;}
   ps.push(chosen);for(const i of chosen.cover)if(!covered[i]){covered[i]=1;remaining--}for(const c of geometry.lookup.get(chosen))occ[c]++;
  }
  if(blocked){iterations++;continue;}if(remaining)break;
  // Removing a piece redundant for the selected targets may deactivate another
  // reward area. Archive the pre-cleanup area set too, even when it loses the
  // current objective; compare its own minimum penalty separately.
  const beforeCleanup=onCandidate?ps.slice():null;clean(ps);
  if(beforeCleanup&&beforeCleanup.length!==ps.length)emitCandidate(beforeCleanup,score(recipe,skills,beforeCleanup));
  accept(ps);
  // Add connecting single cells along shortest safe paths, then keep only improvements.
  if(best.score.disconnected>0&&iterations%4===0){let trial=ps.slice();for(let attempt=0;attempt<6;attempt++){
   const prior=score(recipe,skills,trial);if(prior.disconnected===0)break;
   const owners=new Map();trial.forEach((p,i)=>p.cells.forEach(c=>owners.set(key(c),i)));const par=trial.map((_,i)=>i),root=i=>par[i]===i?i:par[i]=root(par[i]);for(const [k,i] of owners){const c=k.split(',').map(Number);for(const d of dirs){const j=owners.get(key([c[0]+d[0],c[1]+d[1]]));if(j!==undefined)par[root(i)]=root(j)}}
   let queue=[],prev=new Map(),from=new Map(),meeting=null;for(const [k,i] of owners){queue.push(k);from.set(k,root(i));prev.set(k,null)}
   for(let qi=0;qi<queue.length&&!meeting;qi++){const k=queue[qi],c=k.split(',').map(Number);for(const d of dirs){const nk=key([c[0]+d[0],c[1]+d[1]]);if(!safe.has(nk))continue;if(from.has(nk)){if(from.get(nk)!==from.get(k)){meeting=[k,nk];break}}else{from.set(nk,from.get(k));prev.set(nk,k);queue.push(nk)}}}
   if(!meeting)break;let path=[];for(let k of meeting)while(k!==null){if(!owners.has(k))path.push(k);k=prev.get(k)}
   for(const k of new Set(path)){const c=k.split(',').map(Number),color=recipe.cells.find(x=>key(x)===k)?.[2],p=iotas.find(x=>x.size===1&&x.color===(color>0&&color<6?color:recipe.color));trial.push({id:p.id,internal:p.internal,color:p.color,tier:p.tier,rotation:0,q:c[0],r:c[1],cells:[c],cover:[]})}
   if(!path.length)break;accept(trial);
  }}
  iterations++;if(Date.now()-last>500){report({type:'progress',result:best,iterations});last=Date.now()}
 }
 best={...best,provenOptimal:best.score.total===0,iterations,elapsedMs:Date.now()-begin};report({type:'done',result:best,iterations});return best;
}

// Search reward-area combinations, evaluating the actual completed placements,
// including accidentally activated areas and every curse penalty.
export function maximizeStats({recipe,iotas,skills,targets=[],initialSolution=null,timeMs=5000,seed=1123,excludeTier3=false,searchStrategy='portfolio',onCandidate=null},report=()=>{}){
 if(excludeTier3)iotas=iotas.filter(p=>p.tier!==3);
 const begin=Date.now(),deadline=begin+Math.max(100,timeMs),full=recipe.areas.map((_,i)=>i);
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
 const distinct=new Set(),plans=[...neighborhood,...seeds].filter(a=>{const k=a.slice().sort((a,b)=>a-b).join(',');if(!a.length||distinct.has(k))return false;distinct.add(k);return true});
 const required=new Set(targets),requiredCells=recipe.cells.filter(c=>required.has(key(c)));
 let state=seed>>>0,iterations=0,last=begin;
 const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const areaElite=[];
 let best=null;
 const consider=result=>{if(!hasLegalOverlap(result.placements))return;onCandidate?.(result);const covered=new Set(result.placements.flatMap(p=>p.cells.map(c=>key(c)+','+p.color)));if(requiredCells.some(c=>!covered.has(c.join(','))))return;const stats=theoreticalStats(recipe,result),value=stats.power+stats.fortitude;
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
 const accept=result=>{if(!hasLegalOverlap(result.placements))return;const covered=new Set(result.placements.flatMap(p=>p.cells.map(c=>key(c)+','+p.color)));if(recipe.cells.some(c=>(args.targets||[]).includes(key(c))&&!covered.has(c.join(','))))return;if(!satisfies(recipe,result,minSlots,cardColor,minRange))return;const stats=theoreticalStats(recipe,result),value=stats.power+stats.fortitude;if(!best||value>best.value||value===best.value&&result.score.total<best.score.total){best={...result,stats,value,minSlots,cardColor,minRange};report({type:'progress',result:best,iterations})}};
 if(args.initialSolution&&args.initialSolution.placements.every(p=>args.iotas.some(i=>i.id===p.id&&(!args.excludeTier3||i.tier!==3))))accept({...args.initialSolution,score:score(recipe,args.skills,args.initialSolution.placements)});
 for(let n=0;Date.now()<deadline;n++){
  const plan=plans[n%plans.length],targets=[...new Set([...(args.targets||[]),...plan.flatMap(i=>recipe.areas[i].cells.map(key))])];
  maximizeStats({...args,targets,initialSolution:best||args.initialSolution,timeMs:Math.max(100,Math.min(deadline-Date.now(),Math.max(250,(args.timeMs||5000)/plans.length))),seed:(args.seed||1123)+n*937},m=>{if(m.result)accept(m.result)});iterations++;if(best?.provenOptimal)break;
 }
 if(!best)throw Error('本次搜索未找到满足槽位、颜色和范围要求的方案');best={...best,iterations,elapsedMs:Date.now()-start};report({type:'done',result:best,iterations});return best;
}
