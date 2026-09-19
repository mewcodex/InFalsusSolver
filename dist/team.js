import {cardName} from './spoilers.js';
import {teamPreview,colors,escape} from './team-preview.js';
import {loadoutFiles,loadoutKey} from './loadouts.js';
const num=n=>Math.round(n).toLocaleString('zh-CN'),colorNames=['无色','红','黄','绿','蓝','紫'];
try{
 const choice=loadoutKey(new URLSearchParams(location.search).get('loadout'));
 const selector=document.getElementById('team-choice');selector.value=choice;selector.onchange=()=>{const url=new URL(location.href);url.searchParams.set('loadout',selector.value);location.href=url};
 const [team,data]=await Promise.all([loadoutFiles[choice],'data.json'].map(async p=>{const r=await fetch(p+'?v=storm-color-20260919');if(!r.ok)throw Error('方案文件加载失败');return r.json()}));
 let metrics,context,conditions;
 const common='角色满级 · 粒子效能 999 · 谱面等级 15 · 计入联觉、阶段暴击、诅咒。卡名不重复；技能可以跨卡重复，单卡内不重复；每张卡威力与耐力均大于 0。';
 if(choice==='storm-score'){
  metrics=[[num(team.result.score),'最高已知遭遇分 · CONNECT'],[team.result.minHp.toFixed(2)+'%','最低我方血量'],[num(team.reference995Level11.result.score),'粒子 995 · 11 级参考分']];
  context='无常的风暴 · 以成功通关后的遭遇分数最高为目标；已计入双方颜色克制、敌方技能、红色限制、回复和生存。此处展示当前最高已知分数方案。';
  conditions='假定五阶段准确率均匀一致，计入双方颜色克制和阶段暴击。颜色克制逐张修正双方基础攻防后汇总。实际谱面的物量分布与暴击取整会影响结果。第 5 阶段使用黄色卡，阶段内攻击被封锁；阶段结束后的回响攻击与余波回复按结束时状态结算，已计入本方案。';
 }else if(choice==='balanced'){
  metrics=[[num(team.result.score),'综合最高已知分 · CONNECT'],[num(team.result.reflectScore),'同条件 REFLECT 分数'],[team.result.finalHp.toFixed(2)+'%','最终我方血量']];
  context='无技能等阶段敌人 · 总基础攻击 48,500、总基础防御 343,500。兼顾输出与减伤，四张技能卡覆盖全部阶段；五色联觉。';
  conditions='忽略颜色克制。假定五阶段准确率均匀一致，敌方无技能。敌方数值取无常的风暴基础总值，但移除了全部敌方技能。本方案满足 CONNECT 及 REFLECT 胜利条件。敌方攻击变化会影响回复技能收益，不能保证同一方案适用于任意敌方攻击。';
 }else if(choice==='original'){
  metrics=[[num(team.value),'可击败敌方总基础耐力 · 最高已知'],[num(team.perEnemyCard),'五张敌方卡均分耐力'],['5 色 × 5 阶段','全部技能范围覆盖全阶段']];
  context='最高已知总伤解 · 优化累计伤害，不优化遭遇分数。';
  conditions='忽略颜色克制。假定五阶段准确率均匀一致；敌方无技能、五张卡基础耐力相同。不约束我方生存。总基础耐力上限表示累计打掉 100% 血条时可承受的敌方总耐力，不是五条独立血量，也不是遭遇分。';
 }
 document.getElementById('team-context').textContent=context;
 const summary=document.getElementById('team-summary');summary.className='team-summary';summary.innerHTML=metrics.map(([value,label])=>`<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('');
 document.getElementById('team-conditions').innerHTML=`<h2>计算条件</h2><p>${escape(common)}</p><p>${escape(conditions)}</p><p>最高已知可行解，未证明全局最优。<a href="rewards.html#score">查看遭遇评分公式</a>。</p>`;
 if(choice==='storm-score'){
  const r=team.reference995Level11.result;
  document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<h3>粒子 995 · 11 级曲参考</h3><p>保持本页拼法、颜色和技能，全部粒子效能改为 995、谱面等级改为 11：预计遭遇分 <strong>${num(r.score)}</strong>，攻击率 ${num(r.dp*100/(100+r.he)*100)}、防御率 ${num(10000*(100+r.hp)/r.de)}；最低血量 ${r.minHp.toFixed(2)}%，结束血量 ${r.phases.at(-1).playerHp.toFixed(2)}%。按双方准确率 100%、五阶段等物量参考模型计算；具体谱面的整数判定数会带来小幅差异。</p><p>本轮遍历全部已知拼法与可用颜色，并完成单张卡连同其全部技能组合的穷举替换检查。双卡联动、卡位排列及随机搜索用于进一步寻找改进，尚未证明全局最优。</p>`);
 }
 if(choice==='balanced'){
  const coefficient=team.result.de/team.assumptions.enemyTotalAttack, attacks=[11300,48500,100000];
  document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<h3>固定配卡的推定承伤</h3><p>在准确率 100% 的计算参考点、敌方无技能且五阶段均匀时，本页固定配卡的整场承伤为 <strong>Dₑ ≈ ${coefficient.toFixed(11)} × A</strong>。A 为五张敌方卡汇总后的总基础攻击；Dₑ 的单位为完整血条的百分点。</p><div class="table-wrap"><table><thead><tr><th>敌方总攻击</th><th>整场预计承伤</th><th>最终血量</th></tr></thead><tbody>${attacks.map(a=>`<tr><td>${num(a)}</td><td>${(a*coefficient).toFixed(4)}%</td><td>${(100-a*coefficient).toFixed(4)}%</td></tr>`).join('')}</tbody></table></div><p>敌方总攻击为 11,300–100,000 时，这套固定配卡的推定承伤为 ${ (11300*coefficient).toFixed(4)}%–${(100000*coefficient).toFixed(4)}%。这是固定配卡的线性推算；本轮以 A = 48,500 搜索，未证明整段攻击区间都最优。敌方攻击更高时，回复技能可能改变最优搭配。敌方防御在该无技能、完整游玩模型中同比缩放分数，胜利条件仍需单独检查。</p>`);
 }
 document.getElementById('team-conditions').insertAdjacentHTML('beforeend','<p>数值参考：页面所列分数、伤害和血量按双方准确率 100%、五阶段等物量计算，不是使用这套配卡的要求。准确率降低时，数值及最优技能搭配可能变化；尚未对所有准确率重新优化。</p>');
 const render=()=>{document.getElementById('team-grid').innerHTML=team.cards.map(card=>{const recipe=data.recipes.find(r=>r.id===card.id),s=card.crafting.score;return `<a class="team-card" href="index.html?team=${card.position}&loadout=${choice}"><div class="team-card-head"><p style="color:${colors[card.color]}">第 ${card.position} 阶段 · 成品${colorNames[card.color]}色</p><h2>${escape(cardName(recipe))}</h2><p>威力 ${num(card.power)} ／ 耐力 ${num(card.fortitude)}</p></div>${teamPreview(recipe,card,cardName(recipe))}<div class="team-card-body"><p>${card.slots} 特质槽 · 额外左 ${card.left}／右 ${card.right}<br>粒子 ${card.crafting.placements.length}/${s.limit} · ${s.total} 次惩罚（已计入属性）</p><ul>${card.traits.length?card.traits.map(t=>`<li>${escape(t.name)}</li>`).join(''):'<li>无装备特质</li>'}</ul><span class="open-plan">放大查看完整方案 ↗</span></div></a>`}).join('')};render();window.addEventListener('card-name-visibility',render);
}catch(e){document.getElementById('team-summary').textContent='无法加载五卡方案：'+e.message;}
