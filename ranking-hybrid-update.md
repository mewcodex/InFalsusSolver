# Ranking data update

Audited 140 warm-started searches: all 42 unrestricted recipes plus 98 saved utility layouts. Equal nominal 1-second runs alternated old/new order. The experimental hybrid won 3 cases, lost 24, and tied 113, so the production solver remains unchanged. Detailed timing and scores are in website-hybrid-comparison.json.

Only better feasible records from the trial and baseline recovery passes were retained. Across all 5,040 slot/color/range entries, 358 improved across 21 recipes and none decreased. All 42 unrestricted best totals are unchanged. Unreachable conditions remain unchanged. Conditions-tests compacted unused variants; the final data was independently audited again and compared to the original condition values.

Validation: node audit-all-ranking-variants.mjs; node conditions-tests.mjs. Every stored variant was independently reconstructed from original particle geometry, including connectivity, area activation, penalties, and float32 attribute arithmetic. Changed condition values are listed in ranking-hybrid-audit.json. Data-fetch and entry-script version strings were refreshed so existing clients request the updated records.

No new global-optimality claim is made.
