export function penaltyRows(s,skills,recipe){
 const extra=[0,0,0];for(const i of s.activeAreas)for(const e of recipe.areas[i].effects)if(e.type>=9&&e.type<=11)extra[e.type-9]+=Number(e.params[0]);
 return [
  {name:'超上限',raw:s.complexity,skill:0,extra:0,net:s.complexity,hint:`有效上限 ${s.limit}`},
  {name:'越界',raw:s.unsafeCount,skill:skills[3],extra:extra[0],net:s.unsafe,hint:'按粒子数'},
  {name:'重叠',raw:s.overlapCount,skill:skills[4],extra:extra[1],net:s.overlap,hint:'按重叠格数'},
  {name:'断连',raw:Math.max(0,s.components-1),skill:skills[5],extra:extra[2],net:s.disconnected,hint:'多出的连通组'}
 ];
}
export function markedCells(recipe,placements){const safe=new Set(recipe.cells.map(c=>c.slice(0,2).join(','))),counts=new Map();for(const p of placements)for(const c of p.cells){const k=c.join(',');counts.set(k,(counts.get(k)||0)+1)}return {unsafe:[...counts.keys()].filter(k=>!safe.has(k)),overlap:[...counts.keys()].filter(k=>counts.get(k)>1)}};
