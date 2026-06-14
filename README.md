# E-PHARMACY

E-PHARMACY is a full-stack e-commerce project for an online pharmacy. The project is organized as a monorepo with a client storefront, a shared backend API, shared workspace packages, and planned app boundaries for pharmacy and admin panels.

## Live Demo

- **Client:** https://e-pharmacy-client-ten.vercel.app
- **API:** https://e-pharmacy-api-pbaz.onrender.com

## Current Status

Implemented:

- `apps/client` — client storefront
- `apps/api` — shared Express/MongoDB API
- `packages/*` — shared types, utilities, validation, config, and small UI contracts

Planned:

- `apps/pharmacy` — pharmacy/pharmacy cabinet
- `apps/admin` — admin dashboard

Pharmacy and admin folders are kept as planned app boundaries. They are not completed applications yet.

## Main Features

### Client storefront

- Home page and public information pages
- Pharmacy stores catalog with search, filters, sorting, pagination, details, reviews, and favorites
- Products catalog with search, filters, sorting, pagination, product details, reviews, and favorites
- Cart grouped by pharmacy invoice
- Checkout with pickup/post delivery details and client comment
- Client profile, password update, order history, and order details
- Password recovery through email reset flow
- Loading, empty, error, success, not-found, and protected-route states

### Backend API

- Auth with JWT and backend-managed httpOnly cookies
- User profile and password management
- Products, stores, reviews, favorites, cart, and orders
- MongoDB/Mongoose data models
- Zod validation
- Centralized error handling
- Rate limiting, Helmet, CORS, and Origin/Referer validation for cookie-based mutations
- Role middleware foundation for future pharmacy/admin work

### SEO and routing

- Dynamic metadata for public pages
- Canonical URLs for catalog and detail pages
- Root-level product and pharmacy detail URLs
- Dynamic sitemap and robots rules
- Noindex rules for private, auth, service, search, sorting, pagination, and temporary catalog states
- Breadcrumbs generated from route data

## Screenshots

| Home                                                    | Products catalog                                                    | Product details                                                       |
| ------------------------------------------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| ![Home page](./apps/client/public/readme/home-page.jpg) | ![Product catalog](./apps/client/public/readme/product-catalog.jpg) | ![Product details page](./apps/client/public/readme/product-page.jpg) |

| Pharmacy catalog                                                      | Cart                                                    | Order confirmation                                                                  |
| --------------------------------------------------------------------- | ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| ![Pharmacy catalog](./apps/client/public/readme/pharmacy-catalog.jpg) | ![Cart page](./apps/client/public/readme/cart-page.jpg) | ![Order confirmation page](./apps/client/public/readme/order-confirmation-page.jpg) |

## Tech Stack

### Frontend

- Next.js 16
- React 19
- TypeScript
- CSS Modules
- Lucide React
- clsx

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
  client/   # client storefront
  api/      # shared backend API
  pharmacy/   # planned pharmacy cabinet
  admin/    # planned admin dashboard

packages/
  api-client/
  config/
  types/
  ui/
  utils/
  validation/
```

## Shared Packages

Current shared packages are intentionally small and are used where reuse already makes sense.

- `@e-pharmacy/api-client` — shared API response types and request constants
- `@e-pharmacy/config` — shared app names, route segments, and TypeScript config
- `@e-pharmacy/types` — generic shared TypeScript types
- `@e-pharmacy/ui` — shared UI contracts such as button variants and sizes
- `@e-pharmacy/utils` — shared helpers such as slug builders
- `@e-pharmacy/validation` — shared validation limits, patterns, and sanitizers

## Environment Variables

Use app-level examples as the source of truth:

```txt
apps/client/.env.example
apps/api/.env.example
```

Main local values:

```env
# apps/client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000

# apps/api
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_ORIGINS=http://localhost:3000
CLIENT_APP_URL=http://localhost:3000
AUTH_COOKIE_SAME_SITE=lax
```

## Run Locally

Install dependencies:

```bash
git clone https://github.com/Natalia-Skoropad/e-pharmacy
cd e-pharmacy
pnpm install
```

Create env files:

```txt
apps/client/.env.local
apps/api/.env
```

Run the API:

```bash
pnpm dev:api
```

Run the client:

```bash
pnpm dev:client
```

Seed the database when needed:

```bash
pnpm seed:api
```

## Quality Checks

```bash
pnpm lint
pnpm type-check
pnpm build
```

Useful scoped checks:

```bash
pnpm check:client
pnpm check:api
```

## Implementation Notes

The strongest completed parts of the project are the client storefront, backend API, SEO routing, cookie-based auth flow, cart/checkout/order logic, and shared monorepo structure.

Pharmacy and admin apps are planned ecosystem extensions, not completed modules yet.
