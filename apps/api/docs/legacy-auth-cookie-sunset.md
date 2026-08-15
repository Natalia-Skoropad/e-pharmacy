# Legacy auth cookie sunset

The legacy `e_pharmacy_auth_token` cookie is a migration fallback from the old
single-token browser-auth flow. It is **not** the preferred authentication
cookie and must not be removed only from source inspection: production traffic
has to prove that no active browser still depends on it.

## Current migration guarantees

- The current `e_pharmacy_access_token` candidate is attempted before the
  legacy cookie. A valid current cookie therefore never falls back to the
  legacy credential.
- When authentication succeeds specifically through the legacy cookie, the API
  emits a structured `security_event` with
  `type: "legacy_auth_cookie_used"`. The raw cookie/token is never logged.
- Next.js logout/invalid-session cleanup expires the legacy cookie alongside the
  current access/refresh cookies, including configured current and legacy
  cookie-domain variants.

## Removal gate

Do not remove the fallback until all of the following are recorded for the
production deployment:

1. Record the deployment date/version from which the current access/refresh
   cookie pair is issued by every client/pharmacy/admin application origin.
2. Observe `legacy_auth_cookie_used` telemetry for at least the maximum legacy
   cookie/session lifetime after that deployment, and confirm the count remains
   zero (or reaches zero and stays there for the agreed observation window).
3. Verify logout and invalid-session responses are exercised from every
   configured application origin and expire host-only/current-domain/legacy-
   domain variants of `e_pharmacy_auth_token`.
4. Only then remove, in one release, the backend legacy-cookie reader, the
   Next.js forwarding fallback, legacy-cookie cleanup code, and the legacy
   cookie constant/tests.

The migration date and telemetry evidence are deployment records and therefore
cannot be inferred from this source archive.
