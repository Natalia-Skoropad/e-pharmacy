# @e-pharmacy/hooks

Small browser-only React lifecycle infrastructure shared by independent applications and UI packages.

## Public entrypoints

```ts
import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
```

The package intentionally has no root entrypoint. Deep imports through `src` are unsupported.
Each public barrel starts with `'use client'`, while browser APIs are accessed only from effects, scheduled callbacks, or event handlers.

## Belongs here

- generic DOM subscriptions used by independent consumers;
- generic timing hooks with explicit cleanup;
- browser-only hooks with stable reusable contracts;
- infrastructure that has at least two independent source consumers.

## Does not belong here

- overlay implementation details owned by `@e-pharmacy/ui`;
- auth, favorites, reviews, checkout, cart, orders, products, clients, or pharmacy-profile hooks;
- Next.js router abstractions;
- generic async-effect wrappers that hide cancellation or dependencies;
- UI context hooks such as `useToast` or internal listbox behavior.

## Lifecycle rules

- subscriptions must remove exactly the listener they registered;
- timers and animation frames must be cancelled during cleanup;
- callback changes must not require repeated global subscriptions;
- DOM hooks must be safe when `window` or `document` is unavailable;
- network cancellation remains the responsibility of feature hooks and API clients;
- Strict Mode setup-cleanup-setup must not duplicate work.

## Commands

```bash
pnpm --filter @e-pharmacy/hooks lint
pnpm --filter @e-pharmacy/hooks type-check
pnpm --filter @e-pharmacy/hooks test
pnpm --filter @e-pharmacy/hooks test:dom
pnpm --filter @e-pharmacy/hooks build
pnpm --filter @e-pharmacy/hooks check:boundaries
pnpm check:hooks-public-api
```

The Node test runner resolves extensionless TypeScript imports in the same form used by production source. DOM-subscription tests use controlled event targets, and UI-owned overlay interaction tests live under `packages/ui/src/internal/overlay/__tests__`.

## Ownership map

The shared package deliberately contains only two generic contracts:

| Contract | Owner | Typical consumers |
|---|---|---|
| `useOutsidePointerDown` | `@e-pharmacy/hooks/dom` | UI selects/tabs and the pharmacy header |
| `useDebouncedValue` | `@e-pharmacy/hooks/timing` | Client catalog filters and pharmacy list filters |

Related lifecycle code stays with the domain that owns it:

- overlay stack, focus trap, backdrop, scroll lock, and background isolation — `packages/ui/src/internal/overlay`;
- auth session lifecycle — `packages/auth`;
- favorites, reviews, checkout, and cart mutations — client features;
- pharmacy profile and status — `PharmacyProfileProvider` in the pharmacy app;
- toast and listbox hooks — UI-internal/provider APIs.

## Current architecture decisions

- Data fetching remains explicit and abortable before deployment. A query library is deferred to a separate admin-readiness stage so loading and error contracts are not changed inside this refactor.
- The overlay manager is a UI-internal module singleton with deterministic top-layer ownership and a test reset. A context manager is not introduced until multiple React roots require it.
- Sidebar storage remains local to `PharmacyShell`; it uses an SSR snapshot, guarded storage access, and browser subscriptions instead of a generic `useLocalStorageState` abstraction.
- The package exposes no universal `useEventListener` and no `useDebouncedEffect`. Only contracts with multiple independent consumers are public.
- Feature network effects own their `AbortController` and stale-response policy. Generic async-effect wrappers are intentionally forbidden.

## Regression checks

```bash
pnpm check:hooks-boundaries
pnpm check:hooks-public-api
pnpm check:hooks-lifecycle
```

The lifecycle check verifies overlay Escape ownership, session-scoped favorites/cart behavior, synchronous mutation locks, abortable effects, the seven shared debounce consumers, the single pharmacy-profile request owner, honest hooks tooling, and archive hygiene integration. It also prints current lifecycle metrics so drift is visible in CI.
