# E-PHARMACY

E-PHARMACY is a portfolio full-stack e-commerce project for an online pharmacy ecosystem, built with production-oriented architecture. The project is structured as one connected platform instead of several duplicated applications: one shared backend API, one MongoDB database, three frontend apps, and shared packages for reusable logic.

## Ecosystem

```txt
apps/client  -> public customer storefront
apps/vendor  -> private pharmacy/vendor cabinet, planned next
apps/admin   -> private admin dashboard, planned after vendor
apps/api     -> one shared backend API for the whole ecosystem
```

## Current release status

- `apps/client` is the first complete release target and contains the finished customer storefront flow.
- `apps/api` is the shared backend used by the client and already keeps future vendor/admin modules in mind.
- `apps/vendor` is a planned pharmacy owner cabinet and currently has a roadmap README.
- `apps/admin` is a planned administration dashboard and currently has a roadmap README.
- Private/customer-only routes are intentionally excluded from indexing: cart, checkout, profile, auth pages, vendor, and admin.

## Live deployment

```txt
Client: https://e-pharmacy-client-ten.vercel.app
API:    https://e-pharmacy-api-pbaz.onrender.com
```

## Apps

- `apps/client` — customer storefront for pharmacies, medicines, cart, checkout, profile, reviews, and orders.
- `apps/api` — shared Express/MongoDB API for auth, stores, products, reviews, favorites, cart, and orders.
- `apps/vendor` — planned pharmacy/vendor cabinet for shop and medicine management.
- `apps/admin` — planned admin dashboard for orders, products, customers, suppliers, and statistics.

## Packages

- `packages/ui` — shared UI contracts and reusable UI foundation.
- `packages/types` — shared TypeScript domain types.
- `packages/api-client` — shared API client entry point.
- `packages/validation` — shared validation constants and schemas.
- `packages/config` — shared TypeScript and workspace configuration.
- `packages/utils` — shared utility helpers.

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

## Local environment checklist

Use these values for local development.

### Client

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
```

### API

```env
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/e-pharmacy?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d
JWT_RESET_EXPIRES_IN=15m
CLIENT_ORIGINS=http://localhost:3000
CLIENT_APP_URL=http://localhost:3000
AUTH_COOKIE_SAME_SITE=lax
```

## Production environment checklist

### API / Render

The deployed client uses a Next.js BFF layer for private customer flows. Browser requests for auth, cart, and orders go to same-origin `/api/*` route handlers first, and those handlers proxy the request to the Express API.

```txt
Browser -> Next.js same-origin /api/* route handlers -> Express API -> MongoDB
```

For this architecture, the API still owns authentication and authorization. It sets the real httpOnly auth cookie, the Next BFF copies `Set-Cookie` back to the browser response, and future private requests forward cookies from the BFF to the backend.

```env
NODE_ENV=production
CLIENT_ORIGINS=https://e-pharmacy-client-ten.vercel.app
CLIENT_APP_URL=https://e-pharmacy-client-ten.vercel.app
AUTH_COOKIE_DOMAIN=
AUTH_COOKIE_SAME_SITE=lax
```

`AUTH_COOKIE_SAME_SITE=lax` fits the same-origin BFF flow because the browser communicates with the client domain first. Use `AUTH_COOKIE_SAME_SITE=none` only if the browser is intentionally allowed to call the API directly across different sites.

Also configure production MongoDB, JWT, SMTP, and other API secrets in the API hosting provider.

### Client / Vercel

```env
NEXT_PUBLIC_SITE_URL=https://e-pharmacy-client-ten.vercel.app
NEXT_PUBLIC_API_BASE_URL=https://e-pharmacy-api-pbaz.onrender.com
```

### Client/API request strategy

- Public catalog, product, pharmacy, sitemap, and metadata data may be fetched server-side from the shared backend API.
- Private mutations and customer session flows use the Next BFF: auth, cart, checkout, orders, profile, and password updates.
- Backend middleware validates the real auth cookie for private data. UI guards and redirects are only user-experience helpers.
- The client-readable `e_pharmacy_auth_ready` marker cookie is not an auth token. It is used only for route redirects and auth bootstrap convenience.
- Cookie-based mutations are protected with a same-origin BFF flow and backend Origin/Referer validation for non-safe HTTP methods. For a larger production deployment, this can be extended with CSRF tokens.

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

## SEO and indexing overview

The client app uses clean public routes, dynamic metadata, canonical URLs, Open Graph metadata, Twitter card metadata, robots rules, and dynamic sitemap generation. Public catalog and detail routes are indexable, while private/auth/service routes are excluded from sitemap and disallowed in robots.

## Current limitations / Roadmap

- `apps/client` is the completed release target for the current portfolio version.
- `apps/vendor` and `apps/admin` are roadmap-only applications for now.
- Auth uses an httpOnly cookie issued by the shared API and transported through the client BFF for private same-origin flows.
- Sitemap generation is suitable for the current dataset. For a larger production catalog, add a dedicated backend SEO endpoint that returns only sitemap-ready fields.

## Author

**Nataliia Skoropad**  
Full-stack Developer  
Backend development, Frontend development, UI/UX design

## License

Portfolio full-stack e-commerce project built with production-oriented architecture.
