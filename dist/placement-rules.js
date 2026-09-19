export const MAX_CELL_PARTICLES=3;
export function overlapViolations(placements){
 const counts=new Map();for(const p of placements)for(const c of p.cells){const k=c[0]+','+c[1];counts.set(k,(counts.get(k)||0)+1);}
 return [...counts].filter(([,n])=>n>MAX_CELL_PARTICLES).map(([cell,count])=>({cell,count}));
}
export function hasLegalOverlap(placements){
 const counts=new Map();for(const p of placements)for(const c of p.cells){const k=c[0]+','+c[1],n=(counts.get(k)||0)+1;if(n>MAX_CELL_PARTICLES)return false;counts.set(k,n);}return true;
}
