export const colorNames=['无色','红色','黄色','绿色','蓝色','紫色'];
export function describeEffect(e){
 if(e.type===1)return '启用'+e.params.map(v=>colorNames[Number(v)]||String(v)).join('、');
 return ({3:'基础威力',4:'基础耐力',5:'威力 %',6:'耐力 %',7:'特质槽',8:'范围',9:'越界豁免',15:'粒子上限扣减'}[e.type]||e.id)+' '+e.params.join(' / ');
}
// Native crafting preview uses a strike limit of 3. Preserve its float32
// multiplier calculations, double stat multiplication, and final ceiling.
export function theoreticalStats(recipe,solution){
 let basePower=0,baseFortitude=0,percentPower=0,percentFortitude=0;
 for(const i of solution.score.activeAreas)for(const e of recipe.areas[i].effects){const n=Number(e.params[0]);if(e.type===3)basePower+=n;if(e.type===4)baseFortitude+=n;if(e.type===5)percentPower+=n;if(e.type===6)percentFortitude+=n}
 const strikes=solution.score.total,retention=strikes>=3?0:Math.fround(Math.fround(9-strikes*strikes)/9),potency=solution.placements.length?Math.fround(999/100):0;
 const power=Math.ceil(basePower*((100+percentPower)/100)*retention*potency),fortitude=Math.ceil(baseFortitude*((100+percentFortitude)/100)*retention*potency);
 return {power,fortitude,basePower,baseFortitude,percentPower,percentFortitude,strikes,retention,potency};
}

export function recipeStats(recipe){
 return theoreticalStats(recipe,{placements:[{}],score:{total:0,activeAreas:recipe.areas.map((_,i)=>i)}});
}
