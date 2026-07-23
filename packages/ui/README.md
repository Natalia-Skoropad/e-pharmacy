# @e-pharmacy/ui

Shared React 19 and Next.js 16 UI system for the client, pharmacy cabinet, and future admin application.

## Responsibility

The package contains stable design-system primitives, reusable form and data-display composites, accessible overlay foundations, shared layouts, media presentation, and cabinet shell components.

It does not contain API calls, data fetching, domain validation rules, order workflows, pharmacy-note controllers, domain statistics, or backend code.

## Public entrypoints

- `@e-pharmacy/ui/primitives`
- `@e-pharmacy/ui/forms`
- `@e-pharmacy/ui/data-display`
- `@e-pharmacy/ui/navigation`
- `@e-pharmacy/ui/overlays`
- `@e-pharmacy/ui/media`
- `@e-pharmacy/ui/layout`
- `@e-pharmacy/ui/cabinet`
- `@e-pharmacy/ui/feedback`
- `@e-pharmacy/ui/modals`
- `@e-pharmacy/ui/status-pages`
- `@e-pharmacy/ui/statistics`

The root entrypoint intentionally exports only stable primitives. Do not use deep imports from `@e-pharmacy/ui/src/**`.

## Framework position

The package is intentionally Next.js-specific. `next`, `react`, and `react-dom` are peer dependencies. Next-specific navigation and image components are exposed through explicit public entrypoints instead of hidden adapters.

## Dependency direction

`types/config -> utils/validation/hooks -> ui -> apps`

Data and API layers must never import UI types.
