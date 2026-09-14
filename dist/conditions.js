export function features(recipe,result){let slots=0;const colors=new Set([recipe.color]);for(const i of result.score.activeAreas)for(const e of recipe.areas[i].effects){if(e.type===7)slots+=Number(e.params[0]);if(e.type===1)e.params.forEach(c=>colors.add(Number(c)))}return {slots:Math.min(3,slots),colors:[...colors].sort()}}
export function satisfies(recipe,result,minSlots=0,cardColor=0){const f=features(recipe,result);return f.slots>=minSlots&&(!cardColor||f.colors.includes(cardColor))}
export function conditionPlans(recipe,minSlots=0,cardColor=0){
 const relevant=recipe.areas.map((a,i)=>({i,slots:a.effects.filter(e=>e.type===7).reduce((s,e)=>s+Number(e.params[0]),0),color:a.effects.some(e=>e.type===1&&e.params.map(Number).includes(cardColor))})).filter(a=>minSlots>0&&a.slots>0||cardColor&&cardColor!==recipe.color&&a.color);
 const plans=[];function visit(n,chosen,slots,color){if(slots>=minSlots&&color){if(!plans.some(p=>p.every(i=>chosen.includes(i))))plans.push(chosen);return}if(n===relevant.length)return;visit(n+1,chosen,slots,color);const a=relevant[n];visit(n+1,[...chosen,a.i],slots+a.slots,color||a.color)}visit(0,[],0,!cardColor||cardColor===recipe.color);
 return plans.filter(p=>!plans.some(q=>q.length<p.length&&q.every(i=>p.includes(i)))).sort((a,b)=>a.reduce((n,i)=>n+recipe.areas[i].cells.length,0)-b.reduce((n,i)=>n+recipe.areas[i].cells.length,0));
}

export function retainConditionSolution(recipe,row,result){
 if(!row.conditions)return;
 const index=row.variants.length;let used=false;
 for(let slots=0;slots<=3;slots++)for(let color=0;color<=5;color++){if(!satisfies(recipe,result,slots,color))continue;const key=slots+':'+color,old=row.conditions[key];if(old===undefined||old<0||result.value>row.variants[old].value){row.conditions[key]=index;used=true;}}
 if(used)row.variants.push(result);
 row.result=row.variants[row.conditions['0:0']];
}
