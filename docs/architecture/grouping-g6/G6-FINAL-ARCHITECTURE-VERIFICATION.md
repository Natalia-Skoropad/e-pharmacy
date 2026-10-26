# G6 — Final API Architecture Verification

**Source snapshot:** `e-pharmacy-14-20-9.zip`, after G1–G5 and before the separate A1–A9 audits.

## Scope and rules

G6 is a **read-only architectural gate**, not another relocation. It must never call migrations, seeds, cleanup jobs, application startup, or change persistence. The original G0 inventory and G1–G5 manifests/fingerprints remain immutable. S1, M1, and C1–C6 remain the canonical historical relocation stages.

The source grouping covers 153 unique files:

| Stage | Total | Moved | Stable |
|---|---:|---:|---:|
| G1 constants | 35 | 35 | 0 |
| G2 schemas | 50 | 38 | 12 |
| G3 scripts | 14 | 14 | 0 |
| G4 types | 23 | 23 | 0 |
| G5 utils | 31 | 30 | 1 |
| **Total** | **153** | **140** | **13** |

`check:grouping-g6` checks the entire immutable G0 `from → to` map against the current tree; checks both raw and normalized SHA-256 for **all 153** resulting files; fails for omitted, extra, duplicate, old flat or proxy paths; resolves all static relative imports in apps/packages/scripts; checks API import cycles, legacy source-path literals, all 14 API script command targets, and Express augmentation. No new `index.ts` proxy or barrel is created.

**Coverage caveat:** static import regex checks cannot resolve arbitrary dynamically assembled runtime paths. Full TypeScript, tests, integration, build and deployment-archive gates are therefore mandatory and independent. The G0 import-cycle analysis concerns the **API source graph**; it is not proof that unrelated packages contain no circular runtime dependencies.

## Two reviewed post-G5 formatting changes

The latest user archive contains these two whitespace/line-wrapping changes compared with the isolated completed G5 tree:

- `apps/api/src/utils/email/passwordResetEmail.ts`: one blank line following the successful template access.
- `apps/api/src/utils/email/sendEmail.ts`: multiline formatting for expressions, and blank lines around returns/logging.

No import changes, condition changes, email-copy changes or new behavior were observed in the comparison. G5's original `source-fingerprints.json` is **not modified**. The two *exact* original and new raw/normalized hashes are recorded in `approved-g5-formatting.json`. G5's read-only checker and its test permit those two values only **after G5 has already been applied** and only if the original G5 canonical hashes still match the approved predecessor hashes. Any further edit remains an error.

The five historical grouping scanners exclude only the new, explicitly named G6 audit implementation/test/orchestrator files from their *frozen historical import counts*. G6 itself scans them and verifies their imports. This preserves the original count of **3,494** in G1–G5 and avoids weakening their checks or modifying G0.

## Commands from repository root

### 1. Dependency-free static check and unit tests

```bash
pnpm check:grouping-g6
pnpm test:grouping-g6
```

The new G6 tests exercise the successful read-only check and negative cases: wrong flags/write modes, missing relocated files, old-path proxies, extra paths, duplicate manifest entries, altered pin, altered map count and narrowly reviewed formatting exceptions.

### 2. All prior architecture checks and tests

```bash
pnpm check:grouping-g6:history
```

This executes G6 and G1–G5 checks/tests, M1, Services S1, and Transport C1–C6, stopping at the first failure. Each command is run directly via Node, without starting the database. The historical S0/G0 *pre-relocation* check is **not** expected to pass on this fully relocated tree and is deliberately not included.

### 3. Full repository acceptance gate

```bash
pnpm check:grouping-g6:full
```

This first repeats all 18 history commands, then runs in order:

```bash
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
pnpm check:deploy-artifact
```

A successful full Gate requires 30 commands to pass. The new read-only checker has also been placed near the beginning of `check:before-deploy:staged` so subsequent changes cannot silently resurrect old paths.

## Independent test result, 26 Oct 2026

The archive was unpacked without changing tracked application sources. The dependency-free verification passed: all 153 canonical files, **3,494** resolved relative imports, 0 unresolved imports, 0 API cycles, 0 obsolete literal source paths and 14 preserved script entrypoints. The G6 negative/positive unit tests pass. The complete 18-command history gate passes. API boundary, dynamic category and pharmacy location structural checks pass.

**The full lint/type-check/unit/integration/build/deploy suite was not executed in the isolated archive environment**, where workspace `node_modules`/`pnpm` are absent. It must pass in the user's local repository before G6 is called fully complete. Previous G5 pass logs do **not** replace a new G6 full-gate run.

## Follow-on work

After G6 is verified, execute A1–A9 as separate semantic audits for duplication, dead code, ownership boundaries and simplification. Do not treat two similar access-control functions as duplicates without checking their distinct role, tenant and pharmacy-ID constraints.
