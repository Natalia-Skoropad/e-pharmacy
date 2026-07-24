# @e-pharmacy/ui

Shared React 19 and Next.js 16 UI system for the client, pharmacy cabinet, and future admin application.

## Responsibility

The package contains stable design-system primitives, reusable form and data-display composites, accessible overlay foundations, shared layouts, media presentation, and cabinet shell components.

It does not contain API calls, data fetching, domain validation rules, order workflows, pharmacy-note controllers, domain statistics, sales features, or backend code.

## Physical structure

Public folders contain the real component implementations, not forwarding barrels to legacy locations:

- `src/primitives` — framework-neutral buttons, shared `IconButton`, spinner, and SVG primitives;
- `src/forms` — form fields, selects, date filter, uploads, and `MarkdownTextarea`;
- `src/data-display` — tables, counts, reviews, user badges;
- `src/navigation` — Next.js `LinkButton`, breadcrumbs, tabs, controlled pagination, and link pagination;
- `src/overlays` — modal, drawer, tooltip, confirmation dialog;
- `src/media` — logo, image previews, shimmer and file-reading helpers;
- `src/layout` — `Container` and `PageHeader`;
- `src/cabinet` — cabinet sidebar, top bar, side menu and burger control;
- `src/feedback` — comments presentation and toast system;
- `src/statistics` — generic `StatsCard`, `StatsGrid`, status primitives;
- `src/status-pages` — error, not-found and loading presentation.

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
- `@e-pharmacy/ui/status-pages`
- `@e-pharmacy/ui/statistics`

The root entrypoint intentionally exports only stable primitives. Do not use deep imports from `@e-pharmacy/ui/src/**`.

## Framework position

The package is intentionally Next.js-specific. `LinkButton` in the navigation entrypoint is the explicit Next.js link adapter; button-like links are not exposed through a misleading `ButtonLink` alias. `next`, `react`, and `react-dom` are peer dependencies. Next-specific navigation and image components are exposed through explicit public entrypoints instead of hidden adapters.

## Responsive policy

All component styles are mobile-first:

1. base/mobile styles;
2. `@media only screen and (min-width: 768px)`;
3. `@media only screen and (min-width: 1440px)`.

Do not add `767px`, `767.98px`, `1439px`, `1439.98px`, or max-width breakpoint variants.

The canonical page container is:

- mobile: max `375px`, inline padding `20px`;
- tablet: max `768px`, inline padding `32px`;
- desktop: max `1440px`, inline padding `64px`.

## Dependency direction

`types/config -> utils/validation/hooks -> ui -> apps`

Data and API layers must never import UI types. Pharmacy-only composites, such as `WorkingHoursInput`, stay in the pharmacy application until a second real consumer justifies a dedicated shared domain entrypoint.
