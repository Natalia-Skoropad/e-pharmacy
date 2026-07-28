# `@e-pharmacy/api-client`

Framework-neutral API foundation for the e-pharmacy workspace.

## Responsibility

The package owns:

- canonical backend route contracts (`/products`, `/orders`, `/auth`, …);
- safe URL and query construction;
- HTTP execution, overall timeout, retry and cancellation;
- JSON media-type detection and parsing;
- runtime success/error envelope parsing;
- canonical `ApiError` transport and backend metadata;
- strict pagination normalization.

It does **not** own:

- application-local `/api/*` routes;
- Next.js cookies, route handlers, cache defaults or proxy security;
- endpoint view models, UI fallback copy, React state or navigation;
- backend controllers, DTO serializers or database logic.

Ownership is intentionally split as follows:

```text
canonical backend routes → @e-pharmacy/api-client/contracts
shared auth BFF routes   → @e-pharmacy/next-api/contracts
client local routes      → apps/client
pharmacy local routes    → apps/pharmacy
```

## Runtime response pipeline

A generic type is not runtime validation.

```text
Response
→ content-type validation
→ JSON parse result
→ API envelope parser
→ endpoint DTO parser
→ domain normalization
→ application view model
```

`application/problem+json` and other structured `+json` media types are treated
as JSON. Valid JSON `null`, non-JSON and malformed JSON remain distinct states.

JSON requesters return `unknown`. A domain type appears only after
`parseApiResponseData()` validates the success envelope and invokes an explicit
endpoint DTO parser. Application view-model normalization remains app-local.

## Transport policy

- `apiRequest` requires a configured `baseUrl`; `createApiClient` is preferred.
- `timeoutMs` is the deadline for the complete operation, including retries.
- GET is the only retryable method by default.
- retry delays are abortable and retry responses are cancelled before reuse.
- a caller `AbortSignal` does not disable retry; aborting it ends the operation.
- server adapters must use `redirect: 'manual'`.
- Next.js `revalidate` and `tags` options belong to `@e-pharmacy/next-api/server`,
  not to the framework-neutral transport contract.
- `429` and `Retry-After` are not retried automatically without product policy.

## Request bodies

The public transport supports:

- JSON objects and arrays;
- strings;
- `URLSearchParams`.

Multipart, blobs, streams and binary bodies are intentionally outside this
JSON-oriented contract. Upload/download flows require a separate explicit
adapter. GET bodies, non-JSON object content types, custom `toJSON`, cyclic
objects and `BigInt` serialization failures are rejected as
`INVALID_REQUEST_BODY`. Request payloads are not copied into transport errors.

## Pagination

Canonical pagination uses `items` and an empty result has:

```json
{
  "items": [],
  "page": 1,
  "perPage": 10,
  "total": 0,
  "totalPages": 0
}
```

Legacy item aliases must be declared with `legacyItemKeys`. The old empty-page
shape (`totalPages: 1`) is accepted only with
`legacyEmptyPage: 'normalize-to-zero'`; it is normalized to `page: 1` and
`totalPages: 0`. Normalization metadata is returned and can be reported by
`requirePaginatedResponse`.

## Public entrypoints

```text
@e-pharmacy/api-client/contracts
@e-pharmacy/api-client/transport
@e-pharmacy/api-client/response
```

Root and deep imports are forbidden. Low-level URL/body/retry implementation
helpers are internal unless explicitly exported from a listed entrypoint.

## Build policy

This is a source workspace package: consumers resolve exports from `src` and
Next.js transpiles the package. `build` is a declaration verification build.
It cleans `dist` and emits only API-client declarations:

```text
dist/contracts/**
dist/transport/**
dist/response/**
```

Workspace dependency builds are separate; `types` and `utils` must never be
copied into `packages/api-client/dist`.
