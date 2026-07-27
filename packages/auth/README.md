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
