# A4 — Routes audit (2026-10-26)

## Source and scope

Baseline: `e-pharmacy-14-20-11.zip`, updated with the two successful A3 Windows fixes. Audited `apps/api/src/routes/`, its dependencies on controllers and middleware, and the existing Next/BFF source-contract checkers. No runtime handlers, request/response contracts, or routes were modified in A4.

## Inventory

- **12 route modules** plus `routes/index.ts` aggregator, with `apps/api/src/routes/**/*.test.ts` kept untouched.
- **13** top-level router mounts; **159** HTTP method registrations (Transport C1–C6 baseline).
- **190** effective mounted endpoints, because all 31 `pharmacyRoutes` registrations are exposed under both `/pharmacies` and intentional compatibility alias `/pharmacy`. They are not 31 newly added endpoints.
- **138** method registrations require `authenticate`, **21** do not; 43 have explicit `requireAdminPermission` in their effective chain. Some public auth endpoints independently require the trusted BFF marker/secret and/or rate limits.
- **22/22** pre-existing `if (!userId|adminUserId|user|req.user?.id) return;` branches occur in controller handlers routed behind `authenticate`. This includes inherited `router.use(authenticate)` in orders, notes and admin, not only local middleware. This proves that the branches are not reachable through these registered routes without passing auth; it does **not** mean a direct unit invocation can safely return without a response.
- **0** duplicate method/normalized path registrations, **0** dynamic-route precedence shadow cases, **0** controller exports missing direct route imports, **0** route access contract mismatches, **0** broken route-to-controller ownership links.
- Production never exposes `/auth/test/*` role-only debugging endpoints; they exist only inside `env.NODE_ENV !== 'production'`, with authentication and role checks.

## Trust and scope boundaries

- `adminRoutes.use(authenticate, authorizeRoles(USER_ROLES.ADMIN), resolveAdminAuthorization)` is applied before all 53 admin endpoints. Individual administration mutations retain scoped `requireAdminPermission(...)` calls. Platform Owner handling remains inside canonical authorization middleware, not inferred by this static checker.
- Cart routes require client RBAC at router level; pharmacy notes require pharmacy RBAC. Orders use mandatory authentication at router level; any additional service-side order permissions remain the service's responsibility.
- `POST /auth/register`, `/login`, `/refresh` must keep `requireTrustedAuthProxy` as the first route-level guard, and password reset routes keep rate-limiting middleware.
- No route relied on browser-visible UI gating for server access.
- Checked independent BFF parity checker (89 Next routes, 110 Next handlers), production BFF header/cookie contract checker, and backend boundary checker without modifications.

## Regressions now prevented

A4 AST checker builds effective guard chains with router-wide `.use(...)` and individual route middleware. A pinned registry records 190 reviewed endpoints with HTTP method, path, controller owner, authenticated state, role restrictions, admin permissions and test-only scope. An unreviewed route, reordering, dropped guard, lost permission, duplicate route or mistaken controller import fails closed. Fixtures are in-memory only; there are no temporary filesystem mutations or database writes.

## Decomposition decision

`admin/admin.routes.ts` is 716 lines, `pharmacies/pharmacy.routes.ts` 449 and `catalog/product.routes.ts` 272. Most lines are declarative route-specific validation and permission chains rather than business logic. Splitting admin routes now would require a complete, separately scoped compatibility update of several older source-checkers and might alter declaration order. No technical need was established in this audit, so no files were split merely to reduce line counts. Consider a dedicated route registration refactor only if new administration domains make current navigation or review difficult; preserve route and middleware order byte-for-byte where possible.

## Remaining limitations

A4 is a *structural* gate, not a substitute for full integration tests: handler/service authorization and Mongo transaction behavior are covered by the existing test suite. The 22 silent returns can be hardened to explicit unauthorized exceptions with dedicated controller behavioral tests, but doing so without those tests would go beyond the proven A4 no-behavior-change scope.
