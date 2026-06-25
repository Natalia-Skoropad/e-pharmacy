# Pharmacy Cabinet — Stage 2 instructions

## What this stage adds

Stage 2 continues the Pharmacy Cabinet foundation after the first app initialization stage.

Implemented in `apps/pharmacy`:

- auth BFF route handlers for `/api/auth/*`;
- browser auth API layer;
- `AuthProvider` integration in the root layout;
- protected pharmacy access guard for `/pharmacy/*`;
- coarse Next `proxy.ts` redirect for users without auth cookies;
- pharmacy login page at `/auth/login`;
- desktop sidebar;
- mobile/tablet header;
- mobile menu with backdrop, Escape close, body scroll lock and focus trap through shared `MobileOffcanvasBase`;
- active navigation state for nested routes;
- logout button in header, sidebar and mobile menu;
- shared `Breadcrumbs` integration for protected pages;
- breadcrumb config/helpers for list, details, new and edit pages.

## How to apply

Copy the `apps/pharmacy` folder from this archive into the project root and allow files to be replaced.

Then run:

```bash
pnpm install
pnpm check:pharmacy
```

`pnpm install` is needed because `apps/pharmacy/package.json` now includes `lucide-react`, which is required by shared UI layout components.

## Environment variables

Update `apps/pharmacy/.env.local` based on `.env.example`:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3002
NEXT_PUBLIC_API_URL=http://localhost:4000
API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_AUTH_COOKIE_DOMAIN=
NEXT_PUBLIC_AUTH_COOKIE_SAME_SITE=lax
```

## Manual QA checklist

- Open `/auth/login`.
- Open `/pharmacy/dashboard` without cookies and verify redirect to `/auth/login?redirect=...`.
- Login as pharmacy and verify redirect to `/pharmacy/dashboard`.
- Login as client/admin and verify role redirect fallback.
- Check desktop width: sidebar is visible, header is hidden.
- Check mobile/tablet width: header and burger are visible, sidebar is hidden.
- Open mobile menu and check backdrop close, Escape close and route-change close.
- Check nested routes: active sidebar/mobile link remains active.
- Check breadcrumbs on list and details pages.

## Commit

```bash
git add .
git commit -m "feat(pharmacy): add protected cabinet layout"
```

Optional detailed commit:

```bash
git add .
git commit -m "feat(pharmacy): add protected cabinet layout" -m "Add pharmacy auth provider, BFF auth routes, protected routing, login page, responsive shell with sidebar and mobile menu, logout actions, active navigation, and shared breadcrumbs."
```
