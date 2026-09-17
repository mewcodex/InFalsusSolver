import {point,polygon,boundary} from './geometry.js';
import {markedCells} from './penalty-display.js';
export const colors=['#101721','#ef7779','#e9ca72','#75c69c','#74ace3','#b497e0','#293b4c'];
export const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function teamPreview(recipe,card,label){
 const key=c=>c.slice(0,2).join(','),visible=new Map(recipe.cells.map(c=>[key(c),c]));for(const p of card.crafting.placements)for(const c of p.cells)if(!visible.has(key(c)))visible.set(key(c),[...c,0]);
 const points=[...visible.values()].map(point),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),view=[Math.min(...xs)-30,Math.min(...ys)-30,Math.max(...xs)-Math.min(...xs)+60,Math.max(...ys)-Math.min(...ys)+60];
 const background=[...visible.values()].map(c=>`<polygon points="${polygon(c)}" fill="${colors[c[2]]}" fill-opacity=".45" stroke="#465369" stroke-width="1"/>`).join('');
 const pieces=card.crafting.placements.map((p,i)=>({...p,index:i,path:boundary(p.cells).path})).sort((a,b)=>b.cells.length-a.cells.length||a.index-b.index);
 const layers=pieces.map(p=>`<path data-particle="${p.index}" d="${p.path}" fill="${colors[p.color]}" fill-rule="evenodd" stroke="#101923" stroke-width="3.4"/><path d="${p.path}" fill="none" stroke="#f1f6fa" stroke-width="1.2" stroke-opacity=".9"/>`).join('');
 const marked=markedCells(recipe,card.crafting.placements),prefix='team-'+card.position,defs=`<defs><pattern id="${prefix}-unsafe" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="8" height="8" fill="#ff334d" fill-opacity=".1"/><path d="M0 0V8" stroke="#ff2345" stroke-opacity=".5" stroke-width="3"/></pattern><pattern id="${prefix}-overlap" width="7" height="7" patternUnits="userSpaceOnUse"><rect width="7" height="7" fill="#ff334d" fill-opacity=".1"/><circle cx="3.5" cy="3.5" r="1.6" fill="#ff2345" fill-opacity=".65"/></pattern></defs>`;
 const overlays=['unsafe','overlap'].map(type=>marked[type].map(k=>`<polygon points="${polygon(k.split(',').map(Number))}" fill="url(#${prefix}-${type})"/>`).join('')).join('');
 const labels=pieces.map(p=>{const points=p.cells.map(point),cx=points.reduce((s,p)=>s+p[0],0)/points.length,cy=points.reduce((s,p)=>s+p[1],0)/points.length,[x,y]=points.reduce((a,b)=>(a[0]-cx)**2+(a[1]-cy)**2<(b[0]-cx)**2+(b[1]-cy)**2?a:b);return `<text x="${x}" y="${y+3.5}" text-anchor="middle" font-size="10" fill="#152536">${p.index+1}</text>`}).join('');
 return `<svg class="team-preview" viewBox="${view.join(' ')}" role="img" aria-label="${escape(label)}的完整粒子拼法">${defs}${background}${layers}<g pointer-events="none">${overlays}${labels}</g></svg>`;
}
