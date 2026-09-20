# 扩充快照 30548 检查

{
  "snapshot": {
    "generation": 30548,
    "jobs": 30547,
    "updatedAt": "2026-09-20T01:49:32.560Z",
    "snapshotRecords": 1776,
    "previousRecords": 1727,
    "mergedRecords": 1796,
    "checked": 4578,
    "teamRecords": 801,
    "teamColorVariants": 1767
  },
  "ranking": {
    "improvedConditions": 42,
    "regressions": 0
  },
  "teams": [
    {
      "mode": "storm",
      "before": 532659.3883237918,
      "after": 583859.6094067477,
      "improved": true,
      "percent": 9.612187864382937
    },
    {
      "mode": "balanced",
      "before": 7500082.2045394005,
      "after": 7561667.842109024,
      "improved": true,
      "percent": 0.8211328341487745
    },
    {
      "mode": "damage",
      "before": 23170058.0195625,
      "after": 23170058.0195625,
      "improved": false,
      "percent": 0
    }
  ],
  "storm995Level11": 539604.7494916668
}

本轮采用 1471 个去重候选，未做跨卡剔除。三组分别运行 60 秒随机搜索，再进行限时单卡、特质顺序和前 24 候选双卡检查。没有证明全局最优。

风暴已更换卡序、拼法和特质；旧方案记录保留在 local-data/pre-expansion-team-score-data.json。后台扩充继续运行，本轮使用固定快照。本轮只更新本地页面，未部署远端。