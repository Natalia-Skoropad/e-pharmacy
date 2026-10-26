# Stage A2 — Middlewares audit + approved controller decomposition

Source of truth: user-supplied `e-pharmacy-14-20-10.zip`, **not** an earlier project archive. This report covers the exact checked tree and does not assert that local pnpm build/integration tests were run in the isolated environment.

## Scope

- `apps/api/src/middlewares`: **12 production middleware modules**, five colocated tests; domain groups `auth`, `admin`, `http`, `security`, `pharmacies`.
- Controller follow-up requested by the owner: three largest A1 controllers, preserved **80 handlers** with exact source fingerprints and direct route imports.
- All **157 routed handler exports** remain in 29 domain controller implementation files after split. Existing authorization/session services, status codes, HTTP response shapes, cookies, audit logging, and business logic not modified.
- Changes to `routes`: **imports only**. Method registrations and middleware calls stay unchanged.

## Large-file decomposition

| Original controller | Source lines | Current lines | New domain modules |
|---|---:|---:|---:|
| `admin/admin.controller.ts` | 779 | 181 | 6 |
| `pharmacies/pharmacy.controller.ts` | 548 | 255 | 3 |
| `auth/auth.controller.ts` | 465 | 214 | 4 |

New modules (real handlers, **no re-export proxy**):

| File | Lines |
|---|---:|
| `admin/admin-pharmacy-read.controller.ts` | 137 |
| `admin/admin-pharmacy-comments.controller.ts` | 85 |
| `admin/admin-owner-read.controller.ts` | 121 |
| `admin/admin-activity.controller.ts` | 75 |
| `admin/admin-owner-documents.controller.ts` | 53 |
| `admin/admin-owner-comments.controller.ts` | 95 |
| `pharmacies/pharmacy-registry.controller.ts` | 71 |
| `pharmacies/pharmacy-public.controller.ts` | 117 |
| `pharmacies/pharmacy-reviews.controller.ts` | 80 |
| `auth/auth-documents.controller.ts` | 38 |
| `auth/auth-password.controller.ts` | 69 |
| `auth/auth-profile.controller.ts` | 87 |
| `auth/auth-session-management.controller.ts` | 51 |

The 80 function bodies are byte-identical after relocation (excluding trailing separator comments), guarded by `controller-decomposition.json`. Their import declarations are reduced to what each module needs. The original three controller files still implement their own domain handlers.

## Middleware contract findings

1. **Authentication**: current access-cookie tokens continue to be tried before the legacy fallback; an invalid presented token remains an error in `optionalAuthenticate` (absence of token is a separate state). Session validation still precedes assigning `req.user`.
2. **BFF trust boundary**: `requireTrustedAuthProxy` requires both marker and secret. No development-mode bypass was introduced.
3. **Admin RBAC**: unknown permission names fail closed; resolved admin access uses `hasAdminPermission`, which retains Platform Owner versus delegated permission distinctions inside its evaluator.
4. **Pharmacy access**: selection is `AsyncLocalStorage` request-local; selected identifier is syntax-checked. Actual membership is authorized in domain services; selection header is **not** proof of access.
5. **Rate limiting**: rate-limit definitions remain unchanged. Separate policies, account/IP dimensions, successful-response decrements, distributed counters and progressive delays were not merged.
6. **A1 follow-up**: 22 controller sites have an early return when identity is missing. The A2 static gate does **not** prove all route chains; the full middleware/route pairing should be audited at A4 before changing response behavior.

## Constraints

No ORM writes, migrations, seed commands, proxy/barrel creation, new public API endpoints, method/path changes, or weakened permission checks.
