# A2 — Duplicate analysis

| Candidate | Classification | Decision | Reason |
|---|---|---|---|
| Error forwarding in `authenticate` / `optionalAuthenticate` | Semantic similarity | **Keep for now** | No-token behavior differs; failure classes retain explicit lifecycle codes. A separate behavioral test matrix is required before extraction. |
| Cookie-value parsing between auth controller and auth middleware | Intentional similarity | **Do not merge** | Session refresh and authentication candidate order differ (reverse-and-retry vs token priority). An automatic shared cookie parser could change security behavior. |
| Guards for user role, admin permission and specific pharmacy capability | Intentional similarity | **Do not merge** | Different principals, scopes, access contracts, and error codes. Platform Owner is not regular admin permission. |
| Multiple rate-limit policy declarations | Intentional similarity | **Do not merge** | Their names, thresholds, identities, progressive delay, and success handling are independently significant. |
| Admin/pharmacy/auth controller handlers in three large files | Cohesion problem, not duplicate logic | **Split into direct canonical domain modules** | 80 handler bodies preserved, no extra facade or duplicate implementations. |

No independently verified functional duplicate was safe to delete in production middleware within A2 scope. The repeated patterns are recorded rather than collapsed indiscriminately.
