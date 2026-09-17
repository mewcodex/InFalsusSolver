import {cardName} from './spoilers.js';
import {teamPreview,colors,escape} from './team-preview.js';
import {loadoutFiles,loadoutKey} from './loadouts.js';
const num=n=>Math.round(n).toLocaleString('zh-CN'),colorNames=['无色','红','黄','绿','蓝','紫'];
try{
 const choice=loadoutKey(new URLSearchParams(location.search).get('loadout'));
 const selector=document.getElementById('team-choice');selector.value=choice;selector.onchange=()=>{const url=new URL(location.href);url.searchParams.set('loadout',selector.value);location.href=url};
 const [team,data]=await Promise.all([loadoutFiles[choice],'data.json'].map(async p=>{const r=await fetch(p);if(!r.ok)throw Error('方案文件加载失败');return r.json()}));
 let metrics,context,conditions;
 const common='角色满级 · 粒子效能 999 · 谱面等级 15 · 计入联觉、阶段暴击、诅咒，忽略颜色克制。卡名不重复；技能可以跨卡重复，单卡内不重复；每张卡威力与耐力均大于 0。';
 if(choice==='storm-score'){
  metrics=[[num(team.result.score),'最高已知遭遇分 · CONNECT'],[team.result.minHp.toFixed(2)+'%','最低我方血量'],['五阶段一致','假定准确率均匀分布']];
  context='无常的风暴 · 以成功通关后的遭遇分数最高为目标；已计入敌方技能、红色限制、回复和生存。此处展示最高分方案，与旧版低准确率五星方案分别列出。';
  conditions='假定五阶段准确率均匀一致，计入阶段暴击。实际谱面的物量分布与暴击取整会影响结果。';
 }else if(choice==='balanced'){
  metrics=[[num(team.result.score),'综合最高已知分 · CONNECT'],[num(team.result.reflectScore),'同条件 REFLECT 分数'],[team.result.finalHp.toFixed(2)+'%','最终我方血量']];
  context='无技能等阶段敌人 · 总基础攻击 48,500、总基础防御 343,500。兼顾输出与减伤，四张技能卡覆盖全部阶段；五色联觉。';
  conditions='假定五阶段准确率均匀一致，敌方无技能。敌方数值取无常的风暴基础总值，但移除了全部敌方技能。本方案满足 CONNECT 及 REFLECT 胜利条件。敌方攻击变化会影响回复技能收益，不能保证同一方案适用于任意敌方攻击。';
 }else if(choice==='original'){
  metrics=[[num(team.value),'可击败敌方总基础耐力 · 最高已知'],[num(team.perEnemyCard),'五张敌方卡均分耐力'],['5 色 × 5 阶段','全部技能范围覆盖全阶段']];
  context='最高已知总伤解 · 优化累计伤害，不优化遭遇分数。';
  conditions='假定五阶段准确率均匀一致；敌方无技能、五张卡基础耐力相同。不约束我方生存。总基础耐力上限表示累计打掉 100% 血条时可承受的敌方总耐力，不是五条独立血量，也不是遭遇分。';
 }else{
  metrics=team.samples.map(r=>[num(r.score),Math.round(r.p*100)+'% EXACT · 最低血量 '+r.minHp.toFixed(1)+'%']);
  context='旧版两张改动方案 · 以较低 EXACT 率达到五星为目标，保留作对照，不属于最高分方案。';
  conditions='假定五阶段准确率均匀一致，EXACT / BREAK 均匀分布，计入无常的风暴敌方技能和生存。EXACT 比例不是通关概率；不模拟谱面自身 ±15 血条失败。';
 }
 document.getElementById('team-context').textContent=context;
 const summary=document.getElementById('team-summary');summary.className='team-summary';summary.innerHTML=metrics.map(([value,label])=>`<div><strong>${escape(value)}</strong><span>${escape(label)}</span></div>`).join('');
 document.getElementById('team-conditions').innerHTML=`<h2>计算条件</h2><p>${escape(common)}</p><p>${escape(conditions)}</p><p>最高已知可行解，未证明全局最优。<a href="rewards.html#score">查看遭遇评分公式</a>。</p>`;
 if(choice==='balanced')document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<h3>已知测试范围与推定承伤</h3><p>在敌方总基础攻击 A = 11,300、48,500、100,000 三个测试点，搜索均得到相同配卡的最高已知结果。可将 <strong>11,300–100,000</strong> 视为目前测试覆盖的攻击范围；只验证了这三个点，尚未证明中间每个取值都最优，区间两端也不是适用性的精确分界。</p><p>对本页这套固定配卡，在准确率 100% 的计算参考点、敌方无技能时，整场预计承伤为 <strong>Dₑ = 100 × A ÷ (338910.75 × 2.34 × 2.59) ≈ 0.00004868543 × A</strong>。Dₑ 的单位为完整血条的百分点；A 是敌方五张卡汇总后的总攻击，不是单卡攻击。</p><div class="table-wrap"><table><thead><tr><th>敌方总攻击</th><th>整场预计承伤</th><th>最终血量</th></tr></thead><tbody><tr><td>11,300</td><td>0.5501%</td><td>99.4499%</td></tr><tr><td>48,500</td><td>2.3612%</td><td>97.6388%</td></tr><tr><td>100,000</td><td>4.8685%</td><td>95.1315%</td></tr></tbody></table></div><p>因此，在上述攻击范围内，这套固定配卡的推定整场承伤为 <strong>0.5501%–4.8685%</strong>。这是承伤随攻击线性缩放的结果，不是通关概率或谱面 ±15 血量条的损失。</p><p>作为范围外对照：敌方总攻击 1,000,000 时，这套配卡预计承伤 48.6854%；另一个带回复技能的已知方案得分高约 21.69%。因此不能把当前无回复方案外推为任意敌方攻击下的最优解。敌方防御在该无技能、完整游玩模型中只同比缩放分数；是否满足胜利条件仍需单独检查。</p>`);
 if(choice!=='storm')document.getElementById('team-conditions').insertAdjacentHTML('beforeend','<p>数值参考：页面所列分数、伤害和血量按双方准确率 100%、五阶段等物量计算，不是使用这套配卡的要求。准确率降低时，数值及最优技能搭配可能变化；尚未对所有准确率重新优化。</p>');
 const render=()=>{document.getElementById('team-grid').innerHTML=team.cards.map(card=>{const recipe=data.recipes.find(r=>r.id===card.id),s=card.crafting.score;return `<a class="team-card" href="index.html?team=${card.position}&loadout=${choice}"><div class="team-card-head"><p style="color:${colors[card.color]}">第 ${card.position} 阶段 · 成品${colorNames[card.color]}色</p><h2>${escape(cardName(recipe))}</h2><p>威力 ${num(card.power)} ／ 耐力 ${num(card.fortitude)}</p></div>${teamPreview(recipe,card,cardName(recipe))}<div class="team-card-body"><p>${card.slots} 特质槽 · 额外左 ${card.left}／右 ${card.right}<br>粒子 ${card.crafting.placements.length}/${s.limit} · ${s.total} 次惩罚（已计入属性）</p><ul>${card.traits.length?card.traits.map(t=>`<li>${escape(t.name)}</li>`).join(''):'<li>无装备特质</li>'}</ul><span class="open-plan">放大查看完整方案 ↗</span></div></a>`}).join('')};render();window.addEventListener('card-name-visibility',render);
}catch(e){document.getElementById('team-summary').textContent='无法加载五卡方案：'+e.message;}
