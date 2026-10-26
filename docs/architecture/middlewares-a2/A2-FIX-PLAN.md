# A2 — Fix plan and handoff

**Completed:** Fix A1-checker unused `SRC`; reduce three A1 controller monoliths via 13 new canonical modules; direct route imports; adapt path-based regression tests and A1 inventory; add strict A2 security/decomposition audit and 6 negative tests; maintain immutable G0–G6 source migration manifests.

| Priority | Follow-up | Owner stage | Decision |
|---|---|---|---|
| Critical | Authentication, trusted BFF boundary, admin permission and scoped pharmacy selection must stay fail-closed | A2 | Static guards verified; production middleware untouched |
| High | Prove every one of 22 silent controller identity returns has a complete route chain, including path-specific role/membership checks | **A4 Routes** | Defer response changes pending targeted route tests |
| Medium | Assess extraction of duplicate auth error forwarding with token absent/expired/blocked/revoked matrix | Later security refactor | No speculative code change |
| Medium | Consider decomposition of `rateLimit.middleware.ts` (>300 lines) after policy-level behavioral test coverage | Dedicated security refactor | Avoid mixing with already-large controller split |
| Low | Retire migration-only architecture scripts after A9 and final cross-folder gate | Cleanup | Do not delete G6 dependencies early |

Future A3–A9 stages should include justified decomposition of large modules in scope, preserving direct canonical imports and regression tests.
