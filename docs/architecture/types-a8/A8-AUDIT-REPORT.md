# A8 — Types: Audit Report

Source of truth: the user's latest `e-pharmacy-14-20-15.zip`, with A1–A7 already applied. This audit is read-only for production types and DTOs.

## Scope and counts

- `apps/api/src/types/`: **23 G4 canonical files** (23/23 present); **132 declarations**.
- `packages/types/src/`: **77 shared contract files** (77/77 present); **234 declarations**.
- **100 files**, **345 exported declarations**, **205 relative imports**, **124 type-tree import edges**, **0 missing imports**, **0 cycles**.
- No unexpected API type modules, legacy flat G4 files, or absent shared contract modules.
- Express `Request` augmentation remains in `infrastructure/express.ts` with `authSessionId`, `adminAuthorization`, and optional `user` context.
- Existing `check-types-public-api`, `check-types-unused-exports` and `check-type-contract-parity` all pass, including the 14 approved entrypoints and 53 intentionally public contracts.

## Audit method

The A8 checker parses TypeScript ASTs instead of inferring DTO structure from text-only regex. It validates the historical G4 inventory and immutable G6 canonical fingerprints, the reviewed current shared-package file registry, duplicate declarations, relative imports and local dependency cycles. It reports exactly matching object/interface shapes across type modules as candidates, never as automatically safe merges. The checker is strictly `--check` / read-only, including its mutation-oriented tests.

## Risks and boundaries

- Backend-local TypeScript types may depend on Mongoose or Zod; shared public contracts must remain framework-neutral and preserve serialized shapes. There is no basis to move backend-only types into `packages/types` merely because the names are alike.
- Public response DTOs are consumed by clients, pharmacy and admin apps and BFF routes. Before any refactor, test generated/serialized response parity, especially optionality, `null` vs `undefined`, ID types, and date representations.
- No production types or `packages/types` modules have been modified in A8.
