# Client application infrastructure

`apps/client/src/lib` contains stable, non-visual contracts owned by the client application. It is not a generic helper folder and must not be imported by the backend, pharmacy application, or shared packages.

## Module categories

```text
api/browser/**   client-only same-origin BFF adapters
api/readers/**   pure reader factories shared by browser/server adapters
api/routes/**    client-local BFF path builders
api/server/**    server-only public backend readers and data classification

auth/**          client authorization and cross-application redirect policy
cart/**          cart state machine, grouping and serialized mutation helpers
catalog/**       URL parsing, canonical paths and server catalog composition
errors/**        semantic client-safe error copy
routes/**        application route contracts and route classification
seo/metadata-copy.ts
                 client-safe metadata text only
seo/server/**    server-only metadata, robots, sitemap and absolute URLs
```

Presentation content belongs beside its feature:

```text
components/home/config/**
components/product-catalog/config/**
components/**/server/**
```

## Environment boundaries

- Browser API modules start with `import 'client-only'`.
- Server API, server catalog loaders, detail loaders and `seo/server/**` start with `import 'server-only'`.
- Client components must not import `api/server`, `details`, or `seo/server`.
- `lib` must not import React components.
- `NEXT_PUBLIC_SITE_URL` is an origin-only HTTP(S) URL. Base paths, credentials, query strings and hashes are rejected.

## API policy

- The import path communicates the environment, so each operation has one short canonical name.
- Read and mutation options cannot override endpoint-owned `method` or `body`.
- AbortSignal is supported consistently for cancellable browser operations.
- Raw JSON is parsed through shared runtime envelope and DTO parsers before application normalization.

## Route policy

- `ROUTES` and `ROUTE_SEGMENTS` are the application source of truth.
- Catalog parsers report malformed, duplicate and unknown segments and redirect to a canonical path.
- Dynamic IDs are runtime validated before being encoded into a route.
- Sitemap, robots, private routes and typed root-level detail paths are checked for parity.
- Product and pharmacy public slugs end with `pr<ObjectId>` and `ph<ObjectId>`, so routing selects one backend resource before loading data.

## Error policy

- UI messages are selected from `transportCode`, `backendCode` and `httpStatus`.
- Raw backend messages are disabled by default.
- Abort is control flow, not a service outage.
- Secondary failures such as reviews or filter dictionaries retain structured reason and request ID while allowing the primary page to render.

## Shared extraction criteria

Move code to a shared package only when at least two applications need the same stable, application-neutral contract. Do not create local files that merely re-export a shared package symbol.

## Automated checks

```bash
pnpm check:client-lib-boundaries
pnpm check:client-lib-public-api
pnpm check:client-lib-unused-exports
pnpm check:client-lib-routes
pnpm check:client-lib-contracts
```
