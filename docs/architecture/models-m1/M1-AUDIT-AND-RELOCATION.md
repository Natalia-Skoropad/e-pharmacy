# E-pharmacy — Stage M1: audit, canonical domains and safe model relocation

**Source:** user-provided `e-pharmacy-14-20(1).zip`, 23 October 2026.
**Scope:** `apps/api/src/models` and direct dependencies in `apps/`, `packages/`, `scripts/`.
**Approach:** staged analysis M1.1/M1.2, then *path-only* relocation M1.3, conservative duplication triage M1.4 and code-level regression gate M1.5. No database changes or migrations.

## M1.1 — Inventory and dependency audit

The baseline has **27 Mongoose models and 3 tests**, all originally flat under `apps/api/src/models`. Their canonical locations, pre-move SHA-256, import-normalized SHA-256, source LOC, exports, Mongoose model names, `ref` relationships, and direct importers are recorded **per file** in `model-inventory.json`. `model-relocation-map.json` contains the complete 30/30 source-to-target list.

- **41** `new Schema` declarations, including order and pharmacy snapshot/subschemas.
- **91** explicit `.index(...)` declarations. Inline `unique`, field-level indexes, TTL values, index names, partial filters, `ref`, middleware and collection/model names remain preserved by the full canonical source fingerprint.
- **338** static relative model import occurrences from **122** distinct files in the pre-move archive. The most imported models are `User` (74 files), `Pharmacy` (61), `Order` (31), `Product` and `ProductOffer` (26 each).
- No direct model-to-model imports among 27 production models. Model-validation tests intentionally import models from several domains.
- No safe whole-file duplicates found; no existing legacy re-export proxy files were needed or retained.

Model inventory counts refer to this archive, not to the historical S0 service inventory. `README-2.md` was referenced in the request but is **not present in this supplied archive**; examined the available `README-0.md`, `README-1.md`, service refactoring audit, S0/S1 architecture documents and `docs/legacy-auth-cookie-sunset.md`.

## M1.2–M1.3 — Canonical structure and applied moves

Source filenames and exported names are unchanged. The destination is selected according to the model's data lifecycle rather than solely the owner of the consuming service.

| Canonical subdirectory | Files | Scope |
|---|---:|---|
| `__tests__/` | 1 | `model-validation.contract.test.ts` |
| `accounts/` | 2 | `session.model.ts`, `user.model.ts` |
| `admin/access/` | 2 | `adminAccess.model.ts`, `adminAuthorizationState.model.ts` |
| `admin/comments/` | 2 | `pharmacyAdminComment.model.ts`, `pharmacyOwnerAdminComment.model.ts` |
| `admin/employees/` | 2 | `adminEmployeeDocument.model.ts`, `adminEmployeePrivateNote.model.ts` |
| `audit/` | 1 | `adminAuditLog.model.ts` |
| `cart/` | 1 | `cart.model.ts` |
| `catalog/` | 4 | `product.model.ts`, `productCategory.model.test.ts`, `productCategory.model.ts`, `productRequest.model.ts` |
| `clients/` | 1 | `client.model.ts` |
| `infrastructure/` | 1 | `rateLimitBucket.model.ts` |
| `inventory/` | 2 | `productOffer.model.ts`, `stockMovement.model.ts` |
| `orders/` | 1 | `order.model.ts` |
| `owners/` | 3 | `pharmacyOwnerDocument.model.ts`, `pharmacyRegistrationUploadSession.model.ts`, `pharmacyUserPrivateNote.model.ts` |
| `pharmacies/` | 3 | `pharmacy.model.ts`, `pharmacyDocumentFile.model.ts`, `pharmacyNote.model.ts` |
| `reviews/` | 2 | `pharmacyReview.model.ts`, `productReview.model.ts` |
| `settings/` | 2 | `position.model.test.ts`, `position.model.ts` |

- `admin/comments` remains distinct from user-private notes, and `admin/access` remains distinct from ordinary account sessions.
- `owners/pharmacyOwnerDocument.model.ts` and `pharmacies/pharmacyDocumentFile.model.ts` are separate persisted entities; registration upload sessions belong to owner onboarding.
- `inventory/productOffer.model.ts` is the stock-bearing pharmacy-specific offer, while `catalog/product.model.ts` is product master data.
- `__tests__/model-validation.contract.test.ts` exercises more than one domain; single-domain model tests live alongside canonical models.

All **30** files were physically relocated and all known relative imports, source-file test references and split `path.join('models', 'file')` references were updated directly. Original flat paths have **no facades, re-exports or proxy files**. `M1-DELETE-PATHS.txt` lists exactly the 30 obsolete paths to delete via `git rm` after extraction.

## M1.4 — Duplicate/overlap triage

| Potential duplication | Why it looks similar | Decision | Risk |
|---|---|---|---|
| `pharmacyReview` vs `productReview` | Similar review schemas and status/index shape | **Retain both.** Distinct target `ref`, document collection, uniqueness scope and moderation histories | High |
| `pharmacyAdminComment` vs `pharmacyOwnerAdminComment` | Comment text, actor, client-request idempotence | **Retain both.** Pharmacy and pharmacy-owner admin notes have different entity linkage | High |
| `adminEmployeePrivateNote`, `pharmacyUserPrivateNote`, `pharmacyNote` | Similar private note, pagination and idempotency fields | **Retain.** Separate privacy/access boundaries; no cross-domain persistence mixin as part of a relocation | High |
| `adminEmployeeDocument`, `pharmacyOwnerDocument`, `pharmacyDocumentFile` | File metadata, ownership and validation | **Retain.** Different owners, retention and publication/attachment semantics; no merge | Critical |
| `Order` embedded pharmacy/client/product snapshots vs live `Pharmacy`, `Client`, `Product` | Repeated identity/location/product attributes | **Retain.** Immutable historical snapshots must not follow mutable source documents | Critical |
| `ProductRequest` vs `Product` | Repeated product attributes | **Retain.** Request moderation workflow differs from live catalog persistence | High |
| `ProductCategory` vs `Position` | Normalized dictionary names and uniqueness | **Retain.** Separate collection and validation/usage rules | Medium |
| Pharmacy owner indexes with overlapping prefixes | Possible B-tree index redundancy | **Defer.** Index changes need production query plans and separately approved migration; no `syncIndexes` or index drops in M1 | High |

No demonstrably redundant standalone model, schema or hook was safely removable **without** changing collection/validation/authorization semantics. Therefore M1.4 makes no semantic changes and tracks potential deduplication as future evidence-driven work rather than creating risky shared submodels.

## M1.5 — Architecture regression and execution record

| Gate | Observed result in this unpacked environment |
|---|---|
| `node scripts/architecture/check-models-m1.mjs` | **PASS:** 27 model definitions, 3 tests, 30 canonical files; 41 preserved Schema constructions, 91 explicit indexes, 338 canonical model references, 3,292 resolved TS/JS-relative imports, 0 invalid canonical fingerprints/old paths |
| `node --test scripts/architecture/check-models-m1.test.mjs` | **3/3 PASS** |
| `node scripts/architecture/relocate-services-s1.mjs --check` | **PASS:** 144/144 mapped historical service relocations, 3,292 verified relative imports |
| `node --test scripts/architecture/relocate-services-s1.test.mjs` | **1/1 PASS** |
| `scripts/checks/**/check-*.mjs` (80 checks) | **80/80 PASS.** TypeScript-dependent source checks ran with the globally installed TypeScript temporarily linked in the extracted working directory; no dependency symlink is part of the delivery. Exact script results in `source-check-results.json` |
| TypeScript parsing of changed `.ts`/`.tsx` | **168 files parsed, 0 syntax errors** using global TypeScript (syntax-only, *not* semantic type-check). See `syntax-check-results.json` |
| `pnpm check:source:*`, lint, type-check, test, React, Mongo integration and build | **NOT RUN after M1 in this environment** (no installed project dependencies/test Mongo DB). The user-reported baseline green Gate is **pre-refactor** evidence, not proof for these changes |

The architecture gate is included in the root package commands as `pnpm check:models-m1`, plus `pnpm test:models-m1`. `check:before-deploy` also runs `check:models-m1` before the pre-existing `check:services-s1`. The new checker is read-only and guards against stale models paths, proxy files, invalid direct references, accidental import cycles, altered model/schema contents and renamed/deleted models. Its full-source SHA parity after canonicalizing relocation-only relative imports is strong regression evidence that collection names, schema options, TTL/unique/partial indexes, hook behavior and transaction-boundary logic **inside the models** did not change.

**Important:** static parity is *not* a replacement for application execution. MongoDB was neither connected nor modified; no migrations, seed runs, `syncIndexes`, `drop` or collection writes were performed.

## Applying in the user's working branch

Start from exactly the user-supplied archive revision or rebase first if local changes have appeared since its export. Check that your working branch is clean and has a baseline commit. Extract the change-only ZIP into repository root, then remove obsolete flat model files using:

```bash
git rm --pathspec-from-file=docs/architecture/models-m1/M1-DELETE-PATHS.txt

pnpm check:models-m1
pnpm test:models-m1
pnpm check:services-s1
pnpm test:services-s1

pnpm check:source:api
pnpm check:source:shared
pnpm check:source:client
pnpm check:source:pharmacy
pnpm check:source:admin
pnpm check:lint:serial
pnpm check:type-check:serial
pnpm check:test:serial
pnpm check:react:serial
pnpm check:integration:serial
pnpm check:build:serial

git add -A
git diff --cached --check
git diff --cached --stat
```

**QA policy:** Do not mark M1 fully green or deploy until the listed post-change pnpm gates pass on the real local build/test environment and any Mongo integration tests run against an isolated test database. In particular, confirm transaction/session behavior, Owner-vs-Pharmacy document isolation, authorization on owner/manager scopes, expiration and unique indexes, account and admin review activity. No new database migration should be run for this path-only relocation.

## Risks, compatibility and follow-up

1. The model registration fallback (`models.X || model('X', schema)`) and collection naming are untouched. Relocation could still surface a previously hidden module-resolution assumption; the local type-check/build is the release Gate.
2. Dynamic runtime imports constructed from model filenames are not guaranteed to be found by static matching. The 80 source checks and literal-path scan cover current explicit references; rerun integration tests before release.
3. Mongoose TTL/index catalogs and existing persisted documents were not inspected against a live database. Code-equivalent schema fingerprints preserve declarations, not prove production DB index state. Any index remediation requires separate work.
4. No cookie-lifecycle policy changes: `apps/api/docs/legacy-auth-cookie-sunset.md` remains untouched, so legacy cookie retirement still requires the telemetry and observation gate specified there.
5. This deliverable intentionally **does not** refactor admin/private notes, cross-model duplicated field shapes, product snapshot logic or historical migration schemas; changing any would violate the requested path-only safety barrier without separately tested PRs.
