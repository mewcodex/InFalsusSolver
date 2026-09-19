# 已知解库扩充与本地配卡候选精简

2026-09-19：完整库 380 → 453 条（包括 all 和 no-tier3 域）。所有旧能力向量保留或被同卡严格更优向量覆盖；没有在完整库做跨卡删除。

## 覆盖搜索

`tools/search-archive-ensemble.mjs` 混合四条路径：旧奖励束搜索、legacy 覆盖修复、portfolio 局部破坏重建、GRASP 限制候选列表随机选择。旧奖励搜索调用当前几何求解器，因此同样遵守每格最多三个粒子的硬上限。

增加 `exploreAfterZero`：离线建库找到零惩罚后仍继续探索不同几何布局，记录实际完成的区域组合。在线默认仍在达到零惩罚后结束，默认算法未改成 GRASP。交替使用旧解热启动和从头搜索。每个策略提供互补分支；短基准中没有一个策略处处获胜，因此不宣称 GRASP 全面更快。

本轮耗时约 180 秒，运行 42 次旧奖励搜索、313 次 portfolio、294 次 GRASP、294 次 legacy。可恢复进度；单一进程写入同一解库文件。

```powershell
node tools/search-archive-ensemble.mjs 180 ensemble-search-state.json
node tools/merge-archive-ranking.mjs
node tools/audit-known-solutions.mjs
```

排名合并改善了 16 张卡的 346 个原有筛选条件；旧条件均无退步。

## 安全精简子集

`local-data/team-candidates.json` 不由网页加载，供本地配卡搜索使用。它是完整库的派生数据，包含保留记录和可验证的剔除证书。266 条可制造全粒子候选（包括既有预设的保底拼法）精简为 260 条，展开颜色并合并等价能力后为 563 个候选。

跨卡替代要求：

- 攻防随粒子效能变化的未取整系数均不低；至少一项属性、槽位或颜色集合严格更好。
- 特质槽不少；可用颜色为被替代解的超集，可以选用原来的同一种颜色，保持双方克制与联觉。
- 通用子集要求左右范围分别相同。不能因范围更长就删除，因为范围外技能和边界触发可能不同。
- 至少有五个**不同的其他卡名**可替代。队伍另外四个位置最多占用其中四个，所以必有未使用的替代卡。
- 同卡的安全支配只需一个替代记录。

严格“能力支配”不一定使每个目标分数严格提高（例如额外颜色未选用）。因此此子集保证的是**不损失最优值、仍存在一个最优代表**，不是宣称被删记录绝不可能参与并列最优。

按固定卡位进一步精简时，比对裁剪到五阶段内的实际左右范围。例如第一位的额外左范围不改变任何现有特质的触发时刻。五个位置分别保留 233、246、243、239、224 条记录；展开并合并等价颜色后分别为 502、532、515、507、484 个候选。不会将这些按位置剔除的解从完整库删掉。

证书按逆删除顺序核验，允许替代证人在后续又被安全替换；不同卡名计数、相同颜色和实际范围等条件均有测试。规则适用于当前三个预设及共享可用特质集，未承诺对未来具有卡名专属机制、不同掉落限制的模型仍安全。

```powershell
node tools/build-team-subset.mjs
node tools/team-subset-tests.mjs
$env:IF_TEAM_SUBSET='local-data/team-candidates.json'
node tools/team-search.mjs storm 120 dist/team-score-data.json storm-search.json 193101
node tools/team-polish.mjs storm-search.json storm-polished.json storm
node tools/team-pairs.mjs storm-polished.json storm-pairs.json storm
```

其余模式用 `balanced` / `damage`，对应 `team-balanced-data.json` / `team-data.json`。取消 IF_TEAM_SUBSET 环境变量可使用完整候选。以卡片属性重新映射初始方案，不依赖上次解库的数组编号。对子集删除的初始记录，会寻找同色、同范围、合法不重名的安全替代。

## 三预设复查

三组共进行了 42709148 次随机／退火评估、24820435 次单卡连同全部合法技能组合的穷举替换、5001050 次双卡候选检查，并在较好的双卡候选上重新优化技能。

| 目标 | 当前最高已知 | 本轮变化 |
|---|---:|---|
| 风暴遭遇分 | 553707.08045 | 无 |
| 无技能综合遭遇分 | 7353348.59432 | 无 |
| 最高总伤对应敌方总基础耐力 | 23170058.01956 | 无 |

风暴保留双方克制；另外两组沿用无技能、忽略颜色克制的模型。均计入满级联觉。风暴粒子 995／11 级参考分仍为 511737.98312。

单卡检查可以证实该邻域内无改进。双卡检查使用分别优化过的技能及后续局部优化，没有枚举两卡全部技能组合的笛卡尔积，更没有五卡全局上界证书。**精简规则的安全性不等于求解算法已证明全局最优。**

结果与计数见 `local-data/ensemble-audit.json`，排名条件改进见 `local-data/ranking-ensemble-audit.json`，覆盖策略基准见 `local-data/cover-ensemble-benchmark.json`。
