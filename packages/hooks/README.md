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
