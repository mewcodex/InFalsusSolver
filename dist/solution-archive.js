import {features} from './conditions.js';
import {theoreticalStats} from './card-stats.js';
export const areaKey=result=>[...new Set(result.score.activeAreas)].sort((a,b)=>a-b).join(',');
export function dominates(a,b){
 const fields=['power','fortitude','left','right','slots'];
 return fields.every(k=>a[k]>=b[k])&&b.colors.every(c=>a.colors.includes(c))&&(fields.some(k=>a[k]>b[k])||a.colors.some(c=>!b.colors.includes(c)));
}
export function makeRecord(recipe,result){const stats=theoreticalStats(recipe,result),f=features(recipe,result);return {areas:areaKey(result),power:stats.power,fortitude:stats.fortitude,...f,result:{placements:result.placements,score:result.score,stats,value:stats.power+stats.fortitude}};}
// Keep different area sets when their capabilities are equal. Only strict Pareto dominance removes them.
export function retainSolution(recipe,entries,result){
 const next=makeRecord(recipe,result),index=entries.findIndex(e=>e.areas===next.areas);
 if(index>=0){const old=entries[index];if(old.result.score.total<result.score.total||old.result.score.total===result.score.total&&old.result.placements.length<=result.placements.length)return false;}
 if(entries.some((e,i)=>i!==index&&dominates(e,next)))return false;
 if(index>=0)entries.splice(index,1);
 for(let i=entries.length-1;i>=0;i--)if(dominates(next,entries[i]))entries.splice(i,1);
 entries.push(structuredClone(next));return true;
}
export function archiveDomain(recipeId,excludeTier3=false){return recipeId+':'+(excludeTier3?'no-tier3':'all');}
