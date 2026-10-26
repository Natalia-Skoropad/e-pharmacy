# A8 — Type Duplicate Report

## Exact structural candidates (1)

- `apps/api/src/types/catalog/product.ts:ProductReviewResponseDto`
- `apps/api/src/types/pharmacies/pharmacy.ts:PharmacyReviewResponseDto`

The exported object/interface field declarations have matching normalized signatures. **Classification: intentional structural similarity pending domain review**, not an actionable proven duplicate. Product and pharmacy reviews refer to different entities, routes, moderation contexts, and potentially independently evolving API contracts. Combining them without explicit runtime/response parity tests would increase coupling.

## Related public type contracts

`packages/types` contains shared DTO types consumed by apps and BFF routes. Their barrel exports are intended public API surfaces, not automatically redundant proxy modules. The existing public API and dead-export checkers pass; this audit does not weaken their intentional-public allowlist or rename exports.

## Decision

Do not merge types, rename DTOs, or introduce forwarding barrels in A8. Create an explicit shared primitive only if a future semantic diff confirms truly identical domain invariants **and** all consumers remain compatible. A similarity warning is not a release blocker.
