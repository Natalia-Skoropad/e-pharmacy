# @e-pharmacy/next-api

Shared Next.js transport infrastructure for the client, pharmacy, and future admin applications.

## Runtime policy

- Next.js App Router.
- Node.js runtime only for `server` and `proxy` entrypoints.
- The package is a private workspace source package; applications transpile its TypeScript sources.
- Browser code may import only `@e-pharmacy/next-api/browser`.
- Route handlers may import only `@e-pharmacy/next-api/proxy`.
- Server components and metadata routes may import `@e-pharmacy/next-api/server` for public backend reads.

Edge route handlers are not supported because the proxy layer depends on Node/Next server APIs.

## Public API

```ts
import { localApiRequest } from '@e-pharmacy/next-api/browser';
import { localAuthApiRoutes } from '@e-pharmacy/next-api/contracts';

import {
  createTrustedBackendApiUrl,
  publicBackendApiRequest,
} from '@e-pharmacy/next-api/server';

import {
  createAuthProxyRoute,
  createOptionalAuthGetProxyRoute,
  createPrivateProxyRoute,
  createPublicGetPrivatePostProxyRoute,
  createPublicGetProxyRoute,
} from '@e-pharmacy/next-api/proxy';
```

`@e-pharmacy/next-api/contracts` owns only shared same-origin Next.js auth routes. Canonical backend routes remain in `@e-pharmacy/api-client/contracts`; all other `/api/*` paths remain app-local in client, pharmacy, or future admin.

Low-level proxy executors, cookie functions, headers, environment parsing, logging, and request-body helpers are internal.

## Browser contract

`localApiRequest` accepts only relative same-origin paths under `/api/`. Absolute URLs, protocol-relative URLs, and non-BFF paths are rejected.

Mutation requests automatically receive the BFF CSRF header. GET requests may be retried according to the shared API-client retry policy; mutations are not retried automatically.

## Server contract

`publicBackendApiRequest` is for public server-side reads. It does not read the current user's cookies and does not perform auth refresh.

`createTrustedBackendApiUrl` accepts only a relative backend path beginning with one `/`. Absolute URLs, protocol-relative URLs, control characters, path traversal, and origin changes are rejected. The shared `apiRequest` primitive also requires a relative path plus an explicit `baseUrl`, so callers cannot accidentally turn a future transport wrapper into an open proxy.

Caller cancellation and request timeout remain active together through a combined `AbortSignal`; providing a caller signal does not disable the timeout.

Authenticated server-side reads require a separate explicit design and must not be added to the public helper implicitly.

## Proxy access modes

- `public`: no cookies; route-specific cache policy.
- `optional`: access/legacy cookies only; an explicit `strict`, `public-fallback`, or `refresh-aware` policy.
- `private`: access/legacy cookies only; one refresh attempt only for the stable `AUTH_SESSION_INVALID` lifecycle code. Business `401` responses are never replayed just because of their HTTP status.
- `auth`: explicit cookie mode per route. Login/register/password reset forward no auth cookies, logout uses access cookies, refresh uses only the refresh cookie.

Unrelated browser cookies and refresh cookies are never forwarded to ordinary business endpoints.

## Auth lifecycle

```text
login/register
→ backend validates credentials
→ trusted BFF response includes access + refresh tokens
→ BFF runtime-validates tokens
→ tokens are removed from the browser response body
→ BFF writes httpOnly cookies
```

A successful auth response without valid tokens is converted to `502 INVALID_BACKEND_RESPONSE`; partial login success is forbidden.

```text
private request AUTH_SESSION_INVALID
→ refresh-only backend request
→ single-flight refresh per refresh token
→ runtime token validation
→ retry with new access token only
→ update browser cookies
```

Stable invalidating lifecycle codes such as `AUTH_SESSION_REVOKED` and `AUTH_USER_BLOCKED` clear browser auth cookies without replay. Timeout, network, and backend 5xx refresh failures do not clear the session automatically.

Optional product/pharmacy detail reads use `refresh-aware`. A presented but invalid/expired access token is surfaced by backend optional auth as `AUTH_SESSION_INVALID`; the BFF then attempts the same single-flight refresh and retries the detail read. If the access cookie is missing but a refresh cookie exists, `refresh-aware` pre-refreshes before the first personalized read. Invalid refresh credentials clear cookies and fall back to anonymous public data; a temporary refresh outage preserves cookies and falls back to public data.

Logout is local fail-closed: browser auth cookies are cleared even when the backend revoke request is temporarily unavailable. In that case the server-side session may remain active until expiry or a later successful logout-all request.

The generic session revoke route is for other devices only. The backend rejects revocation of the current session with `409`; the current session must use the logout flow so BFF cookies are cleared consistently.

## Request body and document policy

The generic mutation proxy is text-based and supports:

- `application/json` and `+json`;
- `text/plain`;
- `application/x-www-form-urlencoded`.

Multipart and binary request bodies return `415`. Actual byte length is checked even when `Content-Length` is missing or misleading.

Semantic request-body presets are used instead of one global practical allowance:

- `smallJson`: 64 KiB for auth/session payloads;
- `standardJson`: 1 MiB for normal business mutations;
- `documentUpload`: 32 MiB only for the existing base64 document/attachment upload contracts.

Document transfers have a dedicated 30-second transport timeout rather than inheriting login/private-request timing. Private pharmacy document **downloads** use a dedicated binary route factory and return the upstream MIME body directly with `no-store`; they do not pass through JSON/base64 response parsing.

## Retry and query ownership

Browser → same-origin BFF requests do not retry by default. Public BFF → backend reads own the bounded transient retry policy (`502/503/504`, two attempts); direct public SSR readers reuse that same transport preset. `429` is not retried without an explicit bounded `Retry-After` policy.

Forwarded query strings keep their supported semantics but are bounded before backend fetch: encoded query length, parameter count (including duplicates), and combined backend URL length all have practical limits. Public backend schemas reject unsupported query keys, and no-query dictionary routes validate an explicitly empty query object so ignored parameters cannot create unbounded CDN cache variants.

## Security

- Mutations require the generated CSRF header and reject cross-site `Sec-Fetch-Site` or mismatched Origin/Referer values.
- Dynamic params are parsed as Mongo-style entity IDs by default.
- Enum path params must declare an `enumParams` allowlist.
- Backend fetches use `redirect: 'manual'`.
- The BFF marker and secret are generated server-side and cannot be overridden by the browser.
- `BFF_PROXY_SECRET` is required whenever trusted auth proxying runs; the repository dev scripts auto-provision one shared local value. An HTTPS `API_BASE_URL` is additionally required in production.
- Request headers and response headers use explicit allowlists.
- Every BFF request has an `X-Request-ID` that is sent to the backend and returned to the browser.
- Logs never include request bodies, cookies, auth tokens, or the BFF secret.

## Error contract

BFF-generated errors use the canonical envelope:

```json
{
  "status": "error",
  "message": "...",
  "code": "BAD_GATEWAY",
  "requestId": "..."
}
```

Main transport classifications:

- `400 INVALID_ROUTE_PARAMETER`;
- `403 CSRF_VALIDATION_FAILED`;
- `413 PAYLOAD_TOO_LARGE`;
- `415 UNSUPPORTED_MEDIA_TYPE`;
- `500 CONFIGURATION_ERROR`;
- `502 BAD_GATEWAY` or `INVALID_BACKEND_RESPONSE`;
- `504 GATEWAY_TIMEOUT`.

## Required environment

Server-only:

- `API_BASE_URL`;
- `BFF_PROXY_SECRET` in production;
- `AUTH_COOKIE_DOMAIN` when a domain cookie is intentionally required;
- `AUTH_COOKIE_SAME_SITE` (`lax`, `strict`, or `none`);
- `NODE_ENV`;
- `BFF_TRUSTED_PROXY_PROVIDER` (`none`, `vercel`, or `cloudflare`).

`BFF_PROXY_SECRET` must never use a `NEXT_PUBLIC_` prefix.

## Checks

```bash
pnpm --filter @e-pharmacy/next-api lint
pnpm --filter @e-pharmacy/next-api type-check
pnpm --filter @e-pharmacy/next-api test
pnpm --filter @e-pharmacy/next-api test:integration
pnpm --filter @e-pharmacy/next-api test:security
pnpm --filter @e-pharmacy/next-api build

pnpm check:next-api-boundaries
pnpm check:next-api-routes
pnpm check:next-api-contracts
```

## Cookie ownership and expiry

The Next.js BFF is the sole owner of browser-domain auth cookies. Trusted backend auth responses include `accessTokenExpiresIn` and `refreshTokenExpiresIn` in seconds, and the BFF uses those values directly for `Max-Age`. Client code only reads the non-HttpOnly auth hint; it does not duplicate cookie domain or SameSite settings through `NEXT_PUBLIC_*` variables.

`AUTH_COOKIE_LEGACY_DOMAINS` may contain a comma-separated list of previous cookie domains that must be expired during migration. Current-domain and host-only variants are always cleared as well.

## Cache policy

- private, auth, optional-auth details and `/api/health` use `no-store`;
- public product/pharmacy lists use the route factory default (`120s` plus SWR);
- filters/options explicitly use `600s` plus SWR;
- public reviews use `no-store` so a newly created review is immediately visible;
- `publicBackendApiRequest` defaults to `cache: 'no-store'` unless a caller explicitly supplies `next.revalidate` or another cache policy;
- sitemap requests explicitly use `next.revalidate: 3600` in the client app.

Public cache seconds are validated as finite integers from `0` through `86400`.

## Repository checks

The repository exposes:

```bash
pnpm check:next-api-boundaries
pnpm check:next-api-routes
pnpm check:next-api-contracts
```

The package also provides real ESLint, type-check, build, unit/integration/security test and clean scripts.

## Response body contract

JSON requests require a valid JSON response. A `204` or `205` response is accepted only when the caller explicitly passes `responseType: 'no-content'`; successful JSON envelopes remain a separate response contract.

## Trusted client IP

The BFF never trusts browser-supplied `X-Forwarded-For`. Client IP forwarding is disabled by default. Set `BFF_TRUSTED_PROXY_PROVIDER=vercel` to read `X-Vercel-Forwarded-For`, or `cloudflare` to read `CF-Connecting-IP`, only when that provider owns the ingress path.

## Route contract parity

`scripts/checks/routes/next-api-route-contracts.json` is the explicit BFF contract. `pnpm check:next-api-routes` verifies every client/pharmacy route file, HTTP method, access mode, optional-auth policy, and corresponding Express method/path.
