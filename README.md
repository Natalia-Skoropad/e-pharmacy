# E-PHARMACY

E-PHARMACY is a portfolio full-stack e-commerce project for an online pharmacy ecosystem, built with production-oriented architecture and deployment-ready configuration.

The current release focuses on a completed customer storefront and a shared Express/MongoDB API foundation. Vendor and admin apps are documented as roadmap-only ecosystem extensions, not as completed production modules.

## Live Demo

**Live client:** https://e-pharmacy-client-ten.vercel.app  
**Live API:** https://e-pharmacy-api-pbaz.onrender.com

## Project Overview

E-PHARMACY is organized as one connected monorepo instead of duplicated standalone applications. The project demonstrates a customer-facing e-commerce flow for pharmacies and medicines, backend persistence, cookie-based authentication, a same-origin Next.js BFF layer for private browser flows, SEO-oriented public pages, and a roadmap for future vendor/admin work.

The main portfolio value is the production-minded architecture: one backend API, one MongoDB database, a customer storefront, shared workspace packages, clear release boundaries, and deployment notes that match the current code.

## Current Portfolio Release

Current portfolio release includes:

- completed customer storefront in `apps/client`
- shared backend API foundation in `apps/api`
- MongoDB persistence for users, products, stores, cart, reviews, favorites, and orders
- same-origin Next.js BFF route handlers for private customer flows
- production-oriented SEO, auth, cart, checkout, profile, reviews, favorites, and order flows

Planned only:

- `apps/vendor` — pharmacy/vendor cabinet roadmap
- `apps/admin` — admin dashboard roadmap

The `apps/vendor` and `apps/admin` folders are intentionally present to document the wider ecosystem direction, but they should not be reviewed as completed portfolio applications yet.

## Screenshots

| Home | Medicines catalog | Product details |
| --- | --- | --- |
| ![Home page](./apps/client/public/readme/home-page.jpg) | ![Product catalog](./apps/client/public/readme/product-catalog.jpg) | ![Product details page](./apps/client/public/readme/product-page.jpg) |

| Pharmacy catalog | Cart | Order confirmation |
| --- | --- | --- |
| ![Pharmacy catalog](./apps/client/public/readme/pharmacy-catalog.jpg) | ![Cart page](./apps/client/public/readme/cart-page.jpg) | ![Order confirmation page](./apps/client/public/readme/order-confirmation-page.jpg) |

| Profile | Order details | 404 page |
| --- | --- | --- |
| ![Profile page](./apps/client/public/readme/profile-page.jpg) | ![Order details page](./apps/client/public/readme/order-page.jpg) | ![404 page](./apps/client/public/readme/404-page.jpg) |

## Key Features

### Customer storefront

- responsive public home page
- pharmacy stores catalog with search, city filtering, sorting, pagination, details, reviews, and favorites
- medicines catalog with search, category/pharmacy filters, availability filters, sorting, pagination, details, reviews, and favorites
- root-level SEO-friendly product and pharmacy detail URLs with product/store resolver and canonical redirects
- cart grouped by pharmacy invoices
- checkout with pickup/post delivery details and customer comments
- persisted customer orders and order details
- customer profile editing and password update flow
- password recovery through email reset flow
- loading, empty, error, not-found, success, and protected-route states

### Auth and private customer flows

- JWT auth stored through backend-managed httpOnly cookies
- same-origin Next.js BFF proxy for auth/cart/orders/profile mutations
- backend `authenticate` middleware as the real data access boundary
- client-readable auth marker used only for UX redirects/session bootstrap

### SEO

- dynamic metadata for public pages
- canonical URL strategy for detail and catalog pages
- Open Graph and Twitter card metadata
- robots rules and dynamic sitemap generation
- noindex rules for private, auth, service, search, sorting, pagination, and temporary catalog states
- breadcrumbs generated from route data

### Backend foundation

- shared Express API for the ecosystem
- MongoDB/Mongoose models for customer-facing business data
- Zod validation and centralized error handling
- rate limiting, Helmet, CORS, and Origin/Referer validation for cookie-based mutations
- role middleware foundation for future vendor/admin work

## Architecture

```txt
apps/client  -> completed public customer storefront
apps/api     -> shared Express/MongoDB backend API foundation
apps/vendor  -> planned pharmacy/vendor cabinet roadmap only
apps/admin   -> planned admin dashboard roadmap only

packages/*   -> shared workspace packages for reusable contracts,
                validation, utilities, and project configuration,
                with room for future expansion
```

The project uses one backend API and one MongoDB database. Future vendor and admin modules should extend the same backend instead of creating duplicated APIs.

Shared packages are intentionally lightweight in the current release. They provide reusable contracts, validation helpers, slug utilities, API response types, and project configuration, but they are not presented as a large design system yet.

Current package scope:

- `packages/ui` — shared UI contracts such as button variants and sizes
- `packages/types` — generic shared TypeScript types
- `packages/api-client` — shared API response types and request header constants
- `packages/validation` — shared validation limits, patterns, and sanitizers
- `packages/config` — shared app names, route segments, and TypeScript configuration
- `packages/utils` — shared utility helpers such as slug builders

## Frontend ↔ Backend Flow

The client uses two intentional data paths:

```txt
Public/server data -> Express API -> MongoDB
Browser private flow -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

Public catalog data, SEO metadata, sitemap data, and read-only pages may be fetched server-side from the backend API.

Private customer flows use the Next.js BFF layer:

```txt
Browser -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

This applies to auth, cart, checkout, orders, profile updates, password updates, review/favorite mutations, and other customer-only mutations. The backend sets the real httpOnly auth cookie, the Next BFF copies `Set-Cookie` back to the browser response, and later BFF requests forward cookies to the backend.

The client-readable `e_pharmacy_auth_ready` cookie is only a UX/session marker for redirects and auth bootstrap. It is not an auth token and does not authorize access to backend data. Real private access is controlled by backend middleware.

## Frontend Audit Notes

The customer storefront uses Next.js App Router with clear public/private route groups, route-level metadata, dynamic `robots.ts`, dynamic `sitemap.ts`, canonical detail redirects, BFF route handlers, route guards, reusable components, CSS Modules, and shared accessibility hooks.

Important frontend boundaries documented in the current release:

- Private pages under `apps/client/src/app/(private)` are marked `noIndex: true` and are not included in `sitemap.ts`, because `SITEMAP_STATIC_ROUTES` is derived from `INDEXABLE_ROUTES`.
- The root dynamic detail route `apps/client/src/app/(public)/[slugId]/page.tsx` resolves products and pharmacies by slug-id, renders the matching detail page, and redirects legacy or non-canonical URLs to canonical root URLs.
- `AuthProvider` is global because header, cart, favorites, protected routes, and customer actions depend on auth state. Its bootstrap stays lightweight: it reads the client-readable session marker first and calls `/api/auth/me` only when that marker exists.
- The current interface is English, so `html lang="en"` is intentional. Ukrainian localization should be handled as a future i18n task, not as a standalone `lang` change.

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- CSS Modules
- Lucide React

### Backend

- Node.js
- Express
- TypeScript
- MongoDB
- Mongoose
- Zod
- Nodemailer
- Handlebars

### Tooling

- pnpm workspaces
- Turborepo
- ESLint
- Prettier

## Project Structure

```txt
apps/
  client/
    public/
      icons/
      og/
      readme/
    src/
      app/
        (private)/
          cart/
          checkout/[slugId]/
          profile/orders/[orderId]/
        (public)/
          (auth)/
          (info)/
          (medicines)/
          (pharmacies)/
          [slugId]/
        api/
          auth/
          cart/
          orders/
          products/
          stores/
        robots.ts
        sitemap.ts
      components/
        auth/
        cart/
        checkout/
        common/
        form-fields/
        home/
        info/
        layout/
        medicines-catalog/
        modals/
        pharmacy-stores/
        profile/
      hooks/
      lib/
        api/
        auth/
        cart/
        catalog/
        checkout/
        constants/
        details/
        errors/
        formatters/
        orders/
        reviews/
        routes/
        seo/
        utils/
        validations/
      providers/
      services/
      styles/
      types/

  api/
    src/
      config/
      constants/
      controllers/
      db/
      middlewares/
      models/
      routes/
      schemas/
      scripts/
      services/
      templates/
      types/
      utils/
      app.ts
      server.ts

  vendor/   -> roadmap-only README placeholder
  admin/    -> roadmap-only README placeholder

packages/
  api-client/
  config/
  types/
  ui/
  utils/
  validation/
```

## Environment Variables

Environment variables are documented in the app-level examples:

```txt
apps/client/.env.example -> actual client keys
apps/api/.env.example    -> actual API keys
```

Root README keeps only the overview to avoid documentation drift. Use the `.env.example` files as the source of truth.

### Client overview

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

`NEXT_PUBLIC_SITE_URL` is used for metadata, canonical URLs, sitemap, and robots output. `NEXT_PUBLIC_API_BASE_URL` points Next.js server code and BFF route handlers to the Express API.

### API overview

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
JWT_EXPIRES_IN=7d
JWT_RESET_EXPIRES_IN=15m
CLIENT_ORIGINS=http://localhost:3000
CLIENT_APP_URL=http://localhost:3000
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAME_SITE=lax
SMTP_HOST=...
SMTP_PORT=587
SMTP_USER=...
SMTP_PASSWORD=...
SMTP_FROM="E-PHARMACY <no-reply@your-domain.com>"
```

For the current same-origin BFF deployment model, `AUTH_COOKIE_SAME_SITE=lax` is preferred. Use `AUTH_COOKIE_SAME_SITE=none` only when browser code intentionally calls the API directly across sites.

## Run Locally

```bash
git clone https://github.com/Natalia-Skoropad/e-pharmacy
cd e-pharmacy
pnpm install
```

Run the API:

```bash
pnpm dev:api
```

Run the client:

```bash
pnpm dev:client
```

Seed the database:

```bash
pnpm seed:api
```

## Quality Checks

Before submitting changes or updating deployment, run:

```bash
pnpm lint
pnpm type-check
pnpm build
pnpm check:before-deploy
```

Useful scoped checks:

```bash
pnpm check:client
pnpm check:api
```

## Deployment Notes

- Deploy the customer storefront and shared API as the current portfolio release.
- Configure production `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_API_BASE_URL` for the client.
- Configure production `MONGODB_URI`, `JWT_SECRET`, SMTP values, `CLIENT_ORIGINS`, `CLIENT_APP_URL`, and cookie settings for the API.
- Keep private browser mutations on same-origin `/api/*` client routes.
- Ensure the backend accepts the deployed client origin and blocks unexpected mutation origins.
- Verify auth, cart, checkout, orders, reviews, favorites, sitemap, robots, and metadata after deployment.

## SEO Notes

- Public catalog and detail pages are indexable when they represent stable content.
- Private pages, auth pages, checkout/profile/order pages, and future dashboard paths are excluded from indexing.
- Search, sorting, pagination, unavailable results, and temporary catalog states are noindex to reduce duplicate/thin pages.
- Product and pharmacy detail pages use canonical root-level URLs.
- Sitemap generation includes static public pages and active product/pharmacy detail pages returned by the API.

## Security Notes

- Real private access is controlled by backend `authenticate` middleware and httpOnly auth cookies.
- The `e_pharmacy_auth_ready` marker is only a client-readable UX helper, not authorization.
- The Next.js BFF keeps private browser mutations same-origin and proxies them to the Express API.
- Cookie-based mutations are hardened with Origin/Referer validation on the backend.
- For larger production deployments, CSRF tokens can be added on top of the current same-origin BFF and Origin/Referer strategy.

## Current Limitations / Roadmap

Current limitations:

- Vendor cabinet and admin dashboard are roadmap-only in the current portfolio release.
- Shared packages are intentionally small and should grow only when real reuse appears.
- The current sitemap strategy fits the existing dataset. A larger catalog would benefit from a dedicated backend SEO endpoint with sitemap-ready fields.
- CSRF hardening currently uses same-origin BFF flow plus Origin/Referer validation. A larger production deployment could add CSRF tokens for mutation requests.

Roadmap:

- Implement the vendor cabinet for pharmacy owners
- Add vendor shop management and medicine CRUD
- Implement the admin dashboard
- Add supplier/customer/order management for admin workflows
- Expand shared UI, API client, validation, and type packages as reuse grows naturally
- Add a dedicated SEO data endpoint for larger catalog scaling

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design
