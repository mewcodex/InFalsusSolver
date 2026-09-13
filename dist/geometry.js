// Display only: flip vertically, then rotate 30 degrees counterclockwise.
// Solver coordinates and original particle orientations stay unchanged.
const root3=Math.sqrt(3);
export function transform([x,y]){return [root3*x/2-y/2,-x/2-root3*y/2]}
export const point=([q,r])=>transform([root3*10*(2*q+r),30*r]);
const corners=[[1,-1],[1,1],[0,2],[-1,1],[-1,-1],[0,-2]];
const lattice=([q,r])=>corners.map(([u,v])=>[2*q+r+u,3*r+v]);
const screen=([u,v])=>transform([root3*10*u,10*v]);
const id=p=>p.join(','),pair=p=>p.map(n=>Number(n.toFixed(5))).join(',');
export const polygon=c=>lattice(c).map(v=>pair(screen(v))).join(' ');
export function boundary(cells){
 const edges=new Map();
 for(const c of new Map(cells.map(c=>[id(c),c])).values()){
  const vertices=lattice(c);
  vertices.forEach((a,i)=>{const b=vertices[(i+1)%6],edge=[id(a),id(b)].sort().join('|');if(edges.has(edge))edges.delete(edge);else edges.set(edge,[a,b])});
 }
 const next=new Map([...edges.values()].map(([a,b])=>[id(a),b])),loops=[];
 while(next.size){const first=next.keys().next().value;let current=first,loop=[];
  do{loop.push(current.split(',').map(Number));const end=next.get(current);if(!end)throw Error('Open particle boundary');next.delete(current);current=id(end)}while(current!==first);
  loops.push(loop);
 }
 return {edgeCount:edges.size,loops,path:loops.map(loop=>'M'+loop.map(v=>pair(screen(v))).join('L')+'Z').join('')};
}
