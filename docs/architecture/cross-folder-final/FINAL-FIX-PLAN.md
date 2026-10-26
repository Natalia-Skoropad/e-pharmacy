# Cross-folder Final — prioritized follow-up / cleanup plan

**P0 / immediate:** No confirmed critical cross-folder failure. Keep the new final check and nine regression test suites in the staged deployment gate. Before merging, locally run `pnpm check:architecture:final`, which runs final checks, all A1–A9 tests, architecture-layout tests and the full 30-command G6 Gate. Run `git diff --check` and inspect the staged changes.

**P1 / next behavior-preserving changes (separately scoped):**

1. Add wider parity/property-based cases for `buildPublicEntitySlugId` and `getWorkingHoursValidationIssue` (invalid ObjectIds, Unicode, missing/duplicated weekday, minute and boundary permutations). Repoint consumers to one public owner only after testing behavior, package exports and build; obtain explicit G5/G6 source-fingerprint approval. Do not leave forwarding wrappers.
2. Exercise 401/403 and forbidden pharmacy membership paths for the 22 controller no-user branches using real Express middleware chains; A4 static matching alone cannot prove response semantics.
3. Strengthen backup/rehearsal and database URI guards for destructive `seed.ts`, index-changing domain migrations, and historical demo-owner imports. Never run them as an audit step.
4. Validate owner/document transactions and idempotency against real MongoDB test transactions with 0/1/N pharmacies, partial failure rollback, role/owner/manager combinations and retries.

**P2 / maintenance:**

5. Once the committed final gate has passed and deployment is stable, propose *separate* deletion-only cleanup of historical relocation tools. First inventory every reference in `package.json`, CI, docs and contract scripts; retain G6 history and pinned manifests until a replacement accepted contract gate exists.
6. Preserve A3 model files unless a concrete maintenance issue warrants moving nested schemas; first pin runtime schema/index/hook snapshots.
7. Add new audit modules only to the canonical logical `scripts/architecture/` subgroup; no flat proxy files or unused exports.

**Out of scope in this ZIP:** No production route/auth/model/validation rewrites, no migrations, no changes to immutable historical baseline artifacts, no deletion of old tests.
