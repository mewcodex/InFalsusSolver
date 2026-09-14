import {theoreticalStats,recipeStats} from './card-stats.js';
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
 return {total:complexity+unsafe+overlap+disconnected+(unanchored?999:0),complexity,unsafe,overlap,disconnected,unanchored,limit,unsafeCount,overlapCount,components:roots.size,activeAreas};
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
export function solve({recipe,iotas,skills,targets,timeMs=5000,seed=1123,excludeTier3=false,initialSolution=null,preparedCandidates=null,onCandidate=null},report=()=>{}){
 if(excludeTier3)iotas=iotas.filter(p=>p.tier!==3);
 const begin=Date.now(),deadline=begin+Math.max(100,timeMs),targetSet=new Set(targets),{out,byTarget,targetCells}=preparedCandidates||candidates(recipe,iotas,targetSet);
 if(!targetCells.length)throw Error('没有有效目标');if(byTarget.some(a=>!a.length))throw Error('某些目标没有合法粒子覆盖');
 let state=seed>>>0;const rand=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296};
 const safe=new Set(recipe.cells.map(key));
 const clean=ps=>{let counts=new Int16Array(targetCells.length);ps.forEach(p=>p.cover?.forEach(i=>counts[i]++));for(let j=ps.length-1;j>=0;j--){let p=ps[j];if(p.cover?.length&&p.cover.every(i=>counts[i]>1)){p.cover.forEach(i=>counts[i]--);ps.splice(j,1)}}return ps};
 let initial=targetCells.map((c,i)=>out[byTarget[i].find(j=>out[j].cells.length===1)]);if(initial.some(x=>!x))throw Error('缺少单格粒子');
 // Reuse the previous geometry and repair only uncovered target cells.
 if(initialSolution?.placements?.length){
  const signature=p=>p.color+':'+p.cells.map(key).sort().join(';'),lookup=new Map(out.map(p=>[signature(p),p])),warm=[],seen=new Set(),covered=new Set();
  for(const p of initialSolution.placements){const candidate=lookup.get(signature(p));if(candidate&&!seen.has(candidate)){seen.add(candidate);warm.push(candidate);candidate.cover.forEach(i=>covered.add(i));}}
  const repaired=clean([...warm,...initial.filter((_,i)=>!covered.has(i))]);
  const a=score(recipe,skills,initial),b=score(recipe,skills,repaired);if(b.total<a.total||b.total===a.total&&repaired.length<initial.length)initial=repaired;
 }
 let best={placements:initial,score:score(recipe,skills,initial)},iterations=0,last=begin;
 const accept=ps=>{const s=score(recipe,skills,ps);onCandidate?.({placements:ps,score:s});if(s.total<best.score.total||s.total===best.score.total&&ps.length<best.placements.length){best={placements:ps.slice(),score:s};return true}return false};
 report({type:'progress',result:best,iterations});
 while(Date.now()<deadline&&best.score.total>0){
  let ps=[],covered=new Uint8Array(targetCells.length),occ=new Map(),remaining=targetCells.length;
  if(iterations%3!==0||initialSolution&&iterations===0){ps=best.placements.filter(p=>p.cover?.length&&rand()>.25-rand()*.1);for(const p of ps){for(const i of p.cover)if(!covered[i]){covered[i]=1;remaining--}for(const c of p.cells)occ.set(key(c),(occ.get(key(c))||0)+1)}}
  const overlapWeight=.15+rand()*1.5,unsafeWeight=.15+rand()*2,joinWeight=rand()*.8;
  while(remaining&&Date.now()<deadline){
   let ti=-1,small=Infinity;for(let i=0;i<targetCells.length;i++)if(!covered[i]){const n=byTarget[i].length*(.6+rand());if(n<small){small=n;ti=i}}
   let chosen=null,bestRank=-Infinity;
   for(const j of byTarget[ti]){const p=out[j];let gain=0,over=0,adj=0;for(const i of p.cover)gain+=!covered[i];for(const c of p.cells){if(occ.has(key(c)))over++;else if(dirs.some(d=>occ.has(key([c[0]+d[0],c[1]+d[1]]))))adj++}
    const rank=gain/(1+over*overlapWeight+(p.unsafe?unsafeWeight:0))+.08*adj*joinWeight+rand()*(iterations===0?.001:.4);if(rank>bestRank){bestRank=rank;chosen=p}}
   ps.push(chosen);for(const i of chosen.cover)if(!covered[i]){covered[i]=1;remaining--}for(const c of chosen.cells)occ.set(key(c),(occ.get(key(c))||0)+1);
  }
  if(remaining)break;clean(ps);accept(ps);
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
export function maximizeStats({recipe,iotas,skills,targets=[],initialSolution=null,timeMs=5000,seed=1123,excludeTier3=false},report=()=>{}){
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
 let best=null;
 const consider=result=>{const covered=new Set(result.placements.flatMap(p=>p.cells.map(c=>key(c)+','+p.color)));if(requiredCells.some(c=>!covered.has(c.join(','))))return;const stats=theoreticalStats(recipe,result),value=stats.power+stats.fortitude;
  if(!best||value>best.value||value===best.value&&(result.score.total<best.score.total||result.score.total===best.score.total&&result.placements.length<best.placements.length)){
   best={...result,placements:result.placements.slice(),objective:'stats',value,stats,provenOptimal:nonnegative&&value===ceiling.power+ceiling.fortitude};
   report({type:'progress',result:best,iterations});
  }
 };
 if(initialSolution?.placements&&initialSolution.placements.every(p=>iotas.some(i=>i.id===p.id)))consider({...initialSolution,score:score(recipe,skills,initialSolution.placements)});
 const candidateCache=new Map(),planBest=new Map();
 if(required.size){solve({recipe,iotas,skills,targets:[...required],seed,timeMs:Math.min(180,timeMs)},m=>{if(m.result)consider(m.result)});}else consider({placements:[],score:score(recipe,skills,[])});
 while(Date.now()<deadline&&!best?.provenOptimal){
  let areas;
  if(iterations<plans.length)areas=plans[iterations];
  else if(iterations<plans.length+full.length)areas=[iterations-plans.length];
  else if(iterations%4===0)areas=full.filter(()=>rand()<.25+rand()*.65);
  else{const active=new Set(best.score.activeAreas);for(let j=0;j<1+Math.floor(rand()*3);j++){const i=Math.floor(rand()*full.length);active.has(i)?active.delete(i):active.add(i)}areas=[...active]}
  const targets=[...new Set([...required,...areas.flatMap(i=>recipe.areas[i].cells).filter(c=>c[2]>0&&c[2]<6).map(key)])];
  if(targets.length){
   const planKey=targets.slice().sort().join(';');let prepared=candidateCache.get(planKey);
   if(!prepared){prepared=candidates(recipe,iotas,new Set(targets));if(candidateCache.size>=32)candidateCache.delete(candidateCache.keys().next().value);candidateCache.set(planKey,prepared);}
   if(Date.now()>=deadline)break;
   const previous=planBest.get(planKey),warm=previous||best;
   const result=solve({recipe,iotas,skills,targets,initialSolution:warm,preparedCandidates:prepared,onCandidate:consider,seed:Math.floor(rand()*4294967296),timeMs:Math.min(250,Math.max(1,deadline-Date.now()))},m=>{if(m.result)consider(m.result)});
   if(!previous||result.score.total<previous.score.total||result.score.total===previous.score.total&&result.placements.length<previous.placements.length)planBest.set(planKey,result);
  }
  iterations++;
  if(Date.now()-last>500){report({type:'progress',result:best,iterations});last=Date.now()}
 }
 best={...best,iterations,elapsedMs:Date.now()-begin};report({type:'done',result:best,iterations});return best;
}
