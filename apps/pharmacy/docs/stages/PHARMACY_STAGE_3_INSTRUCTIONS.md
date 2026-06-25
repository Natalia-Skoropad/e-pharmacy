# Pharmacy Cabinet — Stage 3

## What was added

This patch continues the Pharmacy Cabinet frontend implementation.

### Demo access

A local demo pharmacy account was added so the cabinet can be opened before the real backend pharmacy auth flow is ready.

Demo credentials:

```txt
Email: pharmacy.demo@e-pharmacy.test
Password: Pharmacy123!
```

The login page also has a `Use demo account` button that fills these credentials automatically.

### Shared Pharmacy UI primitives

Added reusable typed UI primitives for the Pharmacy app:

- `StatusBadge`
- `StatusBanner`
- `StatsCard`
- `TableToolbar`
- `TableEmptyState`
- `TableNothingFoundState`
- `DataTable`
- `DetailsCard`
- `ReadonlyField`
- `ActionBar`
- `PharmacyPageHeader`

### Dashboard

The `/pharmacy/dashboard` page was updated from a placeholder to a structured dashboard with demo statistics:

- pharmacy status banner;
- orders statistics;
- local year/month controls for order stats;
- clients statistics;
- products statistics;
- product requests statistics;
- quick actions.

Status cards link to clean filtered Pharmacy URLs.

## How to apply

Copy the files from this archive into the root of `e-pharmacy-3` and allow overwriting existing files.

Then run:

```bash
pnpm check:pharmacy
```

## Suggested commit

```bash
git add .
git commit -m "feat(pharmacy): add dashboard primitives and demo access"
```
