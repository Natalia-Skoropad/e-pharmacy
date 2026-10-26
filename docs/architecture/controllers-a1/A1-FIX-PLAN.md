# A1 — Prioritized Fix Plan

**Completed (A1 safe patch):**

- [x] **Medium · D01:** use one canonical `Content-Disposition` filename formatter for six document endpoints, preserving per-endpoint cache/content-type/status.
- [x] Add unit parity tests, read-only static route/handler checks and guards against direct model access or reintroduced encoding duplicates.

**High · Security/response correctness (requires A2/A4 guard review):**

- [ ] For all 22 silent authentication returns in controllers, confirm `authenticate` and role/permission middleware are always earlier in each route. Prove invalid requests return an explicit HTTP error, not a hanging response.
- [ ] Confirm every pharmacy-sensitive mutation resolves membership **for the requested `pharmacyId`**, never by an implicit first pharmacy; add 0/1/N owner membership integration coverage.
- [ ] Verify Platform Owner permission semantics remain distinct from ordinary admin RBAC and there is no unexpected public route bypass.

**Medium · Scope-limited follow-ups:**

- [ ] Assess separate security headers for all six document downloads; retain current wire contract until tests agree.
- [ ] Consider a dedicated domain split of the three largest controller files after route-name, middleware-chain and BFF parity baselines; avoid empty proxies.
- [ ] Test response behavior when a session expires between middleware and service for `req.user?.id ?? ''` endpoints.

**Low · Ongoing maintenance:**

- [ ] Revisit private helper dead-code analysis with TypeScript-aware tooling after a future controller change; route identifier scan only certifies all 157 exported handler names are referenced.
- [ ] Keep the A1 static checker in the staged deployment Gate during the remaining A2–A9 audits; consolidate or remove stage-only tools in final Cleanup.
