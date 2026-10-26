# A9 — Fix Plan (separately reviewed changes)

**P0 — Security/authorization:** Preserve pharmacy ownership checks and explicit selected-pharmacy authorization. Inspect `utils/pharmacies/pharmacyAccess.ts` for a future relocation to its canonical service boundary only with behavioral tests for zero/one/multiple pharmacies, `ownerId` vs `managerUserIds`, denial paths, and permission errors. Do not remove the current `requirePharmacyCapability` call in an audit-only stage.

**P1 — Duplicate slug builder:** Add runtime parity and public API tests for both `buildPublicEntitySlugId` versions, including invalid IDs, Cyrillic, punctuation, empty slug, product/pharmacy prefixes and thrown errors. If equivalent, make consumers import a single canonical definition with an explicit approved manifest/fingerprint change. No proxy wrappers.

**P1 — Working hours:** Add a deterministic parity matrix for `getWorkingHoursValidationIssue` in API and shared validation across valid/bad formats and boundary times. Confirm error-code precedence and old imports before recommending the shared validator as the sole owner.

**P1 — Side effects:** Review `auth/jwt`, `auth/password`, `documents/documentUpload`, `email/sendEmail`, `email/passwordResetEmail`, `logging/logger` and other backend adapters for logging of secrets, file I/O at module load, error semantics, and tests. A9 rejects new unsafe shared-utils imports but cannot prove general purity.

**P2 — Final architecture gate:** After A1–A9 are all locally green, run cross-folder dependency/contract/security audit followed by full `check:grouping-g6:full`. Later remove unused temporary relocation scripts in a separate cleanup plan with a referenced-file and package-script check.

**In scope for current A9 ZIP:** Add read-only checker/tests/reports and fix unused A8 local declaration only. No API logic changes and no migrations.
