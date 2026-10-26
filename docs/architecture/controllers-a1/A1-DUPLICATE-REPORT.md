# A1 — Duplicate Report

| ID | Locations | Category | Decision |
|---|---|---|---|
| D01 | `admin/admin.controller.ts`, `admin/admin-employee.controller.ts`, `owners/pharmacy-owner-document.controller.ts`, `pharmacies/pharmacy.controller.ts` | **Exact/semantic duplicate**: `encodeURIComponent(name).replace(/[!'()*]/g, ...)` repeated for six `Content-Disposition: attachment; filename*=` headers | **Deduplicated.** Single formatter in `controllers/shared/document-attachment.ts`. Previous UTF-8 output for ASCII, punctuation, spaces, Unicode and CR/LF is tested exactly. |
| D02 | Admin employee private notes vs pharmacy user private notes vs pharmacy notes | **Intentional similarity**: list/create/delete controller patterns | **Keep separate** because actor scope, audit requirements and persistence ownership differ. Do not merge simply because response shapes are similar. |
| D03 | Admin pharmacy comments vs pharmacy owner admin comments | **Intentional similarity pending contract review**: similar CRUD wrappers | **Keep separate** because entity scope and access permissions differ; service-level duplication belongs in a separate cross-domain audit. |
| D04 | `sendSuccessResponse` wrappers across controllers | **Intentional similarity**: thin HTTP adapters with different DTOs/status codes/cache policies | **Keep separate**; this is the controller pattern, not dead code. |

Only D01 is supported as a proven, behavior-preserving code merge in A1. Similarities D02–D04 are not claims of duplicate business logic.
