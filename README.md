# E-PHARMACY

E-PHARMACY is a full-stack e-commerce project for an online pharmacy. The project is organized as a monorepo with a client storefront, a pharmacy cabinet, a shared backend API, shared workspace packages, and a planned admin application boundary.

## Live Demo

- **Client:** https://e-pharmacy-client-ten.vercel.app
- **API:** https://e-pharmacy-api-pbaz.onrender.com

## Current Status

Implemented:

- `apps/client` — client storefront
- `apps/pharmacy` — pharmacy cabinet
- `apps/api` — shared Express/MongoDB API
- `packages/*` — shared types, utilities, validation, config, auth, API helpers, hooks, and UI contracts

Planned:

- `apps/admin` — admin dashboard

Admin routes and navigation are intentionally created only together with a runnable admin application.

## Main Features

### Client storefront

- Home page and public information pages
- Pharmacies catalog with search, filters, sorting, pagination, details, reviews, and favorites
- Product catalog with search, filters, sorting, pagination, product details, reviews, and favorites
- Cart grouped by pharmacy order
- Checkout with pickup/postal delivery details and client comment
- Client profile, password update, order history, and order details
- Password recovery through email reset flow
- Loading, empty, error, success, not-found, and protected-route states

### Backend API

- Auth with JWT and backend-managed httpOnly cookies
- User profile and password management
- Products, pharmacies, reviews, favorites, cart, and orders
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

| Home                                                    | Product catalog                                                     | Product details                                                       |
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
  client/    # client storefront
  pharmacy/  # pharmacy cabinet
  api/       # shared backend API
  admin/     # planned admin dashboard

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

- `@e-pharmacy/api-client` — HTTP contracts and normalization of external API responses, including strict pagination parsing
- `@e-pharmacy/config` — explicit shared runtime contracts, safe cookie names, business limits, and typed domain presentation maps
- `@e-pharmacy/types` — shared TypeScript domain and API contract types
- `@e-pharmacy/ui` — shared React 19/Next.js 16 UI system with explicit primitives, forms, navigation, overlays, layout, cabinet, media, feedback, status-page, and statistics entrypoints
- `@e-pharmacy/utils` — pure environment-independent utilities for money, dates, numbers, strings, collections, and type guards
- `@e-pharmacy/validation` — frontend validation contracts, canonical domain parsers, normalizers, limits, and patterns

Dependency rules:

- `packages/utils` must not depend on React, Next.js, browser globals, API transport, or application code.
- API response parsing belongs to `packages/api-client`; application routes and navigation stay inside their owning app.
- Cross-application links use environment-owned origins rather than shared pathname constants.
- Canonical working-hours parsing belongs to `packages/validation/pharmacy`.
- Typed domain presentation maps belong to the explicit `@e-pharmacy/config/presentation` entrypoint; `packages/types` contains data contracts and domain types only.
- Calendar dates (`YYYY-MM-DD`) and API instants are separate contracts: instants must include `Z` or an explicit offset, while date-only values use the calendar-date formatter.
- Data/API layers must not import UI types; reusable data contracts live in `packages/types`.
- Backend-only helpers remain inside `apps/api` and must not import workspace packages.

## Environment Variables

Use app-level examples as the source of truth:

```txt
apps/client/.env.example
apps/pharmacy/.env.example
apps/api/.env.example
```

Main local values:

```env
# apps/client
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_PHARMACY_APP_URL=http://localhost:3002
API_BASE_URL=http://localhost:4000
BFF_PROXY_SECRET=

# apps/api
NODE_ENV=development
PORT=4000
MONGODB_URI=mongodb+srv://...
JWT_SECRET=...
CLIENT_ORIGINS=http://localhost:3000,http://localhost:3002,http://localhost:3001
CLIENT_APP_URL=http://localhost:3000
PHARMACY_APP_URL=http://localhost:3002
ADMIN_APP_URL=http://localhost:3001
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
apps/pharmacy/.env.local
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

Run the pharmacy cabinet:

```bash
pnpm dev:pharmacy
```

Seed the database when needed:

```bash
pnpm seed:api
```

## Quality Checks

```bash
pnpm lint
pnpm type-check
pnpm test
pnpm build
pnpm check:before-deploy
```


## Clean Source Archive

Create the final source ZIP with the repository-owned command:

```bash
pnpm archive:source
```

The command stages the source tree, creates `.artifacts/e-pharmacy-source.zip`, and verifies the **actual ZIP entries**. The verifier rejects generated directories and files such as `node_modules`, `.turbo`, `.next`, `dist`, coverage output, `*.tsbuildinfo`, and nested ZIP archives containing forbidden content.

Verify an existing final artifact explicitly:

```bash
pnpm check:archive-artifact -- path/to/e-pharmacy-source.zip
```

Do not assemble release archives by zipping the working directory or by nesting app ZIP files manually; use `archive:source` so the final artifact follows the same policy checked by `check:before-deploy`.

Config-specific architecture and parity checks:

```bash
pnpm check:config-boundaries
pnpm check:config-public-api
pnpm check:config-unused-exports
pnpm check:config-contracts
```

Useful scoped checks:

```bash
pnpm check:client
pnpm check:pharmacy
pnpm check:api
```

## Implementation Notes

The strongest completed parts of the project are the client storefront, pharmacy cabinet, backend API, SEO routing, cookie-based auth flow, cart/checkout/order logic, and shared monorepo structure.

The admin app remains a planned ecosystem extension and does not publish speculative routes or navigation contracts.

## Canonical cart, stock, and order rules

- Stock is stored only on `ProductOffer` as `totalQuantity`, `availableQuantity`, and `reservedQuantity`.
- The invariant is `totalQuantity = availableQuantity + reservedQuantity`; availability is derived from `availableQuantity > 0`.
- One Client User has one multi-pharmacy Cart. Each pharmacy group creates one separate Order.
- A Cart may contain products from no more than 15 pharmacies to prevent accidental creation of an excessive number of orders. The client should confirm existing groups before adding another pharmacy.
- Cart items reference `ProductOffer` and display its current price. Price becomes immutable only when an Order is confirmed.
- Order stock stays reserved while the Order is `new` or `in_progress`; it is committed on `successful` and released on `rejected`.
- Canonical types are `PaymentMethod` and `DeliveryMethod`; postal delivery uses `postal_delivery`.
- Product categories come from the shared `PRODUCT_CATEGORIES` constant.
