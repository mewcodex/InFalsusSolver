# Known solution archive

`dist/solution-archive-data.json` keeps verified known solutions by recipe and tier restriction. The browser also merges discovered solutions into IndexedDB (`infalsus-solutions`), and reloads them for later searches. Local discoveries are stored on that browser/device; a static GitHub Pages site cannot upload them back into this repository automatically.

For each **actually completed area set**, keep its lowest known penalty count (tie: fewer particles). Do not claim that a nonzero penalty is proven minimal, or that all possible area sets have been explored. Search intermediate candidates are collected even when they do not improve the total-stat winner or meet the current required-area selection.

Across area sets, remove a solution only if another solution of the same recipe and tier domain is no worse in power, fortitude, left range, right range, trait slots and usable color set, and is strictly better in at least one dimension. Usable colors compare by set inclusion. Equal capabilities from different area sets remain separate. No-tier-3 and unrestricted records never prune each other.

Retained geometry is cloned: search repair mutates temporary placement arrays, so retaining references would corrupt the association between a layout and its score.

This pruning follows the requested card-capability ordering. Longer range does not mathematically guarantee improvement for every *outside-range* trait or timing-dependent encounter. Team results remain best known, with prior lineups kept as comparison baselines; not proofs of global optimality.

Run from the repository root:

```powershell
node archive-tests.mjs
node tools/search-archive.mjs 5000       # 5 seconds per recipe
node tools/search-archive.mjs 30000 70   # target one recipe
```

The leaderboard's existing condition indices and shared links remain stable. The archive is a separate, richer source for subsequent five-card searches; it is not reduced to a single total-stat winner.
