# Stage A3 — Prioritized fix / decomposition plan

## Critical

No confirmed production defect from this audit. Do not alter collections, indexes or validators on the strength of source-text resemblance.

## High — controlled model decomposition (follow-up before schema changes)

1. **Pharmacy (654 LOC):** Extract location/GeoJSON schema and verification document schema, keeping the `Pharmacy` registration owner and its 12 explicit index registrations in the canonical implementation. First add runtime parity tests covering nested paths, required/default/trim values, validation errors, all indexes and collection names.
2. **Product Request (493 LOC):** Extract the attachment/image schema factory and status history into domain-owned implementations. Compare file MIME, data URL byte calculations, validation messaging and `requireDataUrl` behavior for both variants, including invalid payloads.
3. **Order (381 LOC):** Separate immutable location/client/pharmacy/product snapshot specifications and item/status/activity history. Guard legacy `city/address` snapshot compatibility, idempotency, snapshot omission/default semantics and calculations.

**Gate for each extraction:** introduce a separate A3.x migration plan and exact before/after compiled Mongoose parity tests, retain the original 27 model registration owners / collection names, and update M1/A3 inventory in a controlled, documented expansion rather than weakening immutable M1 checks. The existing 41 schema declarations may move to new source files, but total runtime graph must remain unchanged. No proxy re-export files.

## Medium

4. Review models: an optional canonical factory for the eight verified identical fields, only after validation parity and error-message behavior are tested against the two registered models. Keep two distinct partial-unique indexes and model names.
5. Analyze **possibly redundant implicit vs explicit indexes** against MongoDB `getIndexes()` and real query plans. Never drop an index solely because one shares a compound-prefix key.

## Low / maintenance

6. Review Mongoose deprecated `new` query option warnings separately from this schema audit. No automatic changes in A3.
7. After all A-stage audits, remove no-longer-used relocation scripts in the previously agreed controlled cleanup phase.

## Applied safely in this A3 delivery

- New read-only AST model checker and nine negative/positive tests.
- Verify every registration, ref and explicit index; enforce review field parity, idempotency and retention guardrails.
- No production code changes, persistence migrations, collection writes or historical fingerprint baseline updates.
