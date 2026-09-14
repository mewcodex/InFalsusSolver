export function features(recipe,result){let slots=0,left=0,right=0;const colors=new Set([recipe.color]);for(const i of result.score.activeAreas)for(const e of recipe.areas[i].effects){if(e.type===7)slots+=Number(e.params[0]);if(e.type===8){left+=Number(e.params[0]||0);right+=Number(e.params[1]||0);}if(e.type===1)e.params.forEach(c=>colors.add(Number(c)))}return {range:1+left+right,left,right,slots:Math.min(3,slots),colors:[...colors].sort()}}
export function satisfies(recipe,result,minSlots=0,cardColor=0,minRange=1){const f=features(recipe,result);return f.range>=minRange&&f.slots>=minSlots&&(!cardColor||f.colors.includes(cardColor))}
export function conditionPlans(recipe,minSlots=0,cardColor=0,minRange=1){
 const relevant=recipe.areas.map((a,i)=>({i,range:a.effects.filter(e=>e.type===8).reduce((s,e)=>s+Number(e.params[0]||0)+Number(e.params[1]||0),0),slots:a.effects.filter(e=>e.type===7).reduce((s,e)=>s+Number(e.params[0]),0),color:a.effects.some(e=>e.type===1&&e.params.map(Number).includes(cardColor))})).filter(a=>minRange>1&&a.range>0||minSlots>0&&a.slots>0||cardColor&&cardColor!==recipe.color&&a.color);
 const plans=[];function visit(n,chosen,slots,color,range){if(slots>=minSlots&&color&&range>=minRange){if(!plans.some(p=>p.every(i=>chosen.includes(i))))plans.push(chosen);return}if(n===relevant.length)return;visit(n+1,chosen,slots,color,range);const a=relevant[n];visit(n+1,[...chosen,a.i],slots+a.slots,color||a.color,range+a.range)}visit(0,[],0,!cardColor||cardColor===recipe.color,1);
 return plans.filter(p=>!plans.some(q=>q.length<p.length&&q.every(i=>p.includes(i)))).sort((a,b)=>a.reduce((n,i)=>n+recipe.areas[i].cells.length,0)-b.reduce((n,i)=>n+recipe.areas[i].cells.length,0));
}

export function retainConditionSolution(recipe,row,result){
 if(!row.conditions)return;
 const index=row.variants.length;let used=false;
 for(let slots=0,left=0,right=0;slots<=3;slots++)for(let color=0;color<=5;color++)for(let range=1;range<=5;range++){if(!satisfies(recipe,result,slots,color,range))continue;const key=slots+':'+color+':'+range,old=row.conditions[key];if(old===undefined||old<0||result.value>row.variants[old].value){row.conditions[key]=index;used=true;}}
 if(used)row.variants.push(result);
 row.result=row.variants[row.conditions['0:0:1']];
}
