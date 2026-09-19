import {cardName} from './spoilers.js';
import {teamPreview,colors,escape} from './team-preview.js';
import {loadoutFiles,loadoutKey} from './loadouts.js';
const num=n=>Math.round(n).toLocaleString('zh-CN'),colorNames=['无色','红','黄','绿','蓝','紫'];
try{
 const choice=loadoutKey(new URLSearchParams(location.search).get('loadout'));
 const selector=document.getElementById('team-choice');selector.value=choice;selector.onchange=()=>{const url=new URL(location.href);url.searchParams.set('loadout',selector.value);location.href=url};
 const [team,data]=await Promise.all([loadoutFiles[choice],'data.json'].map(async p=>{const r=await fetch(p+'?v=snapshot-22894');if(!r.ok)throw Error('方案文件加载失败');return r.json()}));
 let metrics,context,conditions;
 const common='角色满级 · 粒子效能 999 · 谱面等级 15 · 计入联觉、阶段暴击、诅咒。卡名不重复；技能可以跨卡重复，单卡内不重复；每张卡威力与耐力均大于 0。';
 if(choice==='storm-score'){
  metrics=[[num(team.result.score),'最高已知遭遇分 · CONNECT'],[team.result.minHp.toFixed(2)+'%','最低我方血量'],[num(team.reference995Level11.result.score),'粒子 995 · 11 级参考分']];
  context='无常的风暴 · 以成功通关后的遭遇分数最高为目标；已计入双方颜色克制、敌方技能、红色限制、回复和生存。此处展示当前最高已知分数方案。';
  conditions='假定五阶段准确率均匀一致，计入双方颜色克制和阶段暴击。颜色克制逐张修正双方基础攻防后汇总。实际谱面的物量分布与暴击取整会影响结果。按游戏实际队列结算：先入队阶段切换与持续效果变化；切换事件执行时追加瞬间特质，再重排剩余队列。阶段最后一个判定后先递增计数，结束特质的颜色检查可能读取下一张卡；整曲结束时持续效果也按顺序移除。请保持下方特质排列顺序。';
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
  document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<h3>粒子 995 · 11 级曲参考</h3><p>保持本页拼法、颜色和技能，全部粒子效能改为 995、谱面等级改为 11：预计遭遇分 <strong>${num(r.score)}</strong>，攻击率 ${num(r.dp*100/(100+r.he)*100)}、防御率 ${num(10000*(100+r.hp)/r.de)}；最低血量 ${r.minHp.toFixed(2)}%，结束血量 ${r.phases.at(-1).playerHp.toFixed(2)}%。按双方准确率 100%、五阶段等物量参考模型计算；具体谱面的整数判定数会带来小幅差异。</p><p>本轮使用扩充解库快照进行多起点随机搜索、单卡替换与特质逐项优化，并检查特质顺序和双卡候选替换。尚未穷举所有特质组合，也未证明全局最优。</p>`);
 }
 if(choice==='balanced'){
  const coefficient=team.result.de/team.assumptions.enemyTotalAttack, attacks=[11300,48500,100000];
  document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<h3>固定配卡的推定承伤</h3><p>在准确率 100% 的计算参考点、敌方无技能且五阶段均匀时，本页固定配卡的整场承伤为 <strong>Dₑ ≈ ${coefficient.toFixed(11)} × A</strong>。A 为五张敌方卡汇总后的总基础攻击；Dₑ 的单位为完整血条的百分点。</p><div class="table-wrap"><table><thead><tr><th>敌方总攻击</th><th>整场预计承伤</th><th>最终血量</th></tr></thead><tbody>${attacks.map(a=>`<tr><td>${num(a)}</td><td>${(a*coefficient).toFixed(4)}%</td><td>${(100-a*coefficient).toFixed(4)}%</td></tr>`).join('')}</tbody></table></div><p>敌方总攻击为 11,300–100,000 时，这套固定配卡的推定承伤为 ${ (11300*coefficient).toFixed(4)}%–${(100000*coefficient).toFixed(4)}%。这是固定配卡的线性推算；本轮以 A = 48,500 搜索，未证明整段攻击区间都最优。敌方攻击更高时，回复技能可能改变最优搭配。敌方防御在该无技能、完整游玩模型中同比缩放分数，胜利条件仍需单独检查。</p>`);
 }
 document.getElementById('team-conditions').insertAdjacentHTML('beforeend','<p>数值参考：页面所列分数、伤害和血量按双方准确率 100%、五阶段等物量计算，不是使用这套配卡的要求。准确率降低时，数值及最优技能搭配可能变化；尚未对所有准确率重新优化。</p>');
 if(team.snapshotAudit){const a=team.snapshotAudit;document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<p>扩充解库复查：快照 ${a.generation}，${num(a.archiveRecords)} 条拼法，${num(a.randomEvaluations)} 次随机评估、${num(a.neighborhoodEvaluations)} 次替换及特质调整评估。${a.improved?`本方案从 ${num(a.before)} 提升至 ${num(a.after)}。`:'本轮未找到超过本方案的组合。'}限时搜索，未证明全局最优。</p>`);}
 if(team.searchAudit){const a=team.searchAudit;document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<p>解库复查：${a.date} · ${a.archiveRecords} 条已知拼法记录。使用安全精简的本地候选库，完成随机搜索、单卡及其全部技能组合替换检查、双卡候选复查；本轮未超过当前方案。单卡检查 ${num(a.singleReplacementChecks)} 次，双卡候选检查 ${num(a.pairCandidateChecks)} 次。未证明全局最优。</p>`);}
 if(team.boundaryAudit?.validationStatus==='both-records-reproduced-with-reference-inputs')document.getElementById('team-conditions').insertAdjacentHTML('beforeend','<p>模型复核：在对应配卡和参考输入下，已重现 Cryogenic 的攻击率 84129／防御率 45133／分数 379698，以及 Ghost Ray 的攻击率 77859／防御率 51488 与伤害明细。Cryogenic 的阶段 NEAR 分配仍采用此前假设；Ghost Ray 用实测表现上限推回攻击属性。两份记录均未提供完整事件日志。</p>');
 if(team.boundaryAudit?.warning)document.getElementById('team-conditions').insertAdjacentHTML('beforeend',`<p><strong>模型复核中：</strong>${escape(team.boundaryAudit.warning)}</p>`);
 const render=()=>{document.getElementById('team-grid').innerHTML=team.cards.map(card=>{const recipe=data.recipes.find(r=>r.id===card.id),s=card.crafting.score;return `<a class="team-card" href="index.html?team=${card.position}&loadout=${choice}"><div class="team-card-head"><p style="color:${colors[card.color]}">第 ${card.position} 阶段 · 成品${colorNames[card.color]}色</p><h2>${escape(cardName(recipe))}</h2><p>威力 ${num(card.power)} ／ 耐力 ${num(card.fortitude)}</p></div>${teamPreview(recipe,card,cardName(recipe))}<div class="team-card-body"><p>${card.slots} 特质槽 · 额外左 ${card.left}／右 ${card.right}<br>粒子 ${card.crafting.placements.length}/${s.limit} · ${s.total} 次惩罚（已计入属性）</p><ul>${card.traits.length?card.traits.map(t=>`<li>${escape(t.name)}</li>`).join(''):'<li>无装备特质</li>'}</ul><span class="open-plan">放大查看完整方案 ↗</span></div></a>`}).join('')};render();window.addEventListener('card-name-visibility',render);
}catch(e){document.getElementById('team-summary').textContent='无法加载五卡方案：'+e.message;}
