# Stage A7 — Duplicates and similarities

## Observed overlaps

| Candidates | Classification | A7 decision |
|---|---|---|
| Owner, pharmacy-location and registration-audit migration CLI `getMongoDbUri()` helpers | Exact/semantic similarity | Leave domain-specific scripts independent. Extraction would change pinned G3 implementations for little benefit; no observed functional duplication bug. |
| Mongo connect/disconnect and error reporting across several scripts | Intentional similarity | Keep lifecycle local to each operational CLI. Centralizing may obscure transaction/session lifetime or error semantics. |
| Demo pharmacy introductions/bank-details scripts | Intentional similarity | Both are limited backfills with different conditions, fields and validation. Preserve separate entrypoints. |
| Review migration loops in `migrate-domain-entities.ts` (product vs pharmacy) | Semantic similarity | Candidate for an independently verified helper **after** deterministic retry tests; preserve separate collection fields and unique indexes. |
| Various demo fixture construction functions in `seed.ts` | Intentionally co-located demo scenarios | Do not split/destructively consolidate without a repeatable database replay; preserve exact data and lifecycle. |
| Diagnostic and owner-document migration | False positive: both inspect registration records | Keep diagnostic **read-only** and migration opt-in `--apply`; never merge their execution paths. |

No production script was deleted or replaced with a proxy. This audit did **not** prove all service-level migration writes are idempotent; the known risks are listed in the Fix Plan.
