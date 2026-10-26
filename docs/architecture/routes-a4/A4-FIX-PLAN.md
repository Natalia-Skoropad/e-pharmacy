# A4 — Fix plan

**Critical: none confirmed.** All 159 registrations and 13 mounts have intact handlers and no bypass in the 22 examined early-return chains.

**High (future guarded refactor)**

1. Preserve the new per-route access registry and negative tests whenever any route is changed, especially admin `requireAdminPermission` or ownership scope.
2. For the 22 defensive `return;` statements, add focused controller tests for the no-user branch, then change to an explicit 401 via the canonical error factory if useful. Do not blindly replace without demonstrating stable HTTP behavior and errors.

**Medium**

3. If `admin.routes.ts` continues growing, split it into canonical domain registration functions imported directly into one router (not proxy modules). First update old structural checks that read `admin.routes.ts` directly, and preserve the exact registration order, middleware chain and total 159 methods.
4. Consider adding explicit route behavioral tests to assert role-specific 401/403 cases for the two pharmacy aliases.

**Low**

5. Revisit only truly duplicated validation expressions on future A6 Schemas stage; route-specific application of validators is not redundant.

A4 includes no modifications to production route/controller/middleware modules because all identified structural invariants already hold. This is an intentional outcome of a security-focused audit, not a deferred incomplete code change.
