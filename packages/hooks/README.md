# @e-pharmacy/hooks

Small browser-only React lifecycle infrastructure shared by independent applications and UI packages.

## Public entrypoints

```ts
import { useOutsidePointerDown } from '@e-pharmacy/hooks/dom';
import { useDebouncedValue } from '@e-pharmacy/hooks/timing';
```

The package intentionally has no root entrypoint. Deep imports through `src` are unsupported.

## Belongs here

- generic DOM subscriptions used by independent consumers;
- generic timing hooks with explicit cleanup;
- browser-only hooks with stable reusable contracts.

## Does not belong here

- overlay implementation details owned by `@e-pharmacy/ui`;
- auth, favorites, reviews, checkout, cart, orders, products, clients, or pharmacy-profile hooks;
- Next.js router abstractions;
- generic async-effect wrappers that hide cancellation or dependencies.

All entrypoint barrels include `'use client'`. Browser APIs are accessed only inside effects or event handlers.
