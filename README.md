# E-PHARMACY

E-PHARMACY is a portfolio full-stack e-commerce project for an online pharmacy ecosystem, built with production-oriented architecture. The project is organized as one connected monorepo instead of duplicated standalone apps: a completed customer storefront, one shared Express/MongoDB API foundation, and planned vendor/admin applications for future expansion.

## Project Preview

**Live client:** https://e-pharmacy-client-ten.vercel.app  
**Live API:** https://e-pharmacy-api-pbaz.onrender.com

### Screenshots

| Home | Medicines catalog | Product details |
| --- | --- | --- |
| ![Home page](./apps/client/public/readme/home-page.jpg) | ![Product catalog](./apps/client/public/readme/product-catalog.jpg) | ![Product details page](./apps/client/public/readme/product-page.jpg) |

| Pharmacy catalog | Cart | Order confirmation |
| --- | --- | --- |
| ![Pharmacy catalog](./apps/client/public/readme/pharmacy-catalog.jpg) | ![Cart page](./apps/client/public/readme/cart-page.jpg) | ![Order confirmation page](./apps/client/public/readme/order-confirmation-page.jpg) |

## Current Portfolio Release

Current portfolio release includes:

- completed customer storefront in `apps/client`
- shared backend API foundation in `apps/api`
- MongoDB persistence for users, products, stores, cart, reviews, and orders
- same-origin Next.js BFF layer for private customer flows
- production-oriented SEO, auth, cart, checkout, and order flows

Planned:

- `apps/vendor` — pharmacy/vendor cabinet roadmap only
- `apps/admin` — admin dashboard roadmap only

The vendor and admin folders are intentionally present to show the final ecosystem direction, but they are not part of the completed portfolio release yet.

## Key Features

### Customer storefront

- responsive public home page
- pharmacy stores catalog with search, city filtering, sorting, pagination, details, reviews, and favorites
- medicines catalog with search, category/pharmacy filters, availability filters, sorting, pagination, details, reviews, and favorites
- cart grouped by pharmacy invoices
- checkout with pickup/post delivery data and customer comments
- persisted customer orders and order details
- profile editing and password update flow
- password recovery through email reset flow
- loading, empty, error, not-found, success, and protected-route states

### SEO and routing

- clean public routes and root-level product/pharmacy detail URLs
- dynamic metadata for public pages
- Open Graph and Twitter card metadata
- canonical URL strategy for detail and catalog pages
- robots rules and dynamic sitemap generation
- noindex rules for private, auth, search, sorting, pagination, and temporary catalog states
- breadcrumbs generated from route data

### Backend foundation

- shared Express API for the ecosystem
- MongoDB/Mongoose models for customer-facing business data
- JWT auth stored through httpOnly cookies
- backend `authenticate` middleware for private data
- order persistence in MongoDB
- Zod validation, centralized error handling, rate limiting, Helmet, CORS, and Origin/Referer validation for cookie-based mutations

## Architecture Overview

```txt
apps/client  -> completed public customer storefront
apps/api     -> shared Express/MongoDB backend API
apps/vendor  -> planned pharmacy/vendor cabinet roadmap
apps/admin   -> planned admin dashboard roadmap

packages/*   -> shared workspace packages for reusable contracts,
                validation, utilities, and project configuration
```

The project uses one backend API and one MongoDB database. Future vendor and admin modules should extend the same backend instead of creating duplicated APIs.

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

This applies to auth, cart, checkout, orders, profile updates, password updates, and other customer-only mutations. The backend sets the real httpOnly auth cookie, the Next BFF copies `Set-Cookie` back to the browser response, and later BFF requests forward cookies to the backend.

The client-readable `e_pharmacy_auth_ready` cookie is only a UX/session marker for redirects and auth bootstrap. It is not an auth token and does not authorize access to backend data. Real private access is controlled by backend middleware.

## Packages

Shared workspace packages currently provide reusable contracts, validation helpers, slug utilities, API response types, and project configuration, with room for future expansion.

Current package scope is intentionally lightweight:

- `packages/ui` — shared UI contracts such as button variants and sizes
- `packages/types` — generic shared TypeScript types
- `packages/api-client` — shared API response types and request header constants
- `packages/validation` — shared validation limits, patterns, and sanitizers
- `packages/config` — shared app names, route segments, and TypeScript configuration
- `packages/utils` — shared utility helpers such as slug builders

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

For the current same-origin BFF deployment model, `AUTH_COOKIE_SAME_SITE=lax` is preferred. Use `AUTH_COOKIE_SAME_SITE=none` only when the browser intentionally calls the API directly across sites.

## Getting Started

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

## Production Notes

- The customer storefront is the completed portfolio release.
- Private customer data is protected by backend middleware, not only by UI redirects.
- The Next.js BFF keeps private browser mutations same-origin and proxies them to the Express API.
- Cookie-based mutations are hardened with Origin/Referer validation on the backend.
- The auth marker cookie is used only for UX redirects and should not be treated as authorization.
- Public SEO pages are indexable; private/auth/service pages are excluded from sitemap and robots.

## Known Limitations

- Vendor cabinet and admin dashboard are roadmap-only in the current portfolio release.
- Shared packages are intentionally small at this stage and are expected to grow as vendor/admin apps are implemented.
- The current sitemap strategy fits the existing dataset. For a larger catalog, a dedicated backend SEO endpoint with sitemap-ready fields would be better.
- CSRF hardening currently uses same-origin BFF flow plus Origin/Referer validation. A larger production deployment could add CSRF tokens for mutation requests.

## Roadmap

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

## License

Portfolio full-stack e-commerce project built with production-oriented architecture.
