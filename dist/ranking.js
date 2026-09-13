import {cardName} from './spoilers.js';
import {point,polygon} from './geometry.js';
import {theoreticalStats} from './card-stats.js';
const colors=['#101721','#ef7779','#e9ca72','#75c69c','#74ace3','#b497e0','#293b4c'],key=c=>c.slice(0,2).join(','),num=n=>n.toLocaleString('zh-CN'),escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function preview(recipe){
 const cells=recipe.cells,points=cells.map(point),xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),view=[Math.min(...xs)-24,Math.min(...ys)-24,Math.max(...xs)-Math.min(...xs)+48,Math.max(...ys)-Math.min(...ys)+48];
 const background=cells.map(c=>`<polygon points="${polygon(c)}" fill="${colors[c[2]]}" fill-opacity=".7" stroke="#465369" stroke-width="1"/>`).join('');
 return `<svg class="rank-preview" viewBox="${view.join(' ')}" role="img" aria-label="${escape(cardName(recipe))}的配方地图">${background}</svg>`;
}

try{
 const [ranking,data]=await Promise.all([fetch('ranking-data.json').then(r=>r.json()),fetch('data.json').then(r=>r.json())]);
 const rows=ranking.rows.sort((a,b)=>b.result.value-a.result.value||a.id-b.id),size=6,pages=Math.max(1,Math.ceil(rows.length/size));let page=Math.min(pages,Math.max(1,Math.floor(Number(new URLSearchParams(location.search).get('page'))||1)));
 document.getElementById('coverage').textContent=`已收录 ${rows.length} / ${ranking.totalRecipes} 张`;
 function render(){document.getElementById('ranking-grid').innerHTML=rows.slice((page-1)*size,page*size).map(row=>{const r=data.recipes.find(r=>r.id===row.id),s=theoreticalStats(r,row.result),rank=rows.findIndex(x=>x.result.value===row.result.value)+1,reached=row.result.value===row.upper;return `<a class="rank-card" href="index.html?saved=${r.id}&page=${page}"><div class="rank-top"><span class="rank-number">${String(rank).padStart(2,'0')}</span><div><h2>${escape(cardName(r))}</h2><small>${escape(r.internal)} · ${escape(data.characters[r.character].name)}</small></div></div>${preview(r)}<div class="rank-info"><div class="rank-total">${num(row.result.value)}<small>可行解总属性</small></div><div class="rank-split"><span>威力 ${num(s.power)}</span><span>耐力 ${num(s.fortitude)}</span></div><div class="rank-meta"><span>${s.strikes} 惩罚 · 粒子 ${row.result.placements.length}/${row.result.score.limit}</span><span>查看完整方案 ↗</span></div><div class="rank-bound"><span>理论上限 ${num(row.upper)}</span><span class="${reached?'reached':''}">${reached?'已达上限':'当前最佳'}</span></div></div></a>`}).join('');
 const nav=document.getElementById('pagination');nav.innerHTML=`<button data-page="${page-1}" ${page===1?'disabled':''}>上一页</button>`+Array.from({length:pages},(_,i)=>`<button data-page="${i+1}" ${page===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')+`<button data-page="${page+1}" ${page===pages?'disabled':''}>下一页</button>`;nav.querySelectorAll('button').forEach(b=>b.onclick=()=>{page=Number(b.dataset.page);history.replaceState(null,'','ranking.html?page='+page);render();window.scrollTo({top:0,behavior:'smooth'})});}
 window.addEventListener('card-name-visibility',render);render();
}catch(e){document.getElementById('coverage').textContent='加载失败';document.getElementById('ranking-grid').textContent='无法加载排名：'+e.message;}
