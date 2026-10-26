# Stage A3 — Models audit

Basis: the **latest user-supplied `e-pharmacy-14-20-11.zip`**, after verified A1/A2 and G6. This is a read-only audit: it does not modify MongoDB or any model implementation.

## Scope and confirmed invariants

| Item | Observed |
|---|---:|
| Mongoose model implementations | 27 |
| Existing model tests (M1 inventory) | 3 |
| Registered model names (unique) | 27 |
| `new Schema(...)` declarations | 41 |
| Explicit `.index(...)` declarations | 91 |
| Inline `index: true` declarations (additional, not part of the M1 91) | 54 |
| Static `ref` relations | 69 |
| Unresolved references | 0 |
| Identical explicit index keys on the same schema | 0 |
| Unexpected model files / obsolete M1 proxies | 0 |
| Intentionally mirrored review fields validated for exact parity | 8 |

There are no *explicit duplicate index calls with the same key object and owning schema*. The checker does **not** claim that equivalent indexes created implicitly from `index:true`, or redundant prefix indexes, are harmless to remove. These require MongoDB `getIndexes()`, query plans, data volumes and workload evidence.

All 27 registrations use distinct model identifiers. The audit checks static references, but does not infer ownership, cascade behavior, or foreign-key integrity from MongoDB, which has no relational foreign keys.

## Largest implementation files

| Canonical module | Source LOC | Area requiring separation |
|---|---:|---|
| `pharmacies/pharmacy.model.ts` | 654 | Verification documents, GeoJSON/location, bank details, indexes and main schema |
| `catalog/productRequest.model.ts` | 493 | File/image validators and embedded history, main Product Request schema |
| `orders/order.model.ts` | 381 | Immutable pharmacy/client/product snapshots, manager comments and histories |
| `accounts/user.model.ts` | 225 | Account identity and lifecycle constraints |
| `audit/adminAuditLog.model.ts` | 193 | Audit record shape, retention and query indexes |

A1/A2 controller decomposition could move whole handlers unchanged. Here moving `new Schema(...)` calls may change M1 source hashes and the locations/counts of 41 schema declarations. Without runtime schema-comparison tests, an automatic split would make M1 verification weaker. **No production models are altered in A3**; see `A3-FIX-PLAN.md` for controlled decomposition.

## Indexes, ownership and data contracts

- Review moderation uses **two distinct** partial-unique indexes: `(pharmacyId, userId)` and `(productId, userId)` for active statuses. Their index scopes are not interchangeable.
- Pharmacy creation has an owner-scoped unique request identifier with partial filter; order manager requests have pharmacy-scoped idempotency; these are independent invariants.
- Sessions, admin audit and document/upload sessions contain retention or expiry indexes with different lifecycles and must not be merged into a shared TTL abstraction.
- Owner-pharmacy membership is many-to-one / many-to-many through owner and manager references. No unique owner index should be added simply for normalization.
- No new collection, `ref` name, TTL, query index, default, validator or cast behavior is introduced by A3.

## Graph and scope limitations

The completed G6 gate separately checks unresolved relative imports and API import cycles. A3 validates registered model identifiers and static `ref` targets, which is a **different graph**. Runtime ref resolution, actual collection indexes and data migrations require the application's integration environment and are not claimed as exercised by the static checker.
