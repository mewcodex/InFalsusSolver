import fs from 'node:fs';import assert from 'node:assert/strict';import {solveConstrained,score} from './dist/solver.js';import {conditionPlans,satisfies,features} from './dist/conditions.js';import {theoreticalStats} from './dist/card-stats.js';
const data=JSON.parse(fs.readFileSync('dist/data.json')),ranking=JSON.parse(fs.readFileSync('dist/ranking-data.json'));let done=0,impossible=0;
for(const row of ranking.rows){const recipe=data.recipes.find(r=>r.id===row.id);row.variants=row.variants||[row.result];const historical=row.variants.slice();row.conditions={};
 const offer=x=>{const s=score(recipe,data.characters[recipe.character].skills,x.placements);assert.deepEqual(s,x.score);const stats=theoreticalStats(recipe,x);x={...x,stats,value:stats.power+stats.fortitude};const idx=row.variants.length;let used=false;
 for(let slots=0;slots<=3;slots++)for(let color=0;color<=5;color++)for(let range=1;range<=5;range++){const k=slots+':'+color+':'+range;if(!satisfies(recipe,x,slots,color,range))continue;const previous=row.conditions[k];if(previous===undefined||previous<0||x.value>row.variants[previous].value||x.value===row.variants[previous].value&&x.score.total<row.variants[previous].score.total){row.conditions[k]=idx;used=true;}}
 if(used)row.variants.push(x);
 };historical.forEach(offer);
 for(let slots=3;slots>=0;slots--)for(let color=0;color<=5;color++)for(let range=1;range<=5;range++){
 const k=slots+':'+color+':'+range;if(!conditionPlans(recipe,slots,color,range).length){row.conditions[k]=-1;impossible++;continue;}
 const i=row.conditions[k],previous=i>=0?row.variants[i]:null;
 if(previous)continue;
 try{solveConstrained({recipe,iotas:data.iotas,skills:data.characters[recipe.character].skills,minSlots:slots,cardColor:color,minRange:range,initialSolution:previous,seed:47119,timeMs:350},m=>{if(m.result)offer(m.result)})}catch(e){if(row.conditions[k]===undefined)row.conditions[k]=-2;}
 }
 for(const [k,i] of Object.entries(row.conditions))if(i>=0){const [s,c,range]=k.split(':').map(Number);assert.ok(satisfies(recipe,row.variants[i],s,c,range));}
 const used=[...new Set(Object.values(row.conditions).filter(i=>i>=0))],remap=new Map(used.map((old,i)=>[old,i]));row.variants=used.map(i=>row.variants[i]);for(const k in row.conditions)if(row.conditions[k]>=0)row.conditions[k]=remap.get(row.conditions[k]);row.result=row.variants[row.conditions['0:0:1']];done++;console.log(JSON.stringify({done,id:row.id,solutions:Object.values(row.conditions).filter(i=>i>=0).length,variants:row.variants.length}));

}
ranking.rows.sort((a,b)=>b.result.value-a.result.value);fs.writeFileSync('dist/ranking-data.json',JSON.stringify(ranking));console.log('DONE '+JSON.stringify({recipes:done,conditions:done*120,impossible}));
