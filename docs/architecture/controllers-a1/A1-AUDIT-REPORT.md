# Stage A1 — Controllers: Architecture & Behavior Audit

## Source and scope

- Baseline: last full archive `e-pharmacy-14-20-9.zip`, overlaid with the approved G6 changed-files patch. **The base archive predates the local G6 application**; this explicit overlay prevents losing G6 scripts and documentation.
- Governing plan: `apps/api/README-3.md`, Phase A, A1 (`controllers`): thin adapters, direct service delegation, duplicate elimination, contract preservation.
- Scope: `apps/api/src/controllers/**/*.controller.ts` and associated tests. Middleware, routes, services and models are inspected as **dependencies only**, not refactored in A1.
- Controller implementation inventory: **16 files**; **157 exported HTTP handlers** all named in route sources; one pre-existing contract test in the controller folder. A1 adds one shared module plus one unit test.
- **0 direct Mongo/Mongoose imports or transactions** in controllers; prior G6 verifies **0 cycles** in the API import graph.

## Controller inventory (after the A1 patch)

| Controller | Lines | Exported handlers |
|---|---:|---:|
| `admin/admin-audit.controller.ts` | 72 | 3 |
| `admin/admin-employee.controller.ts` | 275 | 9 |
| `admin/admin-settings.controller.ts` | 198 | 8 |
| `admin/admin.controller.ts` | 780 | 33 |
| `auth/auth.controller.ts` | 466 | 17 |
| `cart/cart.controller.ts` | 98 | 6 |
| `catalog/product-category.controller.ts` | 18 | 1 |
| `catalog/product-request.controller.ts` | 127 | 7 |
| `catalog/product.controller.ts` | 307 | 17 |
| `clients/client.controller.ts` | 61 | 3 |
| `health/health.controller.ts` | 42 | 2 |
| `orders/order.controller.ts` | 228 | 10 |
| `owners/pharmacy-owner-document.controller.ts` | 134 | 5 |
| `owners/pharmacy-user-private-note.controller.ts` | 89 | 3 |
| `pharmacies/pharmacy-note.controller.ts` | 87 | 3 |
| `pharmacies/pharmacy.controller.ts` | 549 | 30 |

Line counts exclude other A1 artifacts and count the final newline consistently with the checker.

## Architecture findings

| ID | Evidence | Classification | Priority | Resolution |
|---|---|---|---|---|
| A1-D01 | Four controllers had repeated RFC 5987 `Content-Disposition` filename encoding; six download endpoints, including two admin endpoints with the encoder inlined | **Confirmed semantic/exact duplicate** | Medium | **Fixed** with `controllers/shared/document-attachment.ts`, with exact-value parity tests |
| A1-R01 | **22 silent `return;` branches** after missing `req.user`/user ID in admin, auth, orders and pharmacy note controllers | Authorization/response lifecycle review required | High (conditional) | **Not changed:** audit actual route guards, verify unauthenticated requests fail closed and never hang; coordinate with A2/A4 |
| A1-R02 | `admin/admin.controller.ts` **780** lines / 33 handlers; `pharmacies/pharmacy.controller.ts` **549** lines / 30 handlers; `auth/auth.controller.ts` **466** lines / 17 handlers | Large adapters, but domain responsibilities already delegated | Medium | Consider splitting after route contract snapshots, not in same patch as duplicate removal |
| A1-R03 | Document download endpoints have different header combinations (`nosniff` is explicit for admin pharmacy document) | Potential header-policy inconsistency | Medium | Verify all download endpoints and shared BFF behavior before standardizing headers; no changes here |
| A1-R04 | Public route handlers sometimes pass `req.user?.id ?? ''` into services | Expected service access handling may depend on route auth or domain policy | Medium | Add integration tests for guest/invalid/session-expired access before altering defaults |

## Controller responsibility review

- All 157 exported functions have identifier references in the route source tree (static verification only; it does **not** prove that every endpoint has the correct middleware chain or HTTP method).
- Controllers use typed `ValidatedResponse` for validated input and forward work to service modules; no direct model persistence imports found.
- Admin authorization, role, and per-pharmacy membership decisions **remain on the server**, with middleware and service enforcement retained. This audit did not bypass or rewrite any guard.
- Admin Platform Owner vs regular permission semantics require the separate A2 review; do not collapse them into a shared blanket check.
- We observed no evidence to justify merging owner private notes, pharmacy notes, or admin comments. They have distinct ownership/privacy/audit requirements.

## Change boundary

1. Added one pure helper for document filename response headers under `controllers/shared` (not a proxy/barrel).
2. Replaced six identical header expressions in four controllers.
3. Added focused regression tests and read-only A1 architecture checker.
4. Approved six new relative imports with a strict import-delta manifest; historical G4/G5 fingerprint baselines remain untouched.
5. No changes to service calls, validation, route declarations, response codes, audit payloads, document streaming, database schemas, or permissions.

## Limitations

Static route-identifier presence is narrower than execution-level authorization assurance, and grep-based duplicate detection is not a proof that semantic duplicates do not exist. Runtime auth behavior, query access boundaries and dependency-level tests must be verified in the full local Gate. A1-D01 is a confirmed safe fix; other flagged items are findings, not claimed fixes.
