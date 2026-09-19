// A bijection on nonempty area masks: unlike scanning numeric masks, the early
// plans are spread across high and low area indices. Each complete cycle visits
// all 2^n-1 combinations exactly once, without building an exponential array.
export function combinationAt(n,cursor){
 if(!Number.isInteger(n)||n<1||n>30||!Number.isSafeInteger(cursor)||cursor<0)throw Error('Invalid area-plan cursor');
 const count=2**n-1,step=BigInt(cursor%count+1),mask=Number(step*104729n%BigInt(count+1));
 return Array.from({length:n},(_,i)=>i).filter(i=>Math.floor(mask/2**i)%2===1);
}
export function seedPlans(recipe,entries){
 const plans=[],seen=new Set(),add=areas=>{const sorted=[...new Set(areas)].sort((a,b)=>a-b),key=sorted.join(',');if(sorted.length&&!seen.has(key)){seen.add(key);plans.push(sorted);}};
 // First retry known nonzero penalties; then search one-area changes to every
 // retained tradeoff, not merely the highest-total-stat incumbent.
 for(const e of entries.slice().sort((a,b)=>b.result.score.total-a.result.score.total))if(e.result.score.total>0)add(e.result.score.activeAreas);
 for(const e of entries)for(let i=0;i<recipe.areas.length;i++){const areas=e.result.score.activeAreas;add(areas.includes(i)?areas.filter(j=>j!==i):[...areas,i]);}
 return plans;
}
