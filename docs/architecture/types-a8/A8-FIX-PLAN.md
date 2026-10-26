# A8 — Fix Plan (prioritized)

- **Critical: none confirmed.** Existing G4 type modules and public contract checkers pass.
- **High: future DTO unification must preserve serialized behavior.** Before changing a backend/local DTO or a shared public type, add compatibility fixtures for required/optional/nullable fields and date/ID serialization on both backend and BFF. Avoid dynamic merging of public type names.
- **Medium: review product versus pharmacy review response types.** Both shapes match at present but have distinct domain ownership. Keep separate until contract differences and downstream consumers are explicitly checked.
- **Medium: retain immutable audit pins.** G4 source hashes and the 23 module locations are historical invariants; shared-type inventory changes need an explicit review and new A8 baseline, not an automatic count adjustment.
- **Low: optional readability cleanup.** Large DTO files can be split only if the stable import/export contract remains intact and no re-export-only compatibility proxy is introduced.

## Included immediate fix from A7

Remove the unused `relative` named import in `scripts/architecture/scripts/check-api-scripts-a7.mjs`. This fixes the VS Code ESLint warning without modifying its inspection logic. cSpell messages about `Unreviewed` are dictionary observations, not ESLint or runtime failures.
