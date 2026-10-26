# Stage A7 — API operational scripts audit

Source: `e-pharmacy-14-20-14.zip` (with A1–A6 retained). Audit is **read-only**; no migration, cleanup, seed, diagnostic or production DB query was executed.

## Inventory and interfaces

| Domain | Files | Purpose |
|---|---:|---|
| `migrations/` | 9 | Accounts (1), catalog (1), domains (1), owners (3), pharmacies (3) |
| `seeds/` | 2 | Destructive demo dataset and Platform Owner bootstrap |
| `diagnostics/` | 1 | Read-only historical owner-document investigation |
| `maintenance/` | 1 | Cart expiry cleanup |
| `build/` | 1 | Copy compiled API email templates |
| **Total** | **14** | Exactly the immutable G3 set; no legacy flat proxies |

All **14** original API package command names, command options, wrappers and G3 destinations are checked by exact equality against the immutable G0 script entrypoint plan. No new `apps/api/src/scripts` files or obsolete flat paths were observed. Package-local `build` still runs `tsc` first. The roots for `src/templates` → `dist/templates` are preserved.

A7 AST inventory: **84** direct write-like method call sites (including calls in function bodies, not necessarily executed by the entrypoint); **20** potentially destructive call sites (`deleteMany`, `dropIndex`); **10** approved empty-filter deletions within the demo-reset block. These are syntactic counts, **not** evidence of actual DB writes. Writes delegated into services are outside this direct-call count. See `script-audit-inventory.json` for per-file statistics.

## Safety findings

1. **High — Destructive demo seed:** `seeds/seed.ts` includes ten empty-filter `deleteMany({})` calls (pharmacies, products, offers, reviews, orders, carts, movements, notes and requests). It refuses `NODE_ENV=production` **before `connectDB()`**, but a live `MONGODB_URI` with a different NODE_ENV remains hazardous. Do not run `seed:api` on an existing working database. No automatic seed was executed during this audit.
2. **High — One-time canonical domain migration:** `migrations/domains/migrate-domain-entities.ts` drops an obsolete cart index, reconciles duplicate carts, and rewrites legacy data. The two legacy review migrations use fresh `ObjectId` fallbacks when source reviews have no stable `_id`. Partial failures/retries require a migration-specific replay test and backup; a static audit cannot certify full idempotency.
3. **Medium — Legacy owner migration:** `migrations/owners/migrate-pharmacy-owner-foundation.ts` contains a historical fixed demo-owner password and may create accounts. It is **not** a general production bootstrap; confirm the database is an approved legacy/demo target before running.
4. **Verified — Diagnostic boundary:** the owner document diagnostic has **zero** direct write-like calls, explicitly rejects extra CLI arguments including `--apply`, and connects with `autoCreate: false, autoIndex: false`. It does load private document contents internally to verify integrity; do not treat its diagnostic summary as ownership proof.
5. **Verified — Owner-document migration:** `--apply` is opt-in; omitted flag remains `dry-run`. The imported service, not just the CLI, must continue to enforce ownership/provenance and transaction rules.
6. **Verified — Admin bootstrap:** separate existing-admin conflict handling and two transactional operations are retained. Root/API command names remain stable.

## Dependency boundaries

G3 relocation pins all 14 entrypoint paths. API operational scripts use canonical `models`, `services`, `constants`, `utils`, and `config` locations. Historical G3 source fingerprints, G0/G6 inventories and other manifests have **not** been modified. The A7 checker reads files and parses ASTs only; it never spawns an operational script.

No production operational script was modified at A7. Refactoring the large demo seed (~4.9k lines) or the canonical domain migration (~0.5k lines) without replayable DB fixtures would increase migration risk; these remain explicit follow-up work rather than superficial file-size reductions.
