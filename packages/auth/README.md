# `@e-pharmacy/auth`

Frontend authentication primitives shared by the client and pharmacy Next.js applications.

## Refresh ownership

The Next.js BFF is the only token-refresh owner. A private BFF request may handle one backend `401` by refreshing the session and retrying the original request once. `AuthProviderCore` never calls `/refresh` directly and does not run a periodic refresh interval. It only revalidates the current user through `/me`.

Both applications revalidate `/me` when a visible document regains focus or visibility. This detects login, logout, blocking, and session revocation that happened in another application origin without creating background refresh traffic.

## Session synchronization

React context is the source of truth for the current component tree. `BroadcastChannel` is a same-origin optimization and carries only these non-sensitive events:

- `authenticated`;
- `unauthenticated`;
- `revalidate`.

Events never contain a user object, email address, token, or profile data. `BroadcastChannel` does not work between `localhost:3000` and `localhost:3002`, nor between different production subdomains. Cross-origin consistency comes from shared server session state plus `/me` revalidation on application open, focus, and visibility.

After a profile update, the current tab reloads `/me` and publishes `revalidate` to same-origin tabs. Password changes and resets clear BFF cookies, invalidate the provider, and publish `unauthenticated`.

Logout uses the refresh-token identity to revoke the device session when possible. The BFF always clears browser auth cookies, including when the backend is temporarily unavailable, so local logout UX is deterministic.

## Redirects

- `getSafeLocalRedirectPath` accepts only normalized current-origin paths.
- `getSafeApplicationRedirectPath` additionally restricts paths to application route roots.
- `getTrustedExternalRedirectUrl` requires an explicit origin allowlist and optional path-root allowlist.

Dot segments, encoded traversal, encoded controls, protocol-relative URLs, backslashes, invalid percent encoding, credentials, and untrusted origins are rejected. Next guards do not treat arbitrary `http://` or `https://` strings as trusted; applications provide an external redirect resolver.

## Errors

Structured auth error codes are the primary contract. Session memory and cookies are invalidated only for `AUTH_SESSION_INVALID`, `AUTH_SESSION_REVOKED`, and `AUTH_USER_BLOCKED`. Generic `403`, forbidden-origin, CSRF, and role errors do not automatically log the user out. Exact legacy copy mapping exists only as a temporary compatibility fallback.

## Unavailable state

Private application guards render a recoverable unavailable state with `retryAuthBootstrap`. Guest routes must explicitly decide whether auth forms remain available during an authentication-service outage.

## Public entrypoints

The package intentionally has no root export. The React and Next entrypoints are flat source files (`src/react.ts` and `src/next.ts`), not empty feature folders. Use only:

- `@e-pharmacy/auth/react` for `AuthProviderCore`, `useAuth`, and stable provider/context types;
- `@e-pharmacy/auth/next` for Next.js guards;
- `@e-pharmacy/auth/errors` for semantic error classification;
- `@e-pharmacy/auth/routing` for pure redirect validation.

Session synchronization, cookie-hint parsing, request management, and state-transition helpers are internal implementation details. React-only consumers do not resolve Next.js guard modules, so the optional Next peer applies only to the Next-specific entrypoint.

## Application adapters and view models

Client and pharmacy `AuthProvider` wrappers remain application adapters because they bind real BFF services and policy. They must not contain fake capabilities or no-op re-exports.

`useClientAuthCapabilities` exposes a minimal client-specific projection:

- `isActiveClient`;
- `isActivePharmacyUser`;
- `canUseClientFeatures`;
- `canOpenPharmacyCabinet`;
- the small set of lifecycle fields required by client features.

It does not spread the entire shared auth context or expose login/logout actions to unrelated feature hooks. The public context also avoids the ambiguous `isAuthReady` alias; consumers use `isBootstrapping`, `isUnavailable`, or the explicit render selectors.

The public header and mobile menu consume one discriminated view model with loading, unavailable, guest, authenticated-client, authenticated-pharmacy, and authenticated-other modes. Unavailable state never doubles as guest state and exposes a real retry action.

## Runtime response validation

Browser auth adapters validate every `AuthResponse` through `@e-pharmacy/validation/auth` before returning it to the provider. The parser verifies required fields, roles, statuses, and optional string fields, then creates a new allowlisted user object. Unknown properties such as token fields are discarded.

Malformed responses throw `InvalidAuthResponseError` with the stable `AUTH_INVALID_RESPONSE` code and cannot create an authenticated React state.

## Tests and automated checks

Package commands:

```bash
pnpm --filter @e-pharmacy/auth lint
pnpm --filter @e-pharmacy/auth type-check
pnpm --filter @e-pharmacy/auth test
pnpm --filter @e-pharmacy/auth test:react
pnpm --filter @e-pharmacy/auth test:integration
pnpm --filter @e-pharmacy/auth build
pnpm --filter @e-pharmacy/auth check:boundaries
pnpm --filter @e-pharmacy/auth check:public-api
pnpm --filter @e-pharmacy/auth check:lifecycle
pnpm --filter @e-pharmacy/auth check:contracts
```

Repository checks enforce:

- frontend/backend dependency boundaries;
- the exact explicit public API;
- abortable lifecycle services and the absence of global pending-request caches;
- explicit bootstrap capabilities and unavailable recovery;
- frontend/backend values, cookie names, user/session shapes, error codes, token-expiry metadata, and password invalidation contracts.

Source-reading tests are not part of the package test suite. Repository checks own static architectural invariants, while request-manager, timeout, state-transition, redirect, session-sync, guard-decision, client view-model, and runtime-parser tests verify behavior directly.

## Build policy

`@e-pharmacy/auth` remains a source workspace package. Applications transpile its `src` entrypoints. The package `build` command emits declarations to `dist` only as verification output; public exports continue to reference source files.

`sideEffects: false` is safe because public entrypoints do not register global listeners or mutate browser state during module evaluation. Browser listeners are created and cleaned up only inside provider lifecycles.

## Repository hygiene

The working archive may contain local `node_modules`, `.turbo`, `.next`, `dist`, and TypeScript build-info files. These are not source artifacts and must not be included in review or deployment source packages.

Create and verify a clean source tree with:

```bash
pnpm archive:source
pnpm check:archive-hygiene
```

## Admin integration

A future admin application should create a thin provider wrapper with its real BFF services, `bootstrapMode`, focus policy, trusted application origins, and only the interactive capabilities it actually supports. It must not copy provider lifecycle logic, add fake login methods, expose tokens, or import internal session modules.
