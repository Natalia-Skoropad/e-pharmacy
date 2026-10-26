# Stage A5 — Fix Plan

## Completed

- **High:** Guard API and shared auth/pharmacy domain values against drift, with negative tests.
- **High:** Preserve five seeded product categories; reject introducing `Other` as a database-backed category.
- **High:** Check error-code uniqueness, HTTP status uniqueness and admin permission matrix/registry parity.
- **High:** Preserve historical G6 hashes and run G0–G6 historical tests unchanged in scope.
- **Medium:** Split root `scripts/architecture` into seven logical directory groups, move 32 files, update call sites, add separate layout check and delete manifest. No proxy/forwarders.
- **Medium:** Approve precisely two new test-only relative ESM imports in G4/G5 historical tests, without editing original G0/G1/A1/A2 history.

## Deferred / justified non-changes

- **Medium:** Consider deduplicating document-upload rule objects **only after** runtime parity tests for validation, owners, employees, pharmacies and document access control. Current duplication is not a demonstrated defect.
- **Low:** Keep role-specific status constants and application/role sets separate despite identical present-day values; their domains can evolve independently.
- **Low:** Do not further split backend constants purely to reduce file length; G1 already established canonical domains.

No change to MongoDB schemas/indexes, route permissions, API messages, product category semantics, backend controllers, services or production constants is required by the A5 findings.
