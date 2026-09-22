# Archive and team refresh — snapshot 93928

Merged latest expansion into the deployed archive using same-card exact-left/right dominance. Retained entries: 2183 -> 2268 (all-tier 978 -> 999; no-tier3 1205 -> 1269). Independently verified geometry, penalties and three-particle overlap limit.

Ranking: all 1050 feasible conditions unchanged; all 5040 conditions checked, no regressions. Range retains >= semantics.

Re-searched all three presets against 1484 deduplicated color variants:

| Model | Random evaluations | Neighborhood evaluations | Best |
|---|---:|---:|---:|
| Storm | 2300111 | 840594 | 597565.7051971073 |
| Balanced | 10800129 | 827654 | 7561667.842109024 |
| Damage | 10740806 | 634244 | 23170058.0195625 |

No improvements; deployed decks and traits remain unchanged. Searches included single-card replacements, trait changes and within-card order, top paired candidates; this is not a global proof. Independent geometry, capability and model re-evaluation passed. The neighborhood script's final completed=false field is overwritten by its final save; each run ended naturally after a non-improving pass, before its time budget.

Updated cache tags including worker.js's previously stale solution-archive-data request. Archive, condition, combat-regression, team-model tests passed. No running proof or expansion checkpoint was modified.
