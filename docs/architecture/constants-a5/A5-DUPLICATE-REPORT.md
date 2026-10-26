# Stage A5 — Duplicate Report

A4 routes and the G1 constants inventory are unchanged. This report distinguishes exact text matches from accidental business-rule duplication; no similarity by itself authorizes merging.

| Candidate | Classification | Decision |
|---|---|---|
| `AUTH_APPLICATIONS` and `USER_ROLES` in `auth/auth.ts` (three identical string values) | **Intentional similarity** | Distinct concepts: application selection and authenticated actor roles. `packages/config` mirrors them as arrays and A5 pins parity. Do not merge the domains. |
| `CLIENT_ACCOUNT_STATUSES` and `ADMIN_ACCOUNT_STATUSES` in `auth/auth.ts` | **Intentional similarity** | Identical current values, but account-role lifecycles can diverge. Retain separate names and contracts. |
| `ADMIN_EMPLOYEE_DOCUMENT_RULES` and `PHARMACY_OWNER_DOCUMENT_RULES` | **Exact same structural definition**, distinct domain | Candidate for a shared `documentUploadLimits` policy, but different ownership/access and validation messages require explicit runtime and consumer tests before extraction. No production change now. |
| `ADMIN_EMPLOYEE_DOCUMENT_RULES` and `PHARMACY_DOCUMENT_RULES` | **Exact same structural definition**, distinct domain | Same proposal; no merge until the upload/authorization and future policy-divergence contract is reviewed. |

**Excluded false positives:** identical small literal strings (`active`, `blocked`, `view`, `edit`, or common 0/1 limits) do not prove repeated business logic. Separate HTTP error families and request scopes must not be collapsed solely for DRY.

**No critical/high-priority duplicate bug confirmed.** Future extraction of document-limit constants is optional, not a prerequisite for A6. Keep their individual ownership semantics if a shared primitive is introduced.
