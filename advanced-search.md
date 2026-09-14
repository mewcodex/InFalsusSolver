# Advanced search experiments — 2026-09-14

## Strategies

- Legacy: randomized greedy covering with scattered removal, previously deployed integer-coordinate optimization.
- Portfolio: keep eight distinct placement layouts (at most two penalties behind the best), mix contiguous hexagonal patch destruction with scattered removal and fresh restarts. For total attributes, retain twelve distinct activated-area combinations and mutate multiple high-scoring combinations rather than only the best one.
- Experimental backtracking: portfolio plus bounded depth-first patch repair, removing up to five nearby pieces. At most 1,200 nodes / 12 ms, sixteen candidate branches per target, and one extra piece. Optimistic bounds use the maximum possible forgiveness and particle limit; branching/time limits mean this is not an exact global solver.

## Equal-budget comparisons

Runs were sequential, alternated old/new ordering, and used seeds 1123, 937, 47119 for covering. Runtime budgets include setup. Results are wall-clock heuristic measurements and can vary between runs; they are not guarantees for individual cards.

| Comparison | Cases | Better | Worse | Aggregate penalties before / after |
| --- | ---: | ---: | ---: | ---: |
| Portfolio, 250 ms, all 42 recipes × 3 seeds | 126 | 22 | 11 | 709 / 696 |
| Backtracking, 250 ms, all 42 recipes × 3 seeds | 126 | 23 | 21 | 714 / 714 |

Warm-started total-attribute comparison used 1,500 ms per run, seeds 1123 and 47119, and all 23 cards whose saved total was below their upper bound. Portfolio beat legacy in 2 of 46 cases and tied in 44 (no regressions in this sample). Sum of values: 4,761,793 → 4,770,784. Cards already at their proven upper bound were omitted from this benchmark.

Both algorithms could discover improvements over stored records; this comparison does not claim new records are exclusively discoverable by portfolio search.

## Deployment decision

Enable portfolio for total-attribute maximization (including constrained maximization). Keep legacy as the default for minimum-penalty covering because covering regressions outweigh the small aggregate gain. Preserve backtracking only in fixtures/solver-experimental-backtracking.mjs for further experiments.

Retain every better feasible benchmark result in the applicable ranking conditions, without lowering an existing value. Card 19: 73,926 → 80,920. Card 68: 73,926 → 75,924.

## Reproduction and validation

- node portfolio-benchmark.mjs
- node exact-benchmark.mjs
- node portfolio-stats-benchmark.mjs (uses current ranking warm starts; archived JSON records the starts used here)
- node advanced-search-tests.mjs — 338 geometry/coverage/filter/constraint cases across portfolio and backtracking
- node search-equivalence.mjs — 84 deterministic legacy trajectory comparisons
- node stats-tests.mjs
- node stat-formula-tests.mjs
- node conditions-tests.mjs
- node audit-rankings.mjs --verify-only — independently reconstructed connectivity, penalties and attribute calculations

Benchmark JSON files contain the observed measurements; portfolio-stats-benchmark.json also preserves the complete feasible layouts. No global-optimality claim is added beyond the existing verified theoretical bound.
