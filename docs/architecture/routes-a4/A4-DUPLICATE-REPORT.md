# A4 — Duplicate and collision report

| Candidate | Classification | Decision |
| --- | --- | --- |
| Mounting `pharmacyRoutes` under `/pharmacies` and `/pharmacy` | Intentional compatibility alias (31 registrations, 62 mounted endpoints) | **Keep**. Clients may rely on either prefix; pin both. |
| Same path with GET vs POST/PATCH/DELETE on cart, orders, reviews, documents | Different HTTP methods and semantics | **Keep**. Not duplicate registrations. |
| `setFavoriteProduct` and `setFavoritePharmacy` used by PUT and DELETE | Intentional shared toggle/unset handler per entity | **Keep**. Both methods are meaningful contract alternatives. |
| `authenticate` duplicated in individual route chains versus router-wide `.use` | Mostly different effective scopes | **Keep**. Do not merge unless effective guard chain parity is proven. |
| `requireAdminPermission` on 43 administrative registrations | Distinct resource.action permission instances | **Keep**. Centralize implementation in middleware, not the individual permission decisions. |
| Duplicate normalized HTTP method/path | Exact route registration conflict | **None found**. |
| Dynamic path before shadowed static path | Dangerous route ordering | **None found**. |

Avoid merging merely similar routes: client, pharmacy and administrator roles have intentionally different scopes; changing guard order can expose data or turn a 401 into a 403.
