# Known solution archive

`dist/solution-archive-data.json` keeps verified known solutions by recipe and tier restriction. The browser also merges discovered solutions into IndexedDB (`infalsus-solutions`), and reloads them for later searches. Local discoveries are stored on that browser/device; a static GitHub Pages site cannot upload them back into this repository automatically.

For each **actually completed area set**, keep its lowest known penalty count (tie: fewer particles). Do not claim that a nonzero penalty is proven minimal, or that all possible area sets have been explored. Search intermediate candidates are collected even when they do not improve the total-stat winner or meet the current required-area selection.

Across area sets, remove a solution only if another solution of the **same recipe** and tier domain is no worse in power, fortitude, left range, right range, trait slots and usable color set, and is strictly better in at least one dimension. Usable colors compare by set inclusion. Equal capabilities from different area sets remain separate. No-tier-3 and unrestricted records never prune each other. Version 2 records carry `recipeId`; dominance explicitly rejects different recipe IDs, and insertion rejects mixed-recipe collections. Legacy browser entries inherit their existing per-recipe storage key.

Every cell may contain at most **three particles**. Fourfold overlap is invalid regardless of overlap forgiveness. Invalid cached entries are purged before they can dominate a valid entry, and online searches reject them at construction, warm start, candidate reporting and storage. `score()` marks such a layout with `invalidOverlap: true` and an infinite cost; it must never be serialized as a valid solution.

Retained geometry is cloned: search repair mutates temporary placement arrays, so retaining references would corrupt the association between a layout and its score.

This pruning follows the requested card-capability ordering. Longer range does not mathematically guarantee improvement for every *outside-range* trait or timing-dependent encounter. Team results remain best known, with prior lineups kept as comparison baselines; not proofs of global optimality.

Run from the repository root:

```powershell
node archive-tests.mjs
node tools/search-archive.mjs 5000       # 5 seconds per recipe
node tools/search-archive.mjs 30000 70   # target one recipe
node tools/scan-area-combinations.mjs 90 all area-search-state.json
node tools/audit-known-solutions.mjs
```

`scan-area-combinations.mjs` uses the existing portfolio covering solver, independently of the total-stat objective. It retries retained nonzero-penalty combinations and one-area neighbors of all retained tradeoffs, then uses a resumable permutation of all nonempty area subsets. No exponential plan array is allocated. It records the **actual** achieved area set, and reports exact requested-set matches separately. A time-limited scan is not a claim that every subset has been solved or every nonzero penalty is minimal. Progress lives in the supplied state file; use a single writer for a given archive/state pair.

Search callbacks also retain valid layouts before redundant target-covering pieces are removed, since that cleanup can deactivate a different bonus-area combination. The 2026-09-19 scan attempted 1,929 plans in 90 seconds, found exact-set candidates on 1,829 attempts, and expanded the nondominated archive from 269 to 380 records. All previous same-recipe capability vectors remain represented or dominated by a retained vector. The subsequent three-particle audit repaired one unique Pain layout used in three records without changing its final attributes.

The leaderboard's existing condition indices and shared links remain stable. The archive is a separate, richer source for subsequent five-card searches; it is not reduced to a single total-stat winner.
